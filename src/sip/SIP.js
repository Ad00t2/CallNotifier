/* eslint-disable */

import { PictureInPictureAlt } from '@material-ui/icons'
import { shell } from 'electron'

import UserAgent from "./UserAgent";
import * as ReqGen from "./RequestGenerator";

import * as sip from "../sipLib/sip";
import * as digest from "../sipLib/digest";

const fs = require('fs');
const randString = require('randomstring');

var isStarted = false;
var isRegistered = false;

var UA;
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

export function init(domain, proxy, tlsAddress, user, protocol, callback) {
  fetch('https://api.ipify.org/')
    .then(response => response.text())
    .then(text => {
      console.log(text);
      UA = new UserAgent(domain, proxy, text, tlsAddress, user, protocol);
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
        tlsAddress: tlsAddress,
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

var isRegisteredCallback = (isReg) => {};

export function setIsRegisteredCallback(callback) {
  isRegisteredCallback = callback;
}

export function setIsRegistered(pIsRegistered) {
  isRegistered = pIsRegistered;
  isRegisteredCallback(isRegistered);
}

var challengeRes = {}; var regCseq = 0;
function sendRegister(password, isUnregistering, callback) {
  const isAuth = (password != null);

  const opts = { method: 'REGISTER', uri: `${UA.getSipPref()}:${UA.proxy}`, seq: ++regCseq, expires: (isUnregistering ? 0 : 3600) };
  if (isAuth) opts['call-id'] = challengeRes.headers['call-id'];
  const registerReq = ReqGen.createReq(opts);

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

export function register(password, callback) {
  sendRegister(password, false, callback);
}

export function unRegister(callback) {
  sendRegister(null, true, res => {
    sendRegister(UA.auth.password, true, res => {
      setIsRegistered(false);
      callback(res);
    });
  });
}

export function stop() {
  if (sipClient && isStarted)
    sipClient.stop();
}
