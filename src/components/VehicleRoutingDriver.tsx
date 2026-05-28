import { useCallback, useEffect, useState } from "react";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { LatLng } from "../types/geo";
import { computeRoute, type RouteResult } from "../services/routeService";
import VehicleSaveDialog from "./VehicleSaveDialog";

type Phase = "idle" | "waypoints" | "settingEnd" | "computing" | "saving" | "done";
type MapClickHandler = (event: MapLayerMouseEvent) => void;

interface VehicleRoutingDriverProps {
  onMapClickChange: (handler: MapClickHandler) => void;
  onContextMenuChange: (handler: MapClickHandler) => void;
  onPointsChange: (start: LatLng | null, end: LatLng | null, waypoints: LatLng[]) => void;
  onSave: (name: string, routeResult: RouteResult) => void;
  onSaveAndStart: (name: string, routeResult: RouteResult) => void;
  active: boolean;
}

export default function VehicleRoutingDriver({
  onMapClickChange,
  onContextMenuChange,
  onPointsChange,
  onSave,
  onSaveAndStart,
  active,
}: VehicleRoutingDriverProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [startCoords, setStartCoords] = useState<LatLng | null>(null);
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);
  const [endCoords, setEndCoords] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [computedRoute, setComputedRoute] = useState<RouteResult | null>(null);

  const reset = useCallback(() => {
    setStartCoords(null);
    setWaypoints([]);
    setEndCoords(null);
    setPhase("idle");
    setError(null);
    setComputedRoute(null);
  }, []);

  // Reset state when entering or leaving creation mode
  useEffect(() => {
    reset();
  }, [active, reset]);

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const { lat, lng } = event.lngLat;

      if (phase === "idle" && active) {
        setStartCoords({ lat, lng });
        setWaypoints([]);
        setEndCoords(null);
        setError(null);
        setComputedRoute(null);
        setPhase("waypoints");
        return;
      }

      if (phase === "waypoints") {
        setWaypoints((prev) => [...prev, { lat, lng }]);
        return;
      }

      if (phase === "settingEnd") {
        setEndCoords({ lat, lng });
        // Immediately compute
        doCompute({ lat, lng });
        return;
      }
    },
    [phase, startCoords, waypoints]
  );

  const doCompute = useCallback(
    async (end: LatLng) => {
      if (!startCoords) return;
      setPhase("computing");
      setError(null);
      try {
        const result = await computeRoute(startCoords, end, waypoints);
        setStartCoords(result.start);
        setEndCoords(result.end);
        setComputedRoute(result);
        setPhase("saving");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        setPhase("waypoints");
      }
    },
    [startCoords, waypoints]
  );

  const handleContextMenu = useCallback(
    (event: MapLayerMouseEvent) => {
      const { lat, lng } = event.lngLat;
      if (phase === "waypoints" || phase === "settingEnd") {
        setEndCoords({ lat, lng });
        doCompute({ lat, lng });
      }
    },
    [phase, doCompute]
  );

  const handleSave = useCallback(
    (name: string) => {
      if (computedRoute) {
        onSave(name, computedRoute);
        setPhase("done");
      }
    },
    [computedRoute, onSave]
  );

  const handleSaveAndStart = useCallback(
    (name: string) => {
      if (computedRoute) {
        onSaveAndStart(name, computedRoute);
        setPhase("done");
      }
    },
    [computedRoute, onSaveAndStart]
  );

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
            Cliquez = étape
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
          Cliquez sur la carte pour définir l'arrivée
        </div>
      )}

      {phase === "computing" && (
        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-blue-100 px-4 py-2 text-xs font-medium text-blue-700 shadow">
          Calcul en cours...
        </div>
      )}

      {phase === "saving" && computedRoute && (
        <VehicleSaveDialog
          onSave={handleSave}
          onSaveAndStart={handleSaveAndStart}
          onCancel={reset}
        />
      )}

      {error && (
        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-red-100 px-4 py-2 text-sm text-red-700 shadow">
          {error}
        </div>
      )}
    </>
  );
}
