import { useCallback, useEffect, useState } from "react";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { LatLng } from "../types/geo";
import { computeRoute, type RouteResult } from "../services/routeService";
import RouteDialog from "./RouteDialog";

type Phase = "idle" | "waypoints" | "settingEnd" | "dialog" | "computing" | "done";
type MapClickHandler = (event: MapLayerMouseEvent) => void;

interface RoutingProps {
  onMapClickChange: (handler: MapClickHandler) => void;
  onContextMenuChange: (handler: MapClickHandler) => void;
  onPointsChange: (start: LatLng | null, end: LatLng | null, waypoints: LatLng[]) => void;
  onRouteChange: (route: RouteResult | null) => void;
}

export default function Routing({ onMapClickChange, onContextMenuChange, onPointsChange, onRouteChange }: RoutingProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [startCoords, setStartCoords] = useState<LatLng | null>(null);
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);
  const [endCoords, setEndCoords] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStartCoords(null);
    setWaypoints([]);
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
        setWaypoints([]);
        setEndCoords(null);
        setError(null);
        onRouteChange(null);
        setPhase("waypoints");
        return;
      }

      if (phase === "waypoints") {
        setWaypoints((prev) => [...prev, { lat, lng }]);
        return;
      }

      // Next tap after pressing "Définir l'arrivée" sets the end point
      if (phase === "settingEnd") {
        setEndCoords({ lat, lng });
        setPhase("dialog");
        return;
      }

      if (phase === "done") {
        setStartCoords({ lat, lng });
        setWaypoints([]);
        setEndCoords(null);
        setError(null);
        onRouteChange(null);
        setPhase("waypoints");
      }
    },
    [phase, onRouteChange]
  );

  // Right-click (desktop) / long-press: set end point
  const handleContextMenu = useCallback(
    (event: MapLayerMouseEvent) => {
      const { lat, lng } = event.lngLat;

      if (phase === "waypoints" || phase === "settingEnd") {
        setEndCoords({ lat, lng });
        setPhase("dialog");
      }
    },
    [phase]
  );

  const handleCalculate = useCallback(async () => {
    if (!startCoords || !endCoords) return;
    setPhase("computing");
    setLoading(true);
    setError(null);
    try {
      const result = await computeRoute(startCoords, endCoords, waypoints);
      // Snap start/end markers to actual snapped positions from API
      setStartCoords(result.start);
      setEndCoords(result.end);
      onRouteChange(result);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setPhase("dialog");
    } finally {
      setLoading(false);
    }
  }, [startCoords, endCoords, waypoints, onRouteChange]);

  const handleCancel = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    onMapClickChange(() => handleMapClick);
  }, [handleMapClick, onMapClickChange]);

  useEffect(() => {
    onContextMenuChange(() => handleContextMenu);
  }, [handleContextMenu, onContextMenuChange]);

  useEffect(() => {
    onPointsChange(startCoords, endCoords, waypoints);
  }, [startCoords, endCoords, waypoints, onPointsChange]);

  return (
    <>
      {phase === "waypoints" && (
        <div className="absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2">
          <span className="rounded-full bg-white/90 px-3 py-2 text-xs text-slate-600 shadow">
            Tap = étape
          </span>
          <button
            onClick={() => setPhase("settingEnd")}
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-medium text-white shadow active:bg-red-700"
          >
            Définir l'arrivée
          </button>
        </div>
      )}

      {phase === "settingEnd" && (
        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-red-100 px-4 py-2 text-xs font-medium text-red-700 shadow">
          Touchez la carte pour définir l'arrivée
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
