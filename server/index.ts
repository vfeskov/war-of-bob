import {config} from 'dotenv';
config();
import './rxjs';
import {Observable as $} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import * as connect from 'connect';
import * as compression from 'compression';
import * as serveStatic from 'serve-static';
import {createServer} from 'http';
import * as socketIo from 'socket.io';
import * as path from 'path';
import * as game from './game';
import {getTime, saveTime, getPlace, getLeaderboard} from './db';
import {emitObservables, observablesFromEvents} from '../shared/socket-util';

const {assign} = Object;

const app = connect();
app.use(compression());
app.use(serveStatic('public', {maxAge: 3600}));

const server = createServer(app);

const io = socketIo(server, {serveClient: false});
io.on('connection', client => {
  const {id} = client;
  log('connected', {id});
  client.on('disconnect', () => log('disconnected', {id}));
  client.on('pingcheck', () => client.emit('pongcheck'));
  client.once('start', name => {
    log('start', {id, name});
    if (!name) { return client.disconnect(); }
    name = name.substr(0, 16);
    start(client, name);
  });
});

server.listen(3000);
log('server_up_and_listening', {port: 3000});

function start(client, name) {
  const _log = (event, payload = {}) =>
    log(event, assign({id: client.id, name}, payload));

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

  const prevTopTime$ = getTime(name),
    finalTopTime$ = time$.last()
      .do(time => _log('session_time', {time}))
      .mergeMap(time => prevTopTime$
        .do(prevTopTime => _log('prev_top_time_updated', {time: prevTopTime}))
        .map(topTime => [topTime, time])
      )
      .mergeMap(([topTime, time]) =>
        topTime >= time ?
          $.of(topTime) :
          saveTime(name, time)
            .do(() => _log('new_top_time_saved', {time}))
            .mapTo(time)
      )
      .do(time => _log('final_top_time', {time}))
      .share(),
    result$ = finalTopTime$
      .mergeMap(topTime =>
        getPlace(topTime)
          .do(place => _log('place', {place}))
          .zip(getLeaderboard().do(leaderboard => _log('leaderboard', {leaderboard})))
          .map((result: any[]) => result.concat(topTime))
      )
      .map(([p, l, t]) => ({place: p, leaderboard: l, topTime: t}))
      .share(),
    topTime$ = result$.map(({topTime}) => topTime).merge(
      prevTopTime$.do(time => _log('prev_top_time', {time}))
    );

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

  result$.combineLatest(bob$, projectile$)
    .finally(() => client.disconnect())
    .subscribe(() => {}, err => _log('error', err));
}

function log(event, payload = {}) {
  const entry = assign({event, timestamp: new Date()}, payload);
  console.log(JSON.stringify(entry));
}
