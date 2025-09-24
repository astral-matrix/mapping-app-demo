# Real-Time Driver Map Starter

Medium-challenge demo project for a TMS real-time driver map using React, TypeScript, MUI, React-Leaflet, and TanStack Query.

## Features

- Live driver marker with heading and accuracy circle
- Breadcrumb polyline (last N points)
- Connection state machine (connecting → live → degraded → error → paused)
- Follow mode, recenter control, pause/resume
- Mock WebSocket stream for local runs

## Quick Start

```bash
npm install
npm run dev
# open http://localhost:5173
```

## Swap to a real WebSocket

In `src/RealTimeDriverMap.tsx`, replace the mock stream block in the effect with a real `WebSocket` that emits the `StreamMessage` shapes described in `src/types.ts`.
