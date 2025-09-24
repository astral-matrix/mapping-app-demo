import type { ConnectionStatus } from "./types";

export type FSMState = {
  status: ConnectionStatus;
  lastTickAt?: number;
  error?: string;
};

export type FSMEvent =
  | { type: "CONNECT" }
  | { type: "OPEN" }
  | { type: "TICK"; now: number }
  | { type: "HEARTBEAT"; now: number }
  | { type: "TIMEOUT"; now: number }
  | { type: "ERROR"; error: string }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "CLOSE" };

const DEGRADED_AFTER_MS = 15_000;

export function fsmTransition(s: FSMState, e: FSMEvent): FSMState {
  switch (e.type) {
    case "CONNECT":
      return { status: "connecting" };
    case "OPEN":
      return { status: "live", lastTickAt: Date.now() };
    case "TICK":
    case "HEARTBEAT":
      return { status: "live", lastTickAt: e.now };
    case "TIMEOUT": {
      const last = s.lastTickAt ?? 0;
      if (e.now - last >= DEGRADED_AFTER_MS && s.status === "live") {
        return { ...s, status: "degraded" };
      }
      return s;
    }
    case "ERROR":
      return { status: "error", error: e.error, lastTickAt: s.lastTickAt };
    case "PAUSE":
      return { ...s, status: "paused" };
    case "RESUME":
      return { ...s, status: "connecting" };
    case "CLOSE":
      return { status: "idle" };
    default:
      return s;
  }
}
