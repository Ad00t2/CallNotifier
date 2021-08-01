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

export function getRegister(property) {
  return config.register[property];
}

export function setRegister(domain, user, protocol, shouldWrite) {
  config.register = {};
  config.register.domain = domain;
  config.register.user = user;
  config.register.protocol = protocol;
  if (shouldWrite)
    fs.writeFileSync(configFP, JSON.stringify(config));
}
