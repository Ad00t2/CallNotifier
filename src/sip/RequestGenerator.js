/* eslint-disable */

import { exception } from "console";
import UserAgent from "./UserAgent";

const randString = require('randomstring');

var UA;

export function init(pUA) {
  UA = pUA;
}

function getDefaultHeaders(opts) {
  return {
    'max-forwards': '20',
    from: { name: UA.user, uri: UA.getAOR(false), params: { tag: randString.generate(10) } },
    to: opts.to,
    cseq: { seq: opts.seq, method: opts.method },
    contact: [{ name: UA.user, uri: UA.getAOR(true) }]
  };
}

export function createReq(opts) {
  opts.method = opts.method.toUpperCase();
  if (!('to' in opts)) opts.to = { name: UA.user, uri: UA.getAOR(false) };
  if (!('uri' in opts)) opts.uri = opts.to.uri;

  const req = {};
  req.method = opts.method;
  req.uri = opts.uri;
  req.version = '2.0';
  req.headers = getDefaultHeaders(opts);

  if ('call-id' in opts) req.headers['call-id'] = opts['call-id'];
  else req.headers['call-id'] = `${randString.generate(14)}@${UA.proxy}`;
  if ('expires' in opts) req.headers.expires = opts.expires;

  req.headers['content-length'] = 0;
  if (opts.content) {
    req.content = opts.content;
    req.headers['content-type'] = 'application/sdp';
    req.headers['content-length'] = (new TextEncoder().encode(opts.content)).length;
  }

  return req;
}
