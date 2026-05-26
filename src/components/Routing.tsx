import { useCallback, useEffect, useState } from "react";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { LatLng } from "../types/geo";

type MapClickHandler = (event: MapLayerMouseEvent) => void;

interface RoutingProps {
  onMapClickChange: (handler: MapClickHandler) => void;
}

export default function Routing({ onMapClickChange }: RoutingProps) {
  const [clickStep, setClickStep] = useState(0);
  const [startCoords, setStartCoords] = useState<LatLng | null>(null);
  const [endCoords, setEndCoords] = useState<LatLng | null>(null);

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const { lat, lng } = event.lngLat;

      if (clickStep === 0) {
        setStartCoords({ lat, lng });
        setEndCoords(null);
        setClickStep(1);
        return;
      }

      if (clickStep === 1) {
        setEndCoords({ lat, lng });
        setClickStep(2);
        return;
      }

      setStartCoords(null);
      setEndCoords(null);
      setClickStep(0);
    },
    [clickStep]
  );

  useEffect(() => {
    onMapClickChange(() => handleMapClick);
  }, [handleMapClick, onMapClickChange]);

  return (
    <>
      {startCoords && (
        <div className="absolute left-1/2 top-16 -translate-x-1/2 rounded-lg bg-white/90 px-3 py-2 text-sm font-mono shadow">
          Départ: {startCoords.lat.toFixed(2)}, {startCoords.lng.toFixed(2)}
        </div>
      )}

      {endCoords && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-lg bg-white/90 px-3 py-2 text-sm font-mono shadow">
          Arrivée: {endCoords.lat.toFixed(2)}, {endCoords.lng.toFixed(2)}
        </div>
      )}
    </>
  );
}
