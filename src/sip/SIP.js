/* eslint-disable */

import { PictureInPictureAlt } from '@material-ui/icons'
import { shell } from 'electron'

import UserAgent from "./UserAgent";
import * as ReqGen from "./RequestGenerator";

import * as sip from "../sipLib/sip";
import * as digest from "../sipLib/digest";

const fs = require('fs');
const randString = require('randomstring');
const srv = require('dns-srv');
const net = require('net');

var isStarted = false;
var isRegistered = false;

var UA;
var sipClient;
const sipLog = [];

// Copy & Pastes
// 80IO73l6
// core1-us-ca-sf.langineers.com - 64.124.219.184
// core2-us-ca-sc.langineers.com - 64.74.129.251
// arc2.langineers.com
// langineerstest.com

function onBye(req, remote) {
  sipClient.send(sip.makeResponse(req, 200, 'OK'));
}

function onCancel(req, remote) {
  sipClient.send(
    ReqGen.createReq({
      method: 'NOTIFY',
      to: req.headers.from,
      seq: req.headers.cseq.seq + 1
    })
  );
  sipClient.send(sip.makeResponse(req, 487, 'REQUEST TERMINATED'));
}

var lastInviteContent = ''
function onInvite(req, remote) {
  sipClient.send(sip.makeResponse(req, 100, 'TRYING'));
  sipClient.send(sip.makeResponse(req, 486, 'BUSY HERE'));
  if (req.content !== lastInviteContent) {
    const parsedURI = sip.parseUri(req.headers.from.uri);
    shell.openExternal(`http://support.langineers.com:8091/?tnum=${parsedURI.user}`);
    lastInviteContent = req.content;
  }
}

var sipLogCallback = (sipLog) => {};

function addSipLogEntry(message, address, isSend) {
  sipLog.unshift({ "id": randString.generate(8), "message": message, "address": address, "time": Date.now(), "isSend": isSend });
  sipLogCallback(sipLog);
}

export function clearSipLog() {
  sipLog.length = 0;
  sipLogCallback(sipLog);
}

export function setSipLogCallback(callback) {
  sipLogCallback = callback;
  sipLogCallback(sipLog);
}

function create(options) {
  sipClient = sip.create(options, (req, remote) => {
    switch (req.method) {
      case 'BYE':
        onBye(req, remote);
        break;
      case 'CANCEL':
        onCancel(req, remote);
        break;
      case 'INVITE':
        onInvite(req, remote);
        break;
      default:
        break;
    }
  });
  isStarted = true;
}

export function init(domain, user, password, protocol, callback) {
  fetch('https://api.ipify.org/')
    .then(response => response.text())
    .then(text => {
      console.log(text);
      UA = new UserAgent(domain, user, password, protocol, text);
      const options = {
        logger: {
          send: (message, address) => {
            console.log(`send ${JSON.stringify(address)}`); console.log(message);
            addSipLogEntry(message, address, true);
          },
          recv: (message, address) => {
            console.log(`recv ${JSON.stringify(address)}`); console.log(message);
            addSipLogEntry(message, address, false);
          },
          error: (e) => {
            console.error(e);
          }
        },
        maxBytesHeaders: 604800,
        maxContentLength: 604800,
        publicAddress: UA.publicAddress,
        tlsAddress: UA.tlsAddress,
        prot: protocol,
        tcp: (protocol === 'TCP'),
        udp: (protocol === 'UDP')
      };
      if (protocol === 'TLS')
        options.tls = {};
      create(options);
      callback();
    });
}

export function getUA() {
  return UA;
}

export function setIsRegistered(pIsRegistered) {
  isRegistered = pIsRegistered;
}

export function getIsRegistered() {
  return isRegistered;
}

function regRetry(n, opts, cb) {
  var req1 = ReqGen.createReq({ ...opts, seq: 1 });
  sipClient.send(req1, (res1) => {
    if ((res1.status >= 200 && res1.status < 300)
       || !(res1.status === 401 || res1.status === 407)
       || (n === 1)) {
      cb(res1);
    } else if (res1.status === 401 || res1.status === 407) {
      var req2 = ReqGen.createReq({ ...opts, seq: 2, 'call-id': res1.headers['call-id'] });
      digest.signRequest({ realm: res1.headers["proxy-authenticate"][0].realm }, req2, res1, { user: UA.user, 'password': UA.password });
      sipClient.send(req2, (res2) => {
        if (res2.status >= 200 && res2.status < 300) cb(res2);
        else if (res1.status === 401 || res1.status === 407) regRetry(--n, opts, cb);
        else cb(res);
      });
    }
  });
}

function sendRegister(isRegistering, callback) {
  var opts = { method: 'REGISTER', uri: `${UA.getSipPref()}:${UA.proxy}`, expires: (isRegistering ? 3600 : 0) };
  regRetry(10, opts, callback);
}

export function register(callback) {
  sendRegister(true, callback);
}

export function unRegister(callback) {
  sendRegister(false, (res) => { setIsRegistered(false); callback(res); });
}

var reRegisterInterval;
export function setReRegisterInterval(pReRegisterInterval) {
  reRegisterInterval = pReRegisterInterval;
}

export function stop() {
  if (sipClient && isStarted) {
    if (reRegisterInterval != null) {
      clearInterval(reRegisterInterval);
      reRegisterInterval = null;
    }
    sipClient.stop();
    isStarted = false;
  }
}
