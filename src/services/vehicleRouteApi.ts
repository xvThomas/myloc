import { http } from "./httpClient";
import type { RouteResult } from "./routeService";
import type { SavedRouteSummary, StoredRoute, VehiclePosition } from "../types/vehicle";

export const vehicleRouteApi = {
  list: () => http.get<SavedRouteSummary[]>("/api/routes"),

  getById: (id: string) =>
    http.get<StoredRoute>(`/api/routes/${encodeURIComponent(id)}`),

  save: (name: string, routeResult: RouteResult) =>
    http.post<SavedRouteSummary>("/api/routes", { name, routeResult }),

  start: (id: string) =>
    http.post<void>(`/api/routes/${encodeURIComponent(id)}/start`),

  stop: (id: string) =>
    http.post<void>(`/api/routes/${encodeURIComponent(id)}/stop`),

  delete: (id: string) =>
    http.delete<void>(`/api/routes/${encodeURIComponent(id)}`),

  rename: (id: string, name: string) =>
    http.patch<SavedRouteSummary>(`/api/routes/${encodeURIComponent(id)}`, { name }),

  getPosition: (id: string) =>
    http.get<VehiclePosition | { position: null }>(`/api/routes/${encodeURIComponent(id)}/position`),
};
