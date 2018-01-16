const epsg = require('epsg');
const proj4 = require('proj4');
const xml = require('xml');


class AgsBaseService {
  constructor(url, data) {
    this.url = url;
    this.data = data;
  }

  getOnlineResource(url) {
    return {
      OnlineResource: [
        {
          _attr: {
            'xmlns:xlink': 'http://www.w3.org/1999/xlink',
            'xlink:type': 'simple',
            'xlink:href': url
          }
        }
      ]
    };
  }

  getGeoBBox() {
    let extent = this.data.extent || this.data.fullExtent;
    let crs = 'EPSG:' + extent.spatialReference.latestWkid;
    let project = proj4(epsg[crs], 'WGS84');
    let sw = project.forward([extent.xmin, extent.ymin]);
    let ne = project.forward([extent.xmax, extent.ymax]);
    return {
      EX_GeographicBoundingBox: [
        {
          westBoundLongitude: sw[0]
        },
        {
          eastBoundLongitude: ne[0]
        },
        {
          southBoundLatitude: sw[1]
        },
        {
          northBoundLatitude: ne[1]
        }
      ]
    };
  }

  getBBox() {
    let extent = this.data.extent || this.data.fullExtent;
    let crs = 'EPSG:' + extent.spatialReference.latestWkid;
    return {
      BoundingBox: [
        {
          _attr: {
            CRS: crs,
            minx: extent.xmin,
            miny: extent.ymin,
            maxx: extent.xmax,
            maxy: extent.ymax
          }
        }
      ]
    };
  }

  getDCPType(url) {
    return {
      DCPType: [
        {
          HTTP: [
            {
              Get: [
                this.getOnlineResource(url)
              ]
            }
          ]
        }
      ]
    };
  }

  getCapabilities(req) {
    let baseUrl = req.protocol + '://' + req.get('host');
    return xml([
      {
        WMS_Capabilities: [
          {
            _attr: {
              version: '1.3.0',
              xmlns: 'http://www.opengis.net/wms',
              'xmlns:xlink': 'http://www.w3.org/1999/xlink',
              'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
              'xsi:schemaLocation': 'http://www.opengis.net/wms ' +
                'http://schemas.opengis.net/wms/1.3.0/capabilities_1_3_0.xsd'
            }
          },
          {
            Service: [
              {
                Name: 'WMS'
              },
              {
                Title: this.data.description || this.data.serviceDescription
              },
              {
                Abstract: this.data.serviceDescription || this.data.description
              },
              this.getOnlineResource(baseUrl + this.getEndpoint()),
              {
                MaxWidth: this.data.maxImageWidth
              },
              {
                MaxHeight: this.data.maxImageHeight
              }
            ]
          },
          {
            Capability: [
              {
                Request: [
                  {
                    GetCapabilities: [
                      {
                        Format: 'text/xml'
                      },
                      this.getDCPType(baseUrl + this.getEndpoint())
                    ]
                  },
                  {
                    GetMap: [
                      {
                        Format: 'image/gif'
                      },
                      {
                        Format: 'image/png'
                      },
                      {
                        Format: 'image/jpg'
                      },
                      this.getDCPType(baseUrl + this.getEndpoint())
                    ]
                  }
                ]
              },
              {
                Exception: [
                  {
                    Format: 'XML'
                  }
                ]
              },
              this.getLayers(req)
            ]
          }
        ]
      }
    ], {
      declaration: true
    });
  }

  getWMSParams(req) {
    return {
      bbox: req.query.bbox || req.query.BBOX || '',
      crs: req.query.crs || req.query.CRS || '',
      width: req.query.width || req.query.WIDTH || '',
      height: req.query.height || req.query.HEIGHT || '',
      format: req.query.format || req.query.FORMAT || '',
      layers: req.query.layers || req.query.LAYERS || ''
    };
  }

  // Overriden by subclasses.
  getEndpoint() {
    return '/';
  }

  getLayers(req) {
    return {
      Layer: []
    };
  }

  getMapUrl(req, token) {
    return '';
  }
}

module.exports = AgsBaseService;
