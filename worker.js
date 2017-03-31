importScripts('Rx.min.js', 'constants.js', 'streams.js');

state$.subscribe(state => postMessage(['state', state]));
time$.subscribe(time => postMessage(['time', time]));
bobHp$.subscribe(bobHp => postMessage(['bobHp', bobHp]));
bobDead$.subscribe(() => postMessage(['bobDead']));

onmessage = ({data}) => {
  const {type} = data;
  if (type === 'keydown' || type === 'keyup') {
    keyEvent$.next(data);
  }
};
