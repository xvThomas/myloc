import { Marker } from "react-map-gl/maplibre";
import type { LatLng } from "../types/geo";

interface RouteFlagsProps {
  start: LatLng | null;
  end: LatLng | null;
  waypoints?: LatLng[];
  routeComputed?: boolean;
}

export default function RouteFlags({ start, end, waypoints = [], routeComputed = false }: RouteFlagsProps) {
  return (
    <>
      {start && (
        <Marker longitude={start.lng} latitude={start.lat} anchor="center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-emerald-500 shadow text-[10px] font-bold text-black">
            D
          </div>
        </Marker>
      )}

      {!routeComputed && waypoints.map((wp, i) => (
        <Marker key={i} longitude={wp.lng} latitude={wp.lat} anchor="center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[10px] font-bold text-white shadow">
            {i + 1}
          </div>
        </Marker>
      ))}

      {end && (
        <Marker longitude={end.lng} latitude={end.lat} anchor="center">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white shadow text-[10px] font-bold text-white"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #dc2626 25%, #111827 25%, #111827 50%, #dc2626 50%, #dc2626 75%, #111827 75%, #111827 100%)",
              backgroundSize: "4px 4px",
            }}
          >
            A
          </div>
        </Marker>
      )}
    </>
  );
}
