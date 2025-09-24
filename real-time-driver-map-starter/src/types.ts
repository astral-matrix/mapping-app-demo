export type LatLng = { lat: number; lng: number };

export type DriverSnapshot = {
  driverId: string;
  name: string;
  equipment: string;
  lastKnown: TrackPoint;
  destination?: { name: string; lat: number; lng: number };
  etaIso?: string; // ISO string
};

export type TrackPoint = LatLng & {
  speedKph?: number;
  heading?: number;     // degrees
  accuracyM?: number;   // meters radius
  timestamp: number;    // epoch ms
};

export type StreamMessage =
  | ({ type: "location" } & TrackPoint)
  | { type: "heartbeat"; timestamp: number };

export type ConnectionStatus = "idle" | "connecting" | "live" | "degraded" | "error" | "paused";

export type RealTimeMapProps = {
  driverId: string;
  wsUrl: string;                // e.g. ws://localhost:5173/ws
  snapshotUrl: string;          // e.g. /api/drivers/D-42
  breadcrumbSize?: number;      // default 30
  followModeDefault?: boolean;  // default true
};
