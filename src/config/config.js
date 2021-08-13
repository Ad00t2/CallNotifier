/* eslint-disable */

const fs = require('fs');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  schema: {
    domain: { type: 'string' },
    user: { type: 'string' },
    password: { type: 'string' },
    protocol: { type: 'string' },
    callURL: { type: 'string' },
    openInBackground: { type: 'boolean' }
  },
  defaults: {
    domain: '',
    user: '',
    password: '',
    protocol: 'UDP',
    callURL: 'http://support.langineers.com:8091/?tnum=<num>',
    openInBackground: true
  }
});

export function get(property) {
  return store.get(property);
}

export function set(key, value) {
  store.set(key, value);
}

export function setAll(domain, user, password, protocol) {
  set('domain', domain);
  set('user', user);
  set('password', password);
  set('protocol', protocol);
}

export function clear() {
  setAll("", "", "", "");
}
