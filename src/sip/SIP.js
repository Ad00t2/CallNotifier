/* eslint-disable */

import { PictureInPictureAlt } from '@material-ui/icons'
import { shell } from 'electron'

import UserAgent from "./UserAgent";
import * as ReqGen from "./RequestGenerator";

import * as sip from "../sipLib/sip";
import * as digest from "../sipLib/digest";

const fs = require('fs');
const randString = require('randomstring');

var UA;
var isStarted = false;
var sipClient;
const sipLog = [];

function onBye(req, remote) {
  sipClient.send(sip.makeResponse(req, 200, 'OK'));
}

function onCancel(req, remote) {
  sipClient.send(
    ReqGen.createReq({
      method: 'NOTIFY',
      to: req.headers.from,
      seq: req.headers.cseq.seq
    })
  );
  sipClient.send(sip.makeResponse(req, 487, 'REQUEST TERMINATED'));
}

function onInvite(req, remote) {
  sipClient.send(sip.makeResponse(req, 100, 'TRYING'));
  sipClient.send(sip.makeResponse(req, 486, 'BUSY HERE'));
  const parsedURI = sip.parseUri(req.headers.from.uri);
  shell.openExternal(`http://support.langineers.com:8091/?tnum=${parsedURI.user}`);
}

function start(options) {
  sipClient = sip.start(options, (req, remote) => {
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

function setProtocolOptions(options, protocol) {
  options.tcp = (protocol === 'TCP');
  options.udp = (protocol === 'UDP');
  if (protocol === 'TLS')
    options.tls = {};
}

var sipLogCallback = (sipLog) => {};

function addSipLogEntry(message, address, isSend) {
  sipLog.unshift({ "id": randString.generate(8), "message": message, "address": address, "time": Date.now(), "isSend": isSend });
  sipLogCallback(sipLog);
}

function clearSipLog() {
  sipLog.length = 0;
  sipLogCallback(sipLog);
}

export function setSipLogCallback(callback) {
  sipLogCallback = callback;
  sipLogCallback(sipLog);
}

export function init(domain, proxy, tlsAddress, user, protocol) {
  UA = new UserAgent(domain, proxy, tlsAddress, user, protocol);
  ReqGen.init(UA);
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
    publicAddress: domain,
    tlsAddress: tlsAddress
  };
  setProtocolOptions(options, protocol);
  start(options);
}

export function getUA() {
  return UA;
}

var challengeRes = {}; var regCseq = 0;
export function register(password, isUnregistering, callback) {
  const isAuth = (password != null);
  const registerReq = ReqGen.createReq({ method: 'REGISTER', seq: ++regCseq, expires: (isUnregistering ? 0 : 7200) });
  if (isAuth) {
    if (!('auth' in UA))
      UA.setAuthDetails(challengeRes.headers["proxy-authenticate"][0].realm, password);
    digest.signRequest({ realm: UA.auth.realm }, registerReq, challengeRes, { user: UA.user, 'password': UA.auth.password });
  }
  // console.log('Register req');
  // console.log(registerReq);
  // console.log('Challenge res');
  // console.log(challengeRes);

  sipClient.send(registerReq, (res) => {
    if (!isAuth) {
      challengeRes = res;
    } else {
      regCseq = 0;
      challengeRes = {};
    }
    callback(res);
  });
}

export function unRegister(callback) {
  register(null, true, res => {
    register(UA.auth.password, true, res => {
      clearSipLog();
      callback(res);
    });
  });
}

export function stop() {
  if (sipClient && isStarted)
    sipClient.stop();
}
