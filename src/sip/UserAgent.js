/* eslint-disable */

export default class UserAgent {

  constructor(domain, proxy, tlsAddress, user, protocol) {
    this.domain = domain;
    this.proxy = proxy;
    this.tlsAddress = tlsAddress;
    this.user = user;
    this.protocol = protocol.toUpperCase();
  }

  getSipPref() {
    return `sip${this.protocol === 'TLS' ? '' : ''}`;
  }

  getAOR(useProxy) {
    return `${this.getSipPref()}:${this.user}@${useProxy ? this.proxy : this.domain}`;
  }

  setAuthDetails(realm, password) {
    this.auth = {};
    this.auth.realm = realm;
    this.auth.password = password;
  }

}
