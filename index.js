const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const {Observable} = require('rxjs');
const streams = require('./streams');
const {getTime, saveTime, getPlace, getLeaderboard} = require('./db');

app.use(express.static(__dirname + '/public'));
app.use('/common', express.static(__dirname + '/common'));
app.use('/rxjs', express.static(__dirname + '/node_modules/rxjs/bundles'));

io.on('connection', client => {
  //ping and pong events are reserved and won't work as it turns out
  client.on('pingcheck', () => client.emit('pongcheck'));

  client.once('start', name => {
    if (!name) { return client.disconnect(); }
    const {state$, time$, bobHp$, bobDead$, level$, keyEvent$} = streams();
    const result$ = time$.last().mergeMap(time => getResult(client, name, time)).share();
    //emit topTime twice: right away and when result's available
    const topTime$ = Observable.merge(
      Observable.from(getTime(name)),
      result$.map(({topTime}) => topTime)
    );

    const subs = ['state$', 'time$', 'bobHp$', 'bobDead$', 'level$', 'result$', 'topTime$']
      .map(name =>
        eval(name).subscribe(...emitSubscription(client, name))
      )
      .concat(
        //when both state$ and result$ complete
        state$.combineLatest(result$).subscribe(0, 0, () => client.disconnect())
      );;

    client.on('keyevent', (data) => {
      const {type} = data;
      if (type === 'keydown' || type === 'keyup') {
        keyEvent$.next(data);
      }
    });

    client.on('disconnect', () => {
      subs.forEach(sub => sub.unsubscribe());
      keyEvent$.complete();
    });
  });
});

const websocketPort = process.env.WEBSOCKET_PORT || 8008;
io.listen(8008);

const httpPort = process.env.PORT || 3000;
server.listen(httpPort);

function emitSubscription(client, eventName) {
  return [
    data => client.emit(`${eventName}.next`, data),
    data => client.emit(`${eventName}.error`, data),
    data => client.emit(`${eventName}.complete`, data)
  ];
}

function getResult(client, name, time) {
  return Observable.fromPromise(
    getTime(name)
      .then(topTime => topTime < time ? saveTime(name, time) : topTime)
      .then(topTime =>
        Promise.all([getPlace(topTime), getLeaderboard()]).then(r => r.concat(topTime))
      )
      .then(([p, l, t]) => ({place: p, leaderboard: l, topTime: t}))
  );
}
