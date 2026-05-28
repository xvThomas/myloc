import { useState, useEffect, useRef } from "react";
import type { VehiclePosition } from "../types/vehicle";
import { getRoutePosition } from "../services/vehicleRouteApi";

export function useVehiclePosition(routeId: string | null, isStarted: boolean): VehiclePosition | null {
  const [position, setPosition] = useState<VehiclePosition | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(0 as unknown as ReturnType<typeof setInterval>);

  useEffect(() => {
    if (!routeId || !isStarted) {
      setPosition(null);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const pos = await getRoutePosition(routeId);
        if (!cancelled) setPosition(pos);
      } catch {
        // Ignore polling errors
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
    };
  }, [routeId, isStarted]);

  return position;
}
