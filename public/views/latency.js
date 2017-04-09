self.latencyView = function() {
  return latency$ => {
    const latencyEl = document.getElementById('latency');
    latency$.subscribe(latency => {
      latencyEl.firstChild && latencyEl.removeChild(latencyEl.firstChild);
      latencyEl.appendChild(document.createTextNode(`${latency}ms PING`));
    });
  };
}();
