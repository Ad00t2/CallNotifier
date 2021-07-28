/* eslint-disable */

import { exception } from "console";
import UserAgent from "./UserAgent";

const randString = require('randomstring');

var UA;

export function init(paramUA) {
  UA = paramUA;
}

function getSelfContact() {
  return {
    name: UA.user,
    uri: UA.getAOR(true)
  };
}

function getDefaultHeaders(opts) {
  return {
    // via: [
    //   {
    //     version: '2.0',
    //     protocol: UA.protocol,
    //     host: UA.proxy,
    //     params: { branch: randString.generate(16) }
    //   }
    // ],
    'max-forwards': '20',
    from: {
      name: UA.user,
      uri: UA.getAOR(false),
      params: { tag: randString.generate(10) }
    },
    to: opts.to,
    'call-id': `${randString.generate(14)}@${UA.proxy}`,
    cseq: { seq: opts.seq, method: opts.method },
    contact: [ getSelfContact() ],
    'content-type': 'application/sdp',
    'content-length': (new TextEncoder().encode(opts.content)).length
  };
}

export function createReq(opts) {
  opts.method = opts.method.toUpperCase();
  if (!opts.to) opts.to = getSelfContact();
  if (!opts.content) opts.content = '';

  const req = {};
  req.method = opts.method;
  req.uri = opts.to.uri;
  req.version = '2.0';
  req.headers = getDefaultHeaders(opts);

  if ('expires' in opts) req.headers.expires = opts.expires;
  req.content = opts.content;

  return req;
}
