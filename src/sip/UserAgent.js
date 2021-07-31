/* eslint-disable */

import * as ReqGen from "./RequestGenerator";

export default class UserAgent {

  constructor(domain, proxy, publicAddress, tlsAddress, user, protocol) {
    this.domain = domain;
    this.proxy = proxy;
    this.publicAddress = publicAddress;
    this.tlsAddress = tlsAddress;
    this.user = user;
    this.protocol = protocol.toUpperCase();
    ReqGen.init(this);
  }

  getSipPref() {
    return `sip${this.protocol === 'TLS' ? '' : ''}`;
  }

  getAOR(usePublicIP) {
    return `${this.getSipPref()}:${this.user}@${usePublicIP ? this.publicAddress : this.domain}`;
  }

  setAuthDetails(realm, password) {
    this.auth = {};
    this.auth.realm = realm;
    this.auth.password = password;
  }

}
