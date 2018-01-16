const AgsProxy = require('./proxy.js');


if (require.main === module) {
  let proxy = new AgsProxy(process.argv[2], process.argv[3], 8000);
  proxy.discover();
}
