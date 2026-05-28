import type { RouteResult } from "./routeService";
import type { SavedRouteSummary, StoredRoute, VehiclePosition } from "../types/vehicle";

export async function saveRoute(name: string, routeResult: RouteResult): Promise<SavedRouteSummary> {
  const res = await fetch("/api/routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, routeResult }),
  });
  if (!res.ok) throw new Error(`Failed to save route (${res.status})`);
  return res.json();
}

export async function listRoutes(): Promise<SavedRouteSummary[]> {
  const res = await fetch("/api/routes");
  if (!res.ok) throw new Error(`Failed to list routes (${res.status})`);
  return res.json();
}

export async function getFullRoute(id: string): Promise<StoredRoute> {
  const res = await fetch(`/api/routes/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to get route (${res.status})`);
  return res.json();
}

export async function startRoute(id: string): Promise<void> {
  const res = await fetch(`/api/routes/${encodeURIComponent(id)}/start`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to start route (${res.status})`);
}

export async function stopRoute(id: string): Promise<void> {
  const res = await fetch(`/api/routes/${encodeURIComponent(id)}/stop`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to stop route (${res.status})`);
}

export async function deleteRouteApi(id: string): Promise<void> {
  const res = await fetch(`/api/routes/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete route (${res.status})`);
}

export async function renameRoute(id: string, name: string): Promise<SavedRouteSummary> {
  const res = await fetch(`/api/routes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Failed to rename route (${res.status})`);
  return res.json();
}

export async function getRoutePosition(id: string): Promise<VehiclePosition | null> {
  const res = await fetch(`/api/routes/${encodeURIComponent(id)}/position`);
  if (!res.ok) throw new Error(`Failed to get position (${res.status})`);
  const data = await res.json();
  if (!data.position) return null;
  return data as VehiclePosition;
}
