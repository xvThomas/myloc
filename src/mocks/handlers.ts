import { http, HttpResponse } from "msw";
import { getAllRoutes, getRoute, putRoute, deleteRoute } from "./db";
import type { StoredRoute } from "../types/vehicle";
import type { RouteResult } from "../services/routeService";

// --- Vehicle interpolation logic (duplicated from useVehicleSimulation for MSW context) ---

interface TimedPoint {
  lng: number;
  lat: number;
  cumulativeTime: number;
  segDistanceM: number;
  segDurationSec: number;
}

function buildTimedPoints(route: RouteResult): TimedPoint[] {
  const points: TimedPoint[] = [];
  let cumulativeTime = 0;

  for (const step of route.steps) {
    const coords = step.geometry.coordinates as [number, number][];
    if (coords.length < 2) continue;

    let stepLen = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i]!;
      const [x2, y2] = coords[i + 1]!;
      stepLen += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    if (points.length === 0) {
      points.push({ lng: coords[0]![0], lat: coords[0]![1], cumulativeTime, segDistanceM: 0, segDurationSec: 0 });
    }

    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i]!;
      const [x2, y2] = coords[i + 1]!;
      const segLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const ratio = stepLen > 0 ? segLen / stepLen : 0;
      const segDuration = ratio * step.duration;
      const segDistance = ratio * step.distance;
      cumulativeTime += segDuration;
      points.push({ lng: x2, lat: y2, cumulativeTime, segDistanceM: segDistance, segDurationSec: segDuration });
    }
  }

  return points;
}

function interpolateAtTime(points: TimedPoint[], timeSec: number) {
  if (points.length === 0) return null;
  if (timeSec <= 0) {
    const p = points[0]!;
    return { position: { lng: p.lng, lat: p.lat }, speedKmh: 0 };
  }
  const last = points[points.length - 1]!;
  if (timeSec >= last.cumulativeTime) {
    return { position: { lng: last.lng, lat: last.lat }, speedKmh: 0 };
  }

  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid]!.cumulativeTime <= timeSec) lo = mid;
    else hi = mid;
  }

  const p1 = points[lo]!;
  const p2 = points[hi]!;
  const segDuration = p2.cumulativeTime - p1.cumulativeTime;
  const ratio = segDuration > 0 ? (timeSec - p1.cumulativeTime) / segDuration : 0;

  const speedKmh = p2.segDurationSec > 0 ? (p2.segDistanceM / p2.segDurationSec) * 3.6 : 0;

  return {
    position: {
      lng: p1.lng + (p2.lng - p1.lng) * ratio,
      lat: p1.lat + (p2.lat - p1.lat) * ratio,
    },
    speedKmh,
  };
}

// --- MSW Handlers ---

export const handlers = [
  // List all routes (summary only)
  http.get("/api/routes", async () => {
    const routes = await getAllRoutes();
    const summaries = routes.map(({ id, name, status }) => ({ id, name, status }));
    return HttpResponse.json(summaries);
  }),

  // Get a single route (full details)
  http.get("/api/routes/:id", async ({ params }) => {
    const route = await getRoute(params.id as string);
    if (!route) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(route);
  }),

  // Create a new route
  http.post("/api/routes", async ({ request }) => {
    const body = (await request.json()) as { name: string; routeResult: RouteResult };
    const id = crypto.randomUUID();
    const storedRoute: StoredRoute = {
      id,
      name: body.name,
      status: "idle",
      routeResult: body.routeResult,
      startedAt: null,
    };
    await putRoute(storedRoute);
    return HttpResponse.json({ id, name: body.name, status: "idle" }, { status: 201 });
  }),

  // Update route name
  http.patch("/api/routes/:id", async ({ params, request }) => {
    const route = await getRoute(params.id as string);
    if (!route) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = (await request.json()) as { name?: string };
    if (body.name) {
      route.name = body.name;
    }
    await putRoute(route);
    return HttpResponse.json({ id: route.id, name: route.name, status: route.status });
  }),

  // Delete a route
  http.delete("/api/routes/:id", async ({ params }) => {
    await deleteRoute(params.id as string);
    return new HttpResponse(null, { status: 204 });
  }),

  // Start a route
  http.post("/api/routes/:id/start", async ({ params }) => {
    const route = await getRoute(params.id as string);
    if (!route) {
      return new HttpResponse(null, { status: 404 });
    }
    route.status = "started";
    route.startedAt = Date.now();
    await putRoute(route);
    return new HttpResponse(null, { status: 200 });
  }),

  // Stop a route
  http.post("/api/routes/:id/stop", async ({ params }) => {
    const route = await getRoute(params.id as string);
    if (!route) {
      return new HttpResponse(null, { status: 404 });
    }
    route.status = "stopped";
    await putRoute(route);
    return new HttpResponse(null, { status: 200 });
  }),

  // Get current vehicle position
  http.get("/api/routes/:id/position", async ({ params }) => {
    const route = await getRoute(params.id as string);
    if (!route) {
      return new HttpResponse(null, { status: 404 });
    }
    if (route.status !== "started" || !route.startedAt) {
      return HttpResponse.json({ position: null });
    }

    const elapsedSec = (Date.now() - route.startedAt) / 1000;
    const timedPoints = buildTimedPoints(route.routeResult);
    if (timedPoints.length < 2) {
      return HttpResponse.json({ position: null });
    }

    const totalDuration = timedPoints[timedPoints.length - 1]!.cumulativeTime;
    // Ping-pong: forward then backward
    const cycleTime = elapsedSec % (totalDuration * 2);
    const forward = cycleTime < totalDuration;
    const currentTime = forward ? cycleTime : totalDuration - (cycleTime - totalDuration);

    const result = interpolateAtTime(timedPoints, currentTime);
    if (!result) {
      return HttpResponse.json({ position: null });
    }

    return HttpResponse.json(result);
  }),
];
