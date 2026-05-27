import { useEffect } from "react";
import type { LatLng } from "../types/geo";
import type { RouteResult } from "../services/routeService";
import { useVehicleSimulation } from "../hooks/useVehicleSimulation";
import { useMeetingPoint, computeRemainingPedestrianTime } from "../hooks/useMeetingPoint";
import RouteLayer from "./RouteLayer";
import PedestrianRouteLayer from "./PedestrianRouteLayer";
import VehicleMarker from "./VehicleMarker";
import RouteFlags from "./RouteFlags";

export interface RouteInstanceInfo {
  pedestrianTimeSec: number;
  vehicleTimeSec: number;
  computing: boolean;
}

interface RouteInstanceProps {
  route: RouteResult;
  routeIndex: number;
  userPosition: LatLng | null;
  selected?: boolean;
  onInfoChange?: (index: number, info: RouteInstanceInfo) => void;
}

export default function RouteInstance({ route, routeIndex, userPosition, selected = false, onInfoChange }: RouteInstanceProps) {
  const vehicle = useVehicleSimulation(route);
  const { result: meetingResult, computing: meetingComputing, compute: computeMeeting } = useMeetingPoint();

  // Auto-compute meeting point when vehicle simulation is ready and GPS is available
  useEffect(() => {
    if (vehicle && userPosition && !meetingResult && !meetingComputing) {
      computeMeeting(userPosition, vehicle.timedPoints, vehicle.currentTimeSec);
    }
  }, [vehicle, userPosition, meetingResult, meetingComputing, computeMeeting]);

  // Report info to parent for MeetingInfo display
  useEffect(() => {
    if (!onInfoChange) return;

    let pedestrianTimeSec = 0;
    if (meetingResult && userPosition) {
      pedestrianTimeSec = computeRemainingPedestrianTime(userPosition, meetingResult.pedestrianTimedPoints);
    } else if (meetingResult) {
      pedestrianTimeSec = meetingResult.pedestrianTimeSec;
    }

    let vehicleTimeSec = 0;
    if (meetingResult && vehicle) {
      const mp = meetingResult.meetingPointCumulativeTime;
      const ct = vehicle.currentTimeSec;
      const total = meetingResult.totalDurationSec;
      if (vehicle.isForward) {
        vehicleTimeSec = ct <= mp ? mp - ct : (total - ct) + (total - mp);
      } else {
        vehicleTimeSec = ct >= mp ? ct - mp : ct + mp;
      }
    }

    onInfoChange(routeIndex, { pedestrianTimeSec, vehicleTimeSec, computing: meetingComputing });
  });

  const id = `route-${routeIndex}`;

  return (
    <>
      <RouteFlags
        start={route.start}
        end={route.end}
        routeComputed={true}
        id={id}
      />
      <RouteLayer route={route} id={id} selected={selected} />
      <PedestrianRouteLayer
        route={meetingResult?.pedestrianRoute ?? null}
        id={`pedestrian-${id}`}
        selected={selected}
      />
      <VehicleMarker vehicle={vehicle} />
    </>
  );
}
