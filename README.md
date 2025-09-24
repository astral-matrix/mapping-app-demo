All set! I packaged a **standalone, fully-scaffolded React + TS + Vite** starter you can run locally.

[Download the starter project (ZIP)](sandbox:/mnt/data/real-time-driver-map-starter.zip)

## Quick start

```bash
unzip real-time-driver-map-starter.zip
cd real-time-driver-map-starter
npm install
npm run dev
# open http://localhost:5173
```

### What’s inside

```
real-time-driver-map-starter/
├─ package.json                # React, MUI, TanStack Query, React-Leaflet
├─ tsconfig.json
├─ vite.config.ts
├─ index.html
├─ README.md
└─ src/
   ├─ main.tsx                 # mounts app + Leaflet CSS
   ├─ App.tsx                  # wires QueryClient + page shell
   ├─ RealTimeDriverMap.tsx    # map UI, controls, FSM integration
   ├─ types.ts                 # TS contracts (driver, stream, props)
   ├─ fsm.ts                   # connection finite-state machine
   ├─ mockWs.ts                # local WebSocket simulator (no infra needed)
   ├─ vite-env.d.ts
   └─ index.css
```

### Notes

* The mock WebSocket stream is on by default so you can rehearse immediately.
* When you’re ready to use a real socket, replace the `startMockStream(...)` block in `RealTimeDriverMap.tsx` with a `WebSocket` that emits the `StreamMessage` shapes defined in `src/types.ts` (I left a comment where to swap it).

If you want me to auto-wire this into your existing Vite/MUI repo’s index page and add a link in your demo menu, I can generate that bundle too.
