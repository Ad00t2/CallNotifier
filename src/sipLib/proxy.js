/* eslint-disable */

var sip=require('sip');
var util=require('util');

var sipClient;
var isStarted = false;
var contexts = {};

function makeContextId(msg) {
  var via = msg.headers.via[0];
  return [via.params.branch, via.protocol, via.host, via.port, msg.headers['call-id'], msg.headers.cseq.seq];
}

function defaultCallback(rs) {
  rs.headers.via.shift();
  send(rs);
}


export function send(msg, callback) {
  var ctx = contexts[makeContextId(msg)];

  if(!ctx) {
    sipClient.send.apply(sip, arguments);
    return;
  }

  return msg.method ? forwardRequest(ctx, msg, callback || defaultCallback) : forwardResponse(ctx, msg);
};


function forwardResponse(ctx, rs, callback) {
  if(+rs.status >= 200)
    delete contexts[makeContextId(rs)];
  sipClient.send(rs);
}


function sendCancel(rq, via, route) {
  sipClient.send({
    method: 'CANCEL',
    uri: rq.uri,
    headers: {
      via: [via],
      to: rq.headers.to,
      from: rq.headers.from,
      'call-id': rq.headers['call-id'],
      route: route,
      cseq: {method: 'CANCEL', seq: rq.headers.cseq.seq}
    }
  });
}


function forwardRequest(ctx, rq, callback) {
  var route = rq.headers.route && rq.headers.route.slice();
  sipClient.send(rq, function(rs, remote) {
    if(+rs.status < 200) {
      var via = rs.headers.via[0];
      ctx.cancellers[rs.headers.via[0].params.branch] = () => { sendCancel(rq, via, route); };

      if(ctx.cancelled)
        sendCancel(rq, via, route);
    }
    else {
      delete ctx.cancellers[rs.headers.via[0].params.branch];
    }

    callback(rs, remote);
  });
}


function onRequest(rq, route, remote) {
  var id = makeContextId(rq);
  contexts[id] = { cancellers: {} };

  try {
    route(sip.copyMessage(rq), remote);
  } catch(e) {
    delete contexts[id];
    console.log(e);
  }
};

export function start(options, route) {
  var sipClient = sip.start(options, function(rq, remote) {
    if(rq.method === 'CANCEL') {
      var ctx = contexts[makeContextId(rq)];

      if(ctx) {
        sipClient.send(sip.makeResponse(rq, 200, 'OK'));

        ctx.cancelled = true;
        if(ctx.cancellers) {
          Object.keys(ctx.cancellers).forEach(function(c) { ctx.cancellers[c](); });
        }
      }
      else {
        sipClient.send(sip.makeResponse(rq, 481));
      }
    }
    else {
      onRequest(rq, route, remote);
    }
  });
  isStarted = true;
};

export function stop() {
  if (sipClient && isStarted)
    sipClient.stop();
}

