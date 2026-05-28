import type { LatLng } from "./geo";
import type { RouteResult } from "../services/routeService";

export type RouteStatus = "idle" | "started" | "stopped";

export interface StoredRoute {
  id: string;
  name: string;
  status: RouteStatus;
  routeResult: RouteResult;
  startedAt: number | null;
}

export interface SavedRouteSummary {
  id: string;
  name: string;
  status: RouteStatus;
}

export interface VehiclePosition {
  position: LatLng;
  speedKmh: number;
}
