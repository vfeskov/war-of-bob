+function({assign}, target) {
  assign(target, {latencyView});

  function latencyView(latency$) {
    const latencyEl = document.getElementById('latency');
    latency$.subscribe(latency => {
      latencyEl.firstChild && latencyEl.removeChild(latencyEl.firstChild);
      latencyEl.appendChild(document.createTextNode(`${latency}ms PING`));
    });
  };
}(Object, self.Views = self.Views || {});
