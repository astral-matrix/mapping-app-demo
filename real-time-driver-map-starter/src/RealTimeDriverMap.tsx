import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import type {
  DriverSnapshot,
  RealTimeMapProps,
  StreamMessage,
  TrackPoint,
} from "./types";
import { fsmTransition } from "./fsm";
import { startMockStream } from "./mockWs";
import "leaflet/dist/leaflet.css";

// Fix default icon paths for Leaflet in bundlers
// @ts-ignore
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type SnapshotResult = DriverSnapshot;

function useDriverSnapshot(url: string) {
  return useQuery<SnapshotResult>({
    queryKey: ["driver-snapshot", url],
    queryFn: async () => {
      if (url.startsWith("/api/")) {
        return {
          driverId: "D-42",
          name: "Alex P.",
          equipment: "53' Dry Van",
          lastKnown: {
            lat: 37.781,
            lng: -122.404,
            speedKph: 63,
            heading: 110,
            timestamp: Date.now() - 15_000,
          },
          destination: { name: "Oakland DC", lat: 37.798, lng: -122.276 },
          etaIso: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Snapshot failed: ${res.status}`);
      return res.json();
    },
    staleTime: 30_000,
  });
}

function useInterval(fn: () => void, ms: number) {
  useEffect(() => {
    const id = window.setInterval(fn, ms);
    return () => window.clearInterval(id);
  }, [fn, ms]);
}

function HeadingMarker({ point }: { point: TrackPoint }) {
  const icon = useMemo(
    () =>
      L.divIcon({
        html: `<div style="transform: rotate(${
          point.heading ?? 0
        }deg); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 14px solid black;"></div>`,
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    [point.heading]
  );
  return <Marker position={[point.lat, point.lng]} icon={icon} />;
}

function RecenterControl({ target }: { target: TrackPoint | null }) {
  const map = useMap();
  return (
    <Tooltip title="Recenter">
      <Button
        size="small"
        variant="outlined"
        startIcon={<MyLocationIcon />}
        onClick={() => {
          if (target)
            map.setView([target.lat, target.lng], map.getZoom(), {
              animate: true,
            });
        }}
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 1000,
          backdropFilter: "blur(6px)",
        }}
      >
        Center
      </Button>
    </Tooltip>
  );
}

export default function RealTimeDriverMap({
  driverId,
  wsUrl,
  snapshotUrl,
  breadcrumbSize = 30,
  followModeDefault = true,
}: RealTimeMapProps) {
  const {
    data: snap,
    isLoading,
    isError,
    error,
  } = useDriverSnapshot(snapshotUrl);

  const [fsm, dispatch] = useReducer(fsmTransition, { status: "idle" });
  const [paused, setPaused] = useState(false);
  const [follow, setFollow] = useState(followModeDefault);

  const [current, setCurrent] = useState<TrackPoint | null>(null);
  const [trail, setTrail] = useState<TrackPoint[]>([]);
  const stopRef = useRef<() => void>();

  useEffect(() => {
    if (!snap) return;
    if (paused) return;
    dispatch({ type: "CONNECT" });

    // Mock stream for demo; replace with real WebSocket in prod
    stopRef.current = startMockStream(handleMessage, { start: snap.lastKnown });
    dispatch({ type: "OPEN" });

    return () => {
      stopRef.current?.();
      dispatch({ type: "CLOSE" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, paused, wsUrl, driverId]);

  useInterval(() => dispatch({ type: "TIMEOUT", now: Date.now() }), 3000);

  function handleMessage(m: StreamMessage) {
    try {
      if (m.type === "location") {
        const p = m as TrackPoint;
        setCurrent(p);
        setTrail((prev) => {
          const next = [...prev, p];
          return next.length > breadcrumbSize
            ? next.slice(next.length - breadcrumbSize)
            : next;
        });
        dispatch({ type: "TICK", now: p.timestamp });
      } else if (m.type === "heartbeat") {
        dispatch({ type: "HEARTBEAT", now: m.timestamp });
      }
    } catch (e: any) {
      dispatch({ type: "ERROR", error: String(e?.message ?? e) });
    }
  }

  const center = current ?? snap?.lastKnown ?? null;
  const etaText = snap?.etaIso
    ? new Date(snap.etaIso).toLocaleTimeString()
    : "—";

  function FollowEffect() {
    const map = useMap();
    useEffect(() => {
      if (follow && center)
        map.panTo([center.lat, center.lng], { animate: true });
    }, [follow, center, map]);
    return null;
  }

  const statusText =
    fsm.status === "connecting"
      ? "Connecting"
      : fsm.status === "live"
      ? "Live"
      : fsm.status === "degraded"
      ? "Degraded"
      : fsm.status === "error"
      ? "Error"
      : fsm.status === "paused"
      ? "Paused"
      : "Idle";

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 2,
        height: "80vh",
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 2,
        }}
      >
        {center && (
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FollowEffect />
            <RecenterControl target={center} />
            {trail.length > 1 && (
              <Polyline positions={trail.map((t) => [t.lat, t.lng]) as any} />
            )}
            {current ? (
              <>
                <HeadingMarker point={current} />
                {typeof current.accuracyM === "number" &&
                  current.accuracyM > 0 && (
                    <Circle
                      center={[current.lat, current.lng]}
                      radius={current.accuracyM}
                      pathOptions={{ opacity: 0.2 }}
                    />
                  )}
              </>
            ) : snap?.lastKnown ? (
              <Marker position={[snap.lastKnown.lat, snap.lastKnown.lng]} />
            ) : null}
          </MapContainer>
        )}
        {!center && <Box sx={{ p: 2 }}>Loading map…</Box>}
      </Box>

      <Card sx={{ height: "100%", overflow: "auto" }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Chip
              label={statusText}
              color={
                fsm.status === "live"
                  ? "success"
                  : fsm.status === "degraded"
                  ? "warning"
                  : fsm.status === "error"
                  ? "error"
                  : "default"
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={follow}
                  onChange={(e) => setFollow(e.target.checked)}
                />
              }
              label="Follow"
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? "Resume" : "Pause"}
            </Button>
          </Stack>

          <Typography variant="h6" gutterBottom>
            {snap?.name ?? "—"}{" "}
            <Typography component="span" variant="body2" color="text.secondary">
              ({snap?.driverId})
            </Typography>
          </Typography>

          <Stack spacing={1} sx={{ mb: 2 }}>
            <Row label="Equipment" value={snap?.equipment ?? "—"} />
            <Row
              label="Speed"
              value={
                current?.speedKph ? `${Math.round(current.speedKph)} km/h` : "—"
              }
            />
            <Row
              label="Heading"
              value={current?.heading ? `${Math.round(current.heading)}°` : "—"}
            />
            <Row
              label="Last update"
              value={fmtAgo(current?.timestamp ?? snap?.lastKnown?.timestamp)}
            />
            <Row label="Destination" value={snap?.destination?.name ?? "—"} />
            <Row label="ETA" value={etaText} />
            <Row label="Breadcrumb points" value={trail.length.toString()} />
          </Stack>

          <Box
            aria-live="polite"
            sx={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(1px,1px,1px,1px)",
            }}
          >
            Status: {statusText}
          </Box>

          {isLoading && <Typography>Loading driver…</Typography>}
          {isError && (
            <Typography color="error">
              {(error as any)?.message ?? "Failed to load driver"}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography color="text.secondary">{label}</Typography>
      <Typography>{value}</Typography>
    </Stack>
  );
}

function fmtAgo(ts?: number) {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  if (diff < 1_000) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
