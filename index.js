'use strict';
const express = require('express');
const compression = require('compression');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const {Observable: $} = require('rxjs/Observable');
const {start} = require('./game');
const {getTime, saveTime, getPlace, getLeaderboard} = require('./db');

app.use(compression());
app.use(express.static(__dirname + '/public'));
app.use('/common', express.static(__dirname + '/common'));
app.use('/rxjs', express.static(__dirname + '/node_modules/rxjs/bundles'));

io.on('connection', client => {
  client.on('pingcheck', () => client.emit('pongcheck'));

  client.once('start', name => {
    if (!name) { return client.disconnect(); }
    name = name.substr(0, 16);

    const {
      bob$,
      projectile$,
      time$,
      bobHp$,
      bobDead$,
      level$
    } = start({
      move$: $.fromEvent(client, 'move'),
      stop$: $.fromEvent(client, 'stop'),
      end$: $.fromEvent(client, 'disconnect')
    });

    const initialTopTime$ = getTime(name),
      finalTopTime$ = time$.last()
        .mergeMap(time => initialTopTime$.map(topTime => [topTime, time]))
        .mergeMap(([topTime, time]) => topTime < time ? saveTime(name, time) : $.of(topTime))
        .share(),
      result$ = finalTopTime$
        .mergeMap(topTime => getPlace(topTime).combineLatest(getLeaderboard()).map(r => r.concat(topTime)))
        .map(([p, l, t]) => ({place: p, leaderboard: l, topTime: t}))
        .share(),
      topTime$ = result$.map(({topTime}) => topTime).merge(initialTopTime$);

    finalTopTime$.first().subscribe(() => {});

    ['bob$', 'projectile$', 'time$', 'bobHp$', 'bobDead$', 'result$', 'topTime$', 'level$']
      .forEach(name => eval(name).subscribe(
        data => client.emit(`${name}.next`, data),
        data => client.emit(`${name}.error`, data),
        data => client.emit(`${name}.complete`, data)
      ));

    result$.combineLatest(bob$, projectile$).subscribe(0, 0, () => client.disconnect());
  });
});

const websocketPort = process.env.WEBSOCKET_PORT || 8008;
io.listen(websocketPort);

const httpPort = process.env.PORT || 3000;
server.listen(httpPort);
