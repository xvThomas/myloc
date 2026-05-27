import { useState, useEffect, useRef, useMemo } from "react";
import type { LatLng } from "../types/geo";
import type { RouteResult } from "../services/routeService";

export interface VehicleState {
  position: LatLng;
  speedKmh: number;
  currentTimeSec: number;
  isForward: boolean;
  timedPoints: TimedPoint[];
}

export interface TimedPoint {
  lng: number;
  lat: number;
  // Cumulative time in seconds from route start to reach this point
  cumulativeTime: number;
  // Distance in meters for the segment ending at this point
  segDistanceM: number;
  // Duration in seconds for the segment ending at this point
  segDurationSec: number;
}

// Build a time-indexed array of coordinates from step geometries and durations
function buildTimedPoints(route: RouteResult): TimedPoint[] {
  const points: TimedPoint[] = [];
  let cumulativeTime = 0;

  for (const step of route.steps) {
    const coords = step.geometry.coordinates as [number, number][];
    if (coords.length < 2) continue;

    // Compute geographic length of this step
    let stepLen = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i]!;
      const [x2, y2] = coords[i + 1]!;
      stepLen += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // Add first point of step (avoid duplicates with previous step's last point)
    if (points.length === 0) {
      points.push({ lng: coords[0]![0], lat: coords[0]![1], cumulativeTime, segDistanceM: 0, segDurationSec: 0 });
    }

    // Distribute step duration and distance proportionally to segment lengths within the step
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

// Interpolate position and compute speed at a given time (seconds)
function interpolateAtTime(points: TimedPoint[], timeSec: number): Pick<VehicleState, "position" | "speedKmh"> {
  if (timeSec <= 0) {
    const p = points[0]!;
    return { position: { lng: p.lng, lat: p.lat }, speedKmh: 0 };
  }
  const last = points[points.length - 1]!;
  if (timeSec >= last.cumulativeTime) {
    return { position: { lng: last.lng, lat: last.lat }, speedKmh: 0 };
  }

  // Binary search for the segment containing timeSec
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

  // Speed in km/h for the current segment
  const speedKmh = p2.segDurationSec > 0
    ? (p2.segDistanceM / p2.segDurationSec) * 3.6
    : 0;

  return {
    position: {
      lng: p1.lng + (p2.lng - p1.lng) * ratio,
      lat: p1.lat + (p2.lat - p1.lat) * ratio,
    },
    speedKmh,
  };
}

export function useVehicleSimulation(route: RouteResult | null): VehicleState | null {
  const [vehicleState, setVehicleState] = useState<VehicleState | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const timedPoints = useMemo(() => {
    if (!route || route.steps.length === 0) return null;
    return buildTimedPoints(route);
  }, [route]);

  useEffect(() => {
    if (!timedPoints || timedPoints.length < 2) {
      setVehicleState(null);
      return;
    }

    const totalDurationSec = timedPoints[timedPoints.length - 1]!.cumulativeTime;
    if (totalDurationSec <= 0) return;

    const totalDurationMs = totalDurationSec * 1000;
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      // Full cycle = forward + backward
      const cycleTime = elapsed % (totalDurationMs * 2);
      const forward = cycleTime < totalDurationMs;
      const currentTimeSec = forward
        ? (cycleTime / 1000)
        : totalDurationSec - ((cycleTime - totalDurationMs) / 1000);

      const state = interpolateAtTime(timedPoints, currentTimeSec);
      setVehicleState({ ...state, currentTimeSec, isForward: forward, timedPoints });
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [timedPoints]);

  return vehicleState;
}
