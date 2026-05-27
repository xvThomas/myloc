import { useCallback, useEffect, useState } from "react";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { LatLng } from "../types/geo";
import { computeRoute, type RouteResult } from "../services/routeService";
import RouteDialog from "./RouteDialog";

type Phase = "idle" | "start" | "dialog" | "computing" | "done";
type MapClickHandler = (event: MapLayerMouseEvent) => void;

interface RoutingProps {
  onMapClickChange: (handler: MapClickHandler) => void;
  onPointsChange: (start: LatLng | null, end: LatLng | null) => void;
  onRouteChange: (route: RouteResult | null) => void;
}

export default function Routing({ onMapClickChange, onPointsChange, onRouteChange }: RoutingProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [startCoords, setStartCoords] = useState<LatLng | null>(null);
  const [endCoords, setEndCoords] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStartCoords(null);
    setEndCoords(null);
    setPhase("idle");
    setError(null);
    onRouteChange(null);
  }, [onRouteChange]);

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const { lat, lng } = event.lngLat;

      if (phase === "idle") {
        setStartCoords({ lat, lng });
        setEndCoords(null);
        setError(null);
        onRouteChange(null);
        setPhase("start");
        return;
      }

      if (phase === "start") {
        setEndCoords({ lat, lng });
        setPhase("dialog");
        return;
      }

      if (phase === "done") {
        // New click after route displayed: reset and start fresh
        setStartCoords({ lat, lng });
        setEndCoords(null);
        setError(null);
        onRouteChange(null);
        setPhase("start");
      }
    },
    [phase, onRouteChange]
  );

  const handleCalculate = useCallback(async () => {
    if (!startCoords || !endCoords) return;
    setPhase("computing");
    setLoading(true);
    setError(null);
    try {
      const result = await computeRoute(startCoords, endCoords);
      onRouteChange(result);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setPhase("dialog");
    } finally {
      setLoading(false);
    }
  }, [startCoords, endCoords, onRouteChange]);

  const handleCancel = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    onMapClickChange(() => handleMapClick);
  }, [handleMapClick, onMapClickChange]);

  useEffect(() => {
    onPointsChange(startCoords, endCoords);
  }, [startCoords, endCoords, onPointsChange]);

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

      {(phase === "dialog" || phase === "computing") && (
        <RouteDialog
          onCalculate={handleCalculate}
          onCancel={handleCancel}
          loading={loading}
        />
      )}

      {error && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-red-100 px-4 py-2 text-sm text-red-700 shadow">
          {error}
        </div>
      )}
    </>
  );
}
