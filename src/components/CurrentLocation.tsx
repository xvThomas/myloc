import { Marker } from "react-map-gl/maplibre";
import type { LatLng } from "../types/geo";

interface CurrentLocationProps {
  position: LatLng | null;
}

export default function CurrentLocation({ position }: CurrentLocationProps) {
  if (!position) return null;

  return (
    <Marker longitude={position.lng} latitude={position.lat} anchor="center">
      <div className="h-6 w-6 rounded-full border-2 border-white bg-blue-600 shadow-lg" />
    </Marker>
  );
}
