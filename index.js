const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const streams = require('./streams');

app.use(express.static(__dirname + '/public'));
app.use('/common', express.static(__dirname + '/common'));
app.use('/rxjs', express.static(__dirname + '/node_modules/rxjs/bundles'));

io.on('connection', client => {
  const {state$, time$, bobHp$, bobDead$, keyEvent$} = streams();
  const subs = [
    state$.subscribe(state => client.emit('state', state), () => {}, () => client.disconnect()),
    time$.subscribe(time => client.emit('time', time)),
    bobHp$.subscribe(bobHp => client.emit('bobHp', bobHp)),
    bobDead$.subscribe(() => client.emit('bobDead'))
  ];

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

const websocketPort = process.env.WEBSOCKET_PORT || 8008;
io.listen(8008);

const httpPort = process.env.PORT || 3000;
server.listen(httpPort);


