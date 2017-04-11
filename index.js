const express = require('express');
const compression = require('compression');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const {Observable: $} = require('rxjs/Observable');
const {start} = require('./common/game');
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

    const {bob$, projectile$, time$, bobHp$, bobDead$, level$, move, stop, end} = start();
    const result$ = time$.last()
      .mergeMap(time => getTime(name).then(topTime => [topTime, time]))
      .mergeMap(([topTime, time]) => topTime < time ? saveTime(name, time) : $.of(topTime))
      .mergeMap(topTime => Promise.all([getPlace(topTime), getLeaderboard()]).then(r => r.concat(topTime)))
      .map(([p, l, t]) => ({place: p, leaderboard: l, topTime: t}))
      .share();
    const topTime$ = result$.map(({topTime}) => topTime).merge(getTime(name));

    const subs = ['bob$', 'projectile$', 'time$', 'bobHp$', 'bobDead$', 'result$', 'topTime$', 'level$']
      .map(name => eval(name).subscribe(
        data => client.emit(`${name}.next`, data),
        data => client.emit(`${name}.error`, data),
        data => client.emit(`${name}.complete`, data)
      ))
      .concat(result$.combineLatest(bob$, projectile$).subscribe(0, 0, () => client.disconnect()));;

    client.on('move', move);
    client.on('stop', stop);

    client.on('disconnect', () => {
      subs.forEach(sub => sub.unsubscribe());
      end();
    });
  });
});

const websocketPort = process.env.WEBSOCKET_PORT || 8008;
io.listen(8008);

const httpPort = process.env.PORT || 3000;
server.listen(httpPort);
