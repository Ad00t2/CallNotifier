/* eslint-disable */

const fs = require('fs');
const path = require('path');

const configFP = './config.json';
var config = {};

(() => {
  if (fs.existsSync(configFP))
    config = JSON.parse(fs.readFileSync(configFP));
  else
    setRegister("", "", "", true);
})();

export function get(property) {
  return config[property];
}

export function set(domain, user, password, protocol) {
  config.domain = domain;
  config.user = user;
  config.password = password;
  config.protocol = protocol;
  fs.writeFileSync(configFP, JSON.stringify(config));
}

export function clear() {
  set("", "", "", "");
}
