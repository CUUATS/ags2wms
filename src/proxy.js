const express = require('express');
const request = require('request');
const urljoin = require('url-join');
const utils = require('./utils.js');
const AgsImageService = require('./image_service.js');
const AgsMapService = require('./map_service.js');


class AgsProxy {
  constructor(baseUrl, token, port) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.status = {
      pendingRequests: 0,
      services: []
    };
    this.port = port;
    this.app = express();
    this.app.listen(this.port, () => {
      console.log('Listening on port ' + this.port);
    });
  }

  discover(url) {
    this.status.pendingRequets += 1;
    url = url || this.baseUrl;
    request({
      uri: url,
      qs: {
        f: 'json',
        token: this.token
      }
    }, (err, res, body) => {
      if (err) {
        console.log('HTTP error at ' + url + ': ' + err);
        return;
      }

      let data = JSON.parse(body);
      if (data.error) {
        console.log('Error response at ' + url + ': ' + data.error.message);
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
        let agsReq = request(service.getMapUrl(req, this.token));
        agsReq.on('response', (agsRes) => {
          if (agsRes.statusCode !== 200) {
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
