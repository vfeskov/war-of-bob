export {latencyView};

function latencyView(latency$) {
  const latencyEl = document.getElementById('latency');
  latency$.first().subscribe(() =>
    document.getElementById('latency-container').style.visibility = 'visible'
  );
  latency$.subscribe(latency => {
    if (latencyEl.firstChild) { latencyEl.removeChild(latencyEl.firstChild); }
    latencyEl.appendChild(document.createTextNode(`${latency}ms`));
  });
};
