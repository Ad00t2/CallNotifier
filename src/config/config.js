/* eslint-disable */

const fs = require('fs');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  schema: {
    domain: { type: 'string', default: '' },
    user: { type: 'string', default: '' },
    password: { type: 'string', default: '' },
    protocol: { type: 'string', default: '' }
  }
});

export function get(property) {
  return store.get(property);
}

export function setAll(domain, user, password, protocol) {
  store.set('domain', domain);
  store.set('user', user);
  store.set('password', password);
  store.set('protocol', protocol);
}

export function clear() {
  setAll("", "", "", "");
}
