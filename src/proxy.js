const express = require('express');
const request = require('request');
const urljoin = require('url-join');
const utils = require('./utils.js');
const AgsImageService = require('./image_service.js');
const AgsMapService = require('./map_service.js');


class AgsProxy {
  constructor(config) {
    this.baseUrl = config.url;
    this.tokenUrl = config.tokenUrl;
    this.token = config.token;
    this.user = config.user;
    this.password = config.password;
    this.status = {
      pendingRequests: 0,
      services: []
    };
    this.port = config.port || 8000;
    this.app = express();
    this.app.listen(this.port, () => {
      console.log('Listening on port ' + this.port);
    });
  }

  ensureToken(cb) {
    if (this.token) return cb(null);
    if (!this.user || !this.password) return cb(null);

    let tokenUrl = this.tokenUrl ||
      this.baseUrl.split('/rest/')[0] + '/tokens/';

    request.post({
      url: tokenUrl,
      form: {
        username: this.user,
        password: this.password,
        client: 'requestip',
        expiration: 525600,
        f: 'json'
      }
    }, (err, res, body) => {
      if (err) return cb(err);
      let data = JSON.parse(body);
      if (data.error) cb(data.error.message);
      this.token = data.token
      cb(null);
    });
  }

  get(uri, cb) {
    this.ensureToken((tokenErr) => {
      if (tokenErr) return cb(tokenErr, null);
      let agsReq = request((this.token) ? uri + '&token=' + this.token : uri);
      agsReq.on('response', (agsRes) => {
        if (agsRes.statusCode !== 200) {
          cb('HTTP error', null);
        } else if (/text\/plain/.test(agsRes.headers['content-type'])) {
          let raw = '';
          agsReq.on('data', (chunk) => raw += chunk);
          agsReq.on('end', () => {
            let data = JSON.parse(raw);
            if (data.error && data.error.code === 498) {
              this.token = undefined;
              this.get(uri, cb);
            } else {
              cb(null, data);
            }
          });
        } else {
          cb(null, agsReq);
        }
      });
    });
  }

  discover(url) {
    this.status.pendingRequets += 1;
    url = url || this.baseUrl;
    this.get(url + '?f=json', (err, data) => {
      if (err) {
        console.log('Error at ' + url + ': ' + err);
        return;
      }

      (data.folders || [])
        .forEach((folder) => this.discover(urljoin(this.baseUrl, folder)));
      (data.services || [])
        .filter((service) => service.type == 'ImageServer' ||
          service.type == 'MapServer')
        .forEach((service) => this.discover(
          urljoin(this.baseUrl, service.name, service.type)));

      if (/ImageServer\/?$/.test(url))
        this.addService(new AgsImageService(url, data));
      if (/MapServer\/?$/.test(url))
        this.addService(new AgsMapService(url, data));
    });
  }

  addService(service) {
    console.log('Adding image service: ' + service.getEndpoint());
    this.app.get(service.getEndpoint(), (req, res) => {
      let svc = req.query.service || req.query.SERVICE;
      let op = req.query.request || req.query.REQUEST;
      if (svc != 'WMS') return res.type('xml').send(
        utils.exception('Invalid Service'));
      if (op == 'GetCapabilities') {
        res.type('xml').send(service.getCapabilities(req));
      } else if (op == 'GetMap') {
        this.get(service.getMapUrl(req), (err, agsReq) => {
          if (err) {
            res.type('xml').send(utils.exception('Upstream Error'));
          } else {
            agsReq.pipe(res);
          }
        });
      } else {
        res.type('xml').send(utils.exception(
          'Operation Not Supported', 'OperationNotSupported'));
      }
    });
  }
}

module.exports = AgsProxy;
