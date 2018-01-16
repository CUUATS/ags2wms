const querystring = require('querystring');
const urljoin = require('url-join');
const AgsBaseService = require('./base_service.js');


class AgsImageService extends AgsBaseService {
  getEndpoint() {
    return urljoin('/' + this.data.name, 'ImageServer');
  }

  getLayers(req) {
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
    let params = this.getWMSParams(req);
    return urljoin(this.url, 'exportImage') + '?' + querystring.stringify({
      f: 'image',
      bbox: params.bbox,
      size: params.width + ',' + params.height,
      imageSR: params.crs.replace('EPSG:', ''),
      bboxSR: params.crs.replace('EPSG:', ''),
      format: params.format.replace('image/', ''),
      token: token
    });
  }
}

module.exports = AgsImageService;
