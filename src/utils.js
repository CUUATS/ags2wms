const xml = require('xml');


function exception(msg, code) {
  let exception = [];
  if (code) exception.push({
    _attr: {
      code: code
    }
  });
  exception.push(msg);

  return xml([
    {
      ServiceExceptionReport: [
        {
          _attr: {
            version: '1.3.0',
            xmlns: 'http://www.opengis.net/ogc',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'xsi:schemaLocation': 'http://www.opengis.net/ogc ' +
              'http://schemas.opengis.net/wms/1.3.0/exceptions_1_3_0.xsd'
          }
        },
        {
          ServiceException: exception
        }
      ]
    }
  ], {
    declaration: true
  });
}

module.exports.exception = exception;
