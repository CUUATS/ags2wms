const fs = require('fs');
const util = require('util');
const AgsProxy = require('./proxy.js');
const readFile = util.promisify(fs.readFile);

async function getConfig() {
  if (process.argv.length > 2) {
    let configString = await readFile(process.argv[2]);
    return JSON.parse(configString);
  }
  return {
    url: process.env.AGS_URL,
    tokenUrl: process.env.AGS_TOKEN_URL,
    token: process.env.AGS_TOKEN,
    user: process.env.AGS_USER,
    password: process.env.AGS_PASSWORD
  };
}

async function startProxy() {
  let config = await getConfig();
  let proxy = new AgsProxy(config);
  proxy.discover();
}

if (require.main === module) {
  startProxy();
}
