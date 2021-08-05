/* eslint-disable */

import * as ReqGen from "./RequestGenerator";

export default class UserAgent {

  constructor(domain, user, password, protocol, publicAddress) {
    this.domain = domain;
    this.user = user;
    this.password = password;
    this.protocol = protocol;
    this.publicAddress = publicAddress;
    this.proxy = 'core1-us-ca-sf.langineers.com';
    this.tlsAddress = 'arc2.langineers.com';
    ReqGen.init(this);
  }

  getSipPref() {
    return `sip${this.protocol === 'TLS' ? '' : ''}`;
  }

  getAOR(usePublicIP) {
    return `${this.getSipPref()}:${this.user}@${usePublicIP ? this.publicAddress : this.domain}`;
  }

}
