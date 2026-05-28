import { Marker } from "react-map-gl/maplibre";
import type { LatLng } from "../types/geo";

interface RouteFlagsProps {
  start: LatLng | null;
  end: LatLng | null;
  waypoints?: LatLng[];
  routeComputed?: boolean;
  id?: string;
}

export default function RouteFlags({ start, end, waypoints = [], routeComputed = false, id = "default" }: RouteFlagsProps) {
  // Detect circular route (start == end)
  const isCircular = !!(start && end && Math.abs(start.lat - end.lat) < 0.0001 && Math.abs(start.lng - end.lng) < 0.0001);

  return (
    <>
      {start && (
        <Marker key={`${id}-start`} longitude={start.lng} latitude={start.lat} anchor="center">
          <div className={`flex h-6 w-6 items-center justify-center rounded-full border border-white shadow text-[10px] font-bold ${isCircular ? "bg-purple-500 text-white" : "bg-emerald-500 text-black"}`}>
            {isCircular ? "⟳" : "D"}
          </div>
        </Marker>
      )}

      {!routeComputed && waypoints.map((wp, i) => (
        <Marker key={`${id}-wp-${i}`} longitude={wp.lng} latitude={wp.lat} anchor="center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[10px] font-bold text-white shadow">
            {i + 1}
          </div>
        </Marker>
      ))}

      {end && !isCircular && (
        <Marker key={`${id}-end`} longitude={end.lng} latitude={end.lat} anchor="center">
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
