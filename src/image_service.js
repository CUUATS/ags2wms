const querystring = require('querystring');
const urljoin = require('url-join');
const AgsBaseService = require('./base_service.js');


class AgsImageService extends AgsBaseService {
  getEndpoint() {
    return urljoin('/' + this.data.name, 'ImageServer');
  }

  getLayers() {
    return {
      Layer: [
        {
          Name: 'IMAGE'
        },
        {
          Title: this.data.description
        },
        {
          CRS: 'EPSG:' + this.data.spatialReference.latestWkid
        },
        this.getGeoBBox(),
        this.getBBox(),
        {
          Attribution: [
            {
              Title: this.data.copyrightText
            }
          ]
        }
      ]
    };
  }

  getMapUrl(req, token) {
    let bbox = req.query.bbox || req.query.BBOX;
    let crs = (req.query.crs || req.query.CRS).replace('EPSG:', '');
    let width = req.query.width || req.query.WIDTH;
    let height = req.query.height || req.query.HEIGHT;
    let format = (req.query.format || req.query.FORMAT || '')
      .replace('image/', '');

    return urljoin(this.url, 'exportImage') + '?' + querystring.stringify({
      f: 'image',
      bbox: bbox,
      size: width + ',' + height,
      imageSR: crs,
      bboxSR: crs,
      format: format,
      token: token
    });
  }
}

module.exports = AgsImageService;
