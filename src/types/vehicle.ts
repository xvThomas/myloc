import type { LatLng } from "./geo";
import type { RouteResult } from "../services/routeService";

export type RouteStatus = "idle" | "started" | "stopped";
export type RouteType = "one_way" | "round_trip" | "continuous" | "circular_once" | "circular_continuous";

export interface StoredRoute {
  id: string;
  name: string;
  status: RouteStatus;
  routeType: RouteType;
  routeResult: RouteResult;
  startedAt: number | null;
}

export interface SavedRouteSummary {
  id: string;
  name: string;
  status: RouteStatus;
  routeType: RouteType;
}

export interface VehiclePosition {
  position: LatLng;
  speedKmh: number;
  status: RouteStatus;
  remainingTimeSec: number;
}
