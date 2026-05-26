import { Marker } from "react-map-gl/maplibre";
import type { LatLng } from "../types/geo";

interface RouteFlagsProps {
  start: LatLng | null;
  end: LatLng | null;
}

export default function RouteFlags({ start, end }: RouteFlagsProps) {
  return (
    <>
      {start && (
        <Marker longitude={start.lng} latitude={start.lat} anchor="bottom">
          <div className="relative h-10 w-8">
            <span className="absolute bottom-0 left-1/2 h-8 w-0.5 -translate-x-1/2 bg-slate-700" />
            <span
              className="absolute left-1/2 top-1 h-4 w-5 -translate-x-[1px] rounded-sm bg-emerald-500 shadow"
              style={{ clipPath: "polygon(0 0, 100% 20%, 0 100%)" }}
            />
          </div>
        </Marker>
      )}

      {end && (
        <Marker longitude={end.lng} latitude={end.lat} anchor="bottom">
          <div className="relative h-10 w-8">
            <span className="absolute bottom-0 left-1/2 h-8 w-0.5 -translate-x-1/2 bg-slate-700" />
            <span
              className="absolute left-1/2 top-1 h-4 w-5 -translate-x-[1px] rounded-sm border border-white shadow"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #dc2626 25%, #111827 25%, #111827 50%, #dc2626 50%, #dc2626 75%, #111827 75%, #111827 100%)",
                backgroundSize: "8px 8px",
              }}
            />
          </div>
        </Marker>
      )}
    </>
  );
}
