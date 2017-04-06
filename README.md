War of Bob
-----------

The game was an educational project of mine. It was developed in stages, each stage taught me something.
1. I was on a train with no movies or internet connection trying to develop something playable in pure JS. 
    - Learnt about [document.createTextNode](https://developer.mozilla.org/en-US/docs/Web/API/Document/createTextNode) by inspecting VSCode suggestions
2. RxJS was included to handle all the callbacks
    - Made an [observable](https://github.com/vfeskov/war-of-bob/blob/master/streams.js#L14-L29) of keydown and keyup events that maps to stable movement of Bob.
    - Later, after a complete rewrite, [the whole game logic](https://github.com/vfeskov/war-of-bob/blob/master/streams.js) became stateless in a sense that there was no state stored outside of observables (except `lastId` which was used to make unique IDs).
    - Rendering of the game was basically a subscription to the game streams.
3. Rendering was changed from moving HTML elements to drawing on canvas.
    - CPU throttling was discovered on Timeline tab of Chrome DevTools. The game didn't perform well with it.
    - First version of canvas rendering was even worse than moving html elements: FPS was much lower.
    - Turned out that drawing scaled images on canvas is a very expensive operation, it had to be done just once on an offscreen canvas and then the result pixels could be stored and drawn on an actual canvas.
    - `requestAnimationFrame` was used to not redraw canvas multiple times between frames because user would see only the last state anyway.
    - Drawing scaled images on a small canvas mangled them horribly. Had to use a canvas of 1000x1000.
    - In the end, FPS of rendering on canvas was almost the same as when moving HTML elements.
4. Game logic streams were moved to a WebWorker
    - The game was pretty laggy
    - Since the game logic was just a bunch of observables, they were easy to move to a WebWorker and connect streams to renderers via postMessage and onmessage ([worker](https://github.com/vfeskov/war-of-bob/blob/3dc9ee962d8ed70583cb7a6631523621710d0360/worker.js), [main thread](https://github.com/vfeskov/war-of-bob/blob/3dc9ee962d8ed70583cb7a6631523621710d0360/init.js#L8-L32)).
    - Didn't notice significant performance improvement on Timeline and my laptop was still hot after playing for a while :/
5. Game logic was moved from a WebWorker to a WebSocket 
    - socket.io + nodejs were used, very simple and convenient
    - Moving observables wasn't a challenge at all
    - There were a lot of events being passed through a socket which meant a lot of MB constantly transferred. Throttled them by 25 ms.
    - Latency turned out to be a big issue, it was 300ms for me in Berlin to talk to a server in the US. Deployed the game in Frankfurt and the latency became 30ms tops.
    - When the connection was unstable, some packets got lost which resulted in game dropping frames since it was based on server constantly updating state.
    - Tracking highscore and having leaderboard became possible since the game logic was secured on the server
6. AWS SimpleDB was added
    - It was quite a surprise that AWS SimpleDB didn't have a GUI, luckily there was a [Chrome extension](https://chrome.google.com/webstore/detail/sdbnavigator/ddhigekdfabonefhiildaiccafacphgg)
    - Made dedicated credentials just to access SimpleDB service.
    - It supported SQL-like queries with COUNT and LIMIT - pretty powerful
    - [api calls](https://github.com/vfeskov/war-of-bob/blob/master/db.js)

Now I don't know what to do with it. Should I continue improving gameplay? I guess not many people play such games on their laptops or desktops and it's unplayable on mobile devices. Please tell me what you think.
