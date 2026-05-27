import { useState, useCallback, useRef } from "react";
import type { LatLng } from "../types/geo";
import type { RouteResult } from "../services/routeService";
import { computePedestrianRoute } from "../services/routeService";
import type { TimedPoint } from "./useVehicleSimulation";

export interface MeetingPointResult {
  pedestrianRoute: RouteResult;
  meetingPoint: LatLng;
  pedestrianTimeSec: number;
  pedestrianTimedPoints: PedestrianTimedPoint[];
  meetingPointCumulativeTime: number;
  totalDurationSec: number;
}

export interface PedestrianTimedPoint {
  lng: number;
  lat: number;
  cumulativeTime: number;
}

// Build time-indexed points from pedestrian route steps
function buildPedestrianTimedPoints(route: RouteResult): PedestrianTimedPoint[] {
  const points: PedestrianTimedPoint[] = [];
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
      points.push({ lng: coords[0]![0], lat: coords[0]![1], cumulativeTime });
    }

    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i]!;
      const [x2, y2] = coords[i + 1]!;
      const segLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const ratio = stepLen > 0 ? segLen / stepLen : 0;
      cumulativeTime += ratio * step.duration;
      points.push({ lng: x2, lat: y2, cumulativeTime });
    }
  }

  return points;
}

// Compute remaining pedestrian time by projecting user position onto the pedestrian route
export function computeRemainingPedestrianTime(
  userPos: LatLng,
  timedPoints: PedestrianTimedPoint[]
): number {
  if (timedPoints.length < 2) return 0;

  const totalTime = timedPoints[timedPoints.length - 1]!.cumulativeTime;

  // Find the nearest segment and project onto it
  let bestDist = Infinity;
  let bestTime = 0;

  for (let i = 0; i < timedPoints.length - 1; i++) {
    const p1 = timedPoints[i]!;
    const p2 = timedPoints[i + 1]!;

    // Project userPos onto segment p1-p2
    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = ((userPos.lng - p1.lng) * dx + (userPos.lat - p1.lat) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const projLng = p1.lng + t * dx;
    const projLat = p1.lat + t * dy;
    const dist = Math.sqrt(
      (userPos.lng - projLng) ** 2 + (userPos.lat - projLat) ** 2
    );

    if (dist < bestDist) {
      bestDist = dist;
      // Interpolate cumulative time at projection point
      bestTime = p1.cumulativeTime + t * (p2.cumulativeTime - p1.cumulativeTime);
    }
  }

  return Math.max(0, totalTime - bestTime);
}

// Haversine distance in meters
function haversineM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Find the index of the nearest point on the route to the user
function findNearestIndex(userPos: LatLng, points: TimedPoint[]): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < points.length; i++) {
    const d = haversineM(userPos, { lat: points[i]!.lat, lng: points[i]!.lng });
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return minIdx;
}

// Find candidate meeting points using estimated pedestrian walk time
function findMeetingCandidates(
  userPos: LatLng,
  timedPoints: TimedPoint[],
  vehicleCurrentTimeSec: number,
  totalDurationSec: number
): LatLng[] {
  const PEDESTRIAN_SPEED_MS = 5 / 3.6; // ~1.4 m/s

  // Nearest point as first candidate
  const nearestIdx = findNearestIndex(userPos, timedPoints);
  const nearest = timedPoints[nearestIdx]!;

  // Estimate walk time to nearest point
  const distToNearest = haversineM(userPos, { lat: nearest.lat, lng: nearest.lng });
  const walkTimeEstimate = (distToNearest * 1.3) / PEDESTRIAN_SPEED_MS;

  // Where will vehicle be when pedestrian arrives?
  const vehicleArrivalTime = (vehicleCurrentTimeSec + walkTimeEstimate) % totalDurationSec;

  // Find a point the vehicle reaches around that time
  let meetIdx = nearestIdx;
  for (let i = 0; i < timedPoints.length; i++) {
    if (timedPoints[i]!.cumulativeTime >= vehicleArrivalTime) {
      meetIdx = i;
      break;
    }
  }

  const candidates: LatLng[] = [
    { lat: nearest.lat, lng: nearest.lng },
  ];

  if (meetIdx !== nearestIdx) {
    const meetPt = timedPoints[meetIdx]!;
    candidates.push({ lat: meetPt.lat, lng: meetPt.lng });
  }

  return candidates;
}

export function useMeetingPoint() {
  const [result, setResult] = useState<MeetingPointResult | null>(null);
  const [computing, setComputing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const compute = useCallback(
    async (
      userPos: LatLng,
      timedPoints: TimedPoint[],
      vehicleCurrentTimeSec: number
    ) => {
      if (timedPoints.length < 2) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setComputing(true);

      const totalDurationSec = timedPoints[timedPoints.length - 1]!.cumulativeTime;
      const candidates = findMeetingCandidates(
        userPos,
        timedPoints,
        vehicleCurrentTimeSec,
        totalDurationSec
      );

      let bestResult: MeetingPointResult | null = null;

      for (const candidate of candidates) {
        if (controller.signal.aborted) return;

        try {
          const pedestrianRoute = await computePedestrianRoute(userPos, candidate);
          const pedestrianTimeSec = pedestrianRoute.duration;

          // Find cumulative time for this candidate point on the vehicle route
          let candidateTime = 0;
          for (const pt of timedPoints) {
            if (
              Math.abs(pt.lat - candidate.lat) < 1e-8 &&
              Math.abs(pt.lng - candidate.lng) < 1e-8
            ) {
              candidateTime = pt.cumulativeTime;
              break;
            }
          }

          if (!bestResult || pedestrianTimeSec < bestResult.pedestrianTimeSec) {
            bestResult = {
              pedestrianRoute,
              meetingPoint: candidate,
              pedestrianTimeSec,
              pedestrianTimedPoints: buildPedestrianTimedPoints(pedestrianRoute),
              meetingPointCumulativeTime: candidateTime,
              totalDurationSec,
            };
          }
        } catch {
          // Skip failed candidate
        }
      }

      if (!controller.signal.aborted && bestResult) {
        setResult(bestResult);
      }
      setComputing(false);
    },
    []
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setResult(null);
    setComputing(false);
  }, []);

  return { result, computing, compute, clear };
}
