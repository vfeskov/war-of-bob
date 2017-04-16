'use strict';
require('dotenv').config({silent: true});
const {Observable: $} = require('rxjs/Observable');
const {server, io} = setupServer(
  require('node-static'),
  require('http'),
  require('socket.io')
);
const game = require('./game');
const {getTime, saveTime, getPlace, getLeaderboard} = require('./db');
const {emitObservables, observablesFromEvents} = require('./common/socket-util');

io.on('connection', client => {
  client.on('pingcheck', () => client.emit('pongcheck'));
  client.once('start', name => {
    if (!name) { return client.disconnect(); }
    name = name.substr(0, 16);
    start(client, name);
  });
});

server.listen(3000);

function setupServer(nodeStatic, http, socketIo) {
  const staticSrvs = [
    {id: 'public', path: './public'},
    {id: 'common', path: './common'},
    {id: 'modules', path: './node_modules'}
  ].reduce((srvs, {id, path}) =>
    Object.assign(srvs, {[id]: new nodeStatic.Server(path, {cache: 3600, gzip: true})})
  , {});
  const server = http.createServer((req, res) => {
    if (req.url === '/heartbeat') {
      res.statusCode = 200;
      return res.end();
    }
    if (req.url === '/Rx.min.js') {
      return staticSrvs.modules.serveFile('/rxjs/bundles/Rx.min.js', 200, {}, req, res);
    }
    if (req.url.indexOf('/common/') === 0) {
      req.url = req.url.replace(/^\/common\//, '/');
      return staticSrvs.common.serve(req, res);
    }
    staticSrvs.public.serve(req, res);
  });
  const io = socketIo(server);
  return {server, io};
}

function start(client, name) {
  const {move$, stop$} = observablesFromEvents(client, ['move$', 'stop$']);

  const {
    bob$,
    projectile$,
    time$,
    bobHp$,
    bobDead$,
    level$
  } = game.start({
    move$,
    stop$,
    end$: $.fromEvent(client, 'disconnect')
  });

  const initialTopTime$ = getTime(name),
    finalTopTime$ = time$.last()
      .mergeMap(time => initialTopTime$.map(topTime => [topTime, time]))
      .mergeMap(([topTime, time]) => topTime < time ? saveTime(name, time).mapTo(time) : $.of(topTime))
      .share(),
    result$ = finalTopTime$
      .mergeMap(topTime => getPlace(topTime).zip(getLeaderboard()).map(r => r.concat(topTime)))
      .map(([p, l, t]) => ({place: p, leaderboard: l, topTime: t}))
      .share(),
    topTime$ = result$.map(({topTime}) => topTime).merge(initialTopTime$);

  finalTopTime$.subscribe(() => {});

  emitObservables(client, {
    bob$,
    projectile$,
    time$,
    bobHp$,
    bobDead$,
    result$,
    topTime$,
    level$
  });

  result$.combineLatest(bob$, projectile$).subscribe(0, 0, () => client.disconnect());
}
