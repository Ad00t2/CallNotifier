/* eslint-disable */

import * as ReqGen from "./RequestGenerator";

export default class UserAgent {

  constructor(domain, user, protocol, publicAddress) {
    this.domain = domain;
    this.user = user;
    this.protocol = protocol;
    this.publicAddress = publicAddress;
    switch (this.protocol) {
      case 'TCP': this.proxy = 'core1-us-ca-sf.langineers.com'; break;
      case 'UDP': this.proxy = '64.124.219.184'; break
      case 'TLS': this.proxy = 'core1-us-ca-sf.langineers.com'; break;
    }
    this.tlsAddress = 'arc2.langineers.com';
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
