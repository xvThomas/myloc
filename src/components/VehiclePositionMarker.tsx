import { Marker } from "react-map-gl/maplibre";
import type { VehiclePosition } from "../types/vehicle";

interface VehiclePositionMarkerProps {
  vehicle: VehiclePosition | null;
}

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VehiclePositionMarker({ vehicle }: VehiclePositionMarkerProps) {
  if (!vehicle) return null;

  return (
    <Marker longitude={vehicle.position.lng} latitude={vehicle.position.lat} anchor="center">
      <div className="relative">
        <div className="h-5 w-5 rounded-full border-2 border-white bg-red-600 shadow-lg" />
        <span className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-red-600 px-1 py-0.5 text-xs font-bold text-white shadow">
          {Math.round(vehicle.speedKmh)} km/h
        </span>
        {vehicle.remainingTimeSec > 0 && (
          <span className="absolute left-6 top-full mt-0.5 whitespace-nowrap rounded bg-slate-800 px-1 py-0.5 text-xs font-bold text-white shadow">
            ⏱ {formatRemaining(vehicle.remainingTimeSec)}
          </span>
        )}
      </div>
    </Marker>
  );
}
