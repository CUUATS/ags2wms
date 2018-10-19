const querystring = require('querystring');
const urljoin = require('url-join');
const AgsBaseService = require('./base_service.js');


class AgsMapService extends AgsBaseService {
  constructor(url, data) {
    super(url, data);
    this.layers = this._extractLayers();
  }

  _extractLayers() {
    let layerMap = {};
    this.data.layers.forEach((def) => layerMap[def.id] = def);

    let layers = [];
    this.data.layers.forEach((def) => {
      if (def.parentLayerId === -1)
        layers.push(this._makeLayer(def, layerMap));
    });
    return layers;
  }

  _makeLayer(layerDef, layerMap) {
    return {
      Layer: [
        {
          Name: layerDef.id
        },
        {
          Title: layerDef.name
        },
        ...(layerDef.subLayerIds || [])
          .map((id) => this._makeLayer(layerMap[id], layerMap))
      ]
    };
  }

  getEndpoint() {
    return this.url.split('rest/services')[1];
  }

  getLayers(req) {
    return {
      Layer: [
        {
          Name: 'DEFAULT'
        },
        {
          Title: this.data.description || this.data.serviceDescription
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
        },
        ...this.layers
      ]
    };
  }

  getMapUrl(req) {
    let params = this.getWMSParams(req);
    return urljoin(this.url, 'export') + '?' + querystring.stringify({
      f: 'image',
      bbox: params.bbox,
      dpi: params.dpi,
      size: params.width + ',' + params.height,
      imageSR: params.crs.replace('EPSG:', ''),
      bboxSR: params.crs.replace('EPSG:', ''),
      format: params.format.replace('image/', ''),
      layers: (/DEFAULT/.test(params.layers)) ?
        'include:' : 'show:' + params.layers,
      transparent: (params.transparent.toLowerCase() === 'true') ?
        'true' : 'false'
    });
  }
}

module.exports = AgsMapService;
