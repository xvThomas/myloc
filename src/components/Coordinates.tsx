import type { LatLng } from "../types/geo";

interface CoordinatesProps {
  position: LatLng | null;
  zoom: number;
}

export default function Coordinates({ position, zoom }: CoordinatesProps) {
  if (!position) return null;

  return (
    <div className="absolute bottom-6 left-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-mono shadow">
      {position.lat.toFixed(2)}, {position.lng.toFixed(2)} · z{zoom.toFixed(1)}
    </div>
  );
}
