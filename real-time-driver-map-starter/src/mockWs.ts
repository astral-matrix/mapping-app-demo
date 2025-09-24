import type { StreamMessage, TrackPoint } from "./types";

export function startMockStream(
  onMessage: (m: StreamMessage) => void,
  opts?: { start?: TrackPoint }
) {
  let lat = opts?.start?.lat ?? 37.781;
  let lng = opts?.start?.lng ?? -122.404;
  let heading = 110;
  let timer: number | undefined;

  function tick() {
    const dist = 0.0008; // ~80m
    const rad = (heading * Math.PI) / 180;
    lat += Math.sin(rad) * dist;
    lng += Math.cos(rad) * dist;
    heading = (heading + (Math.random() * 30 - 15) + 360) % 360;

    const now = Date.now();
    onMessage({
      type: "location",
      lat,
      lng,
      speedKph: 58 + Math.random() * 10,
      heading,
      accuracyM: 10 + Math.random() * 8,
      timestamp: now,
    });

    if (Math.random() < 0.25) onMessage({ type: "heartbeat", timestamp: now });
    timer = window.setTimeout(tick, 2000);
  }

  timer = window.setTimeout(tick, 1000);
  return () => {
    if (timer) window.clearTimeout(timer);
  };
}
