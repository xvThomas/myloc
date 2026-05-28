import { useRef, useCallback, useState, useEffect } from "react";
import Map, { Marker, type MapRef, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import VehicleRouteList from "../components/VehicleRouteList";
import VehicleRoutingDriver from "../components/VehicleRoutingDriver";
import VehiclePositionMarker from "../components/VehiclePositionMarker";
import VehicleRouteSteps from "../components/VehicleRouteSteps";
import RouteLayer from "../components/RouteLayer";
import RouteFlags from "../components/RouteFlags";
import {
  useVehicleRouteList,
  useVehicleRoute,
  useVehiclePosition,
  useSaveRoute,
  useStartRoute,
  useStopRoute,
  useDeleteRoute,
  useRenameRoute,
} from "../hooks/useVehicleRoutes";
import type { RouteResult } from "../services/routeService";
import type { LatLng } from "../types/geo";
import type { RouteType } from "../types/vehicle";

const IGN_STYLE = "https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json";

export default function DriverPage() {
  const mapRef = useRef<MapRef>(null);

  // React Query hooks
  const { data: routes = [] } = useVehicleRouteList();
  const saveRouteMutation = useSaveRoute();
  const startRouteMutation = useStartRoute();
  const stopRouteMutation = useStopRoute();
  const deleteRouteMutation = useDeleteRoute();
  const renameRouteMutation = useRenameRoute();

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [creatingRoute, setCreatingRoute] = useState(true);
  const [highlightedPoint, setHighlightedPoint] = useState<LatLng | null>(null);
  const [selectedStep, setSelectedStep] = useState<{ portionIndex: number; stepIndex: number } | null>(null);

  // Routing state machine handlers
  const [mapClickHandler, setMapClickHandler] = useState<(event: MapLayerMouseEvent) => void>(() => () => {});
  const [mapContextMenuHandler, setMapContextMenuHandler] = useState<(event: MapLayerMouseEvent) => void>(() => () => {});
  const [routeStart, setRouteStart] = useState<LatLng | null>(null);
  const [routeWaypoints, setRouteWaypoints] = useState<LatLng[]>([]);
  const [routeEnd, setRouteEnd] = useState<LatLng | null>(null);

  // Get selected route status
  const selectedRoute = routes.find((r) => r.id === selectedRouteId);
  const isStarted = selectedRoute?.status === "started";

  // Fetch full route geometry via React Query
  const { data: fullRoute } = useVehicleRoute(selectedRouteId);
  const selectedRouteResult = fullRoute?.routeResult ?? null;

  // Poll vehicle position for selected route
  const { data: vehiclePosition = null } = useVehiclePosition(selectedRouteId, isStarted);

  // Fit map to route bounds when full route loads
  useEffect(() => {
    if (!selectedRouteResult) return;
    const bbox = selectedRouteResult.bbox;
    if (bbox && mapRef.current) {
      mapRef.current.fitBounds(
        [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
        { padding: 60, duration: 500 }
      );
    }
  }, [selectedRouteResult]);

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      mapClickHandler(event);
    },
    [mapClickHandler]
  );

  const handleContextMenu = useCallback(
    (event: MapLayerMouseEvent) => {
      mapContextMenuHandler(event);
    },
    [mapContextMenuHandler]
  );

  const handleStepClick = useCallback(
    (position: LatLng, portionIndex: number, stepIndex: number) => {
      setHighlightedPoint(position);
      setSelectedStep({ portionIndex, stepIndex });
      mapRef.current?.flyTo({ center: [position.lng, position.lat], duration: 500 });
    },
    []
  );

  const handleSave = useCallback(
    async (name: string, routeResult: RouteResult, routeType: RouteType) => {
      const saved = await saveRouteMutation.mutateAsync({ name, routeResult, routeType });
      setSelectedRouteId(saved.id);
      setCreatingRoute(false);
    },
    [saveRouteMutation]
  );

  const handleSaveAndStart = useCallback(
    async (name: string, routeResult: RouteResult, routeType: RouteType) => {
      const saved = await saveRouteMutation.mutateAsync({ name, routeResult, routeType });
      await startRouteMutation.mutateAsync(saved.id);
      setSelectedRouteId(saved.id);
      setCreatingRoute(false);
    },
    [saveRouteMutation, startRouteMutation]
  );

  const handleStart = useCallback(
    async (id: string) => {
      await startRouteMutation.mutateAsync(id);
      setSelectedRouteId(id);
      setCreatingRoute(false);
    },
    [startRouteMutation]
  );

  const handleStop = useCallback(
    async (id: string) => {
      await stopRouteMutation.mutateAsync(id);
    },
    [stopRouteMutation]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteRouteMutation.mutateAsync(id);
      if (selectedRouteId === id) {
        setSelectedRouteId(null);
      }
    },
    [deleteRouteMutation, selectedRouteId]
  );

  const handleRename = useCallback(
    async (id: string, newName: string) => {
      await renameRouteMutation.mutateAsync({ id, name: newName });
    },
    [renameRouteMutation]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedRouteId(id);
    setCreatingRoute(false);
    setHighlightedPoint(null);
    setSelectedStep(null);
  }, []);

  const handleNewRoute = useCallback(() => {
    setSelectedRouteId(null);
    setCreatingRoute(true);
    setHighlightedPoint(null);
    setSelectedStep(null);
  }, []);

  return (
    <div className="flex h-dvh w-full">
      {/* Left sidebar */}
      <VehicleRouteList
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelect={handleSelect}
        onStart={handleStart}
        onStop={handleStop}
        onDelete={handleDelete}
        onRename={handleRename}
        onNewRoute={handleNewRoute}
      />

      {/* Map area */}
      <div className="relative flex-1">
        <Map
          ref={mapRef}
          initialViewState={{ longitude: 2.35, latitude: 46.85, zoom: 6 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={IGN_STYLE}
          onClick={handleMapClick}
          onContextMenu={handleContextMenu}
          minZoom={6}
          maxZoom={18.99}
        >
          {/* Display selected route */}
          {selectedRouteResult && (
            <>
              <RouteLayer route={selectedRouteResult} id="driver-selected-route" />
              <RouteFlags
                start={selectedRouteResult.start}
                end={selectedRouteResult.end}
                waypoints={selectedRouteResult.portions.slice(1).map((p) => p.start)}
                routeComputed={false}
                id="driver-selected"
              />
            </>
          )}

          {/* Flags for route being created */}
          <RouteFlags start={routeStart} end={routeEnd} waypoints={routeWaypoints} routeComputed={false} id="driver-current" />

          {/* Vehicle position marker */}
          <VehiclePositionMarker vehicle={vehiclePosition} />

          {/* Highlighted step marker (red dot) */}
          {highlightedPoint && (
            <Marker longitude={highlightedPoint.lng} latitude={highlightedPoint.lat} anchor="center">
              <div className="h-4 w-4 rounded-full border-2 border-white bg-red-600 shadow-md" />
            </Marker>
          )}
        </Map>

        {/* Route creation state machine */}
        <VehicleRoutingDriver
          onMapClickChange={setMapClickHandler}
          onContextMenuChange={setMapContextMenuHandler}
          onPointsChange={(start, end, waypoints) => {
            setRouteStart(start);
            setRouteEnd(end);
            setRouteWaypoints(waypoints);
          }}
          onSave={handleSave}
          onSaveAndStart={handleSaveAndStart}
          active={creatingRoute}
        />
      </div>

      {/* Right panel: route steps */}
      {selectedRouteResult && (
        <VehicleRouteSteps
          portions={selectedRouteResult.portions}
          onClose={() => {
            setSelectedRouteId(null);
            setHighlightedPoint(null);
            setSelectedStep(null);
          }}
          onStepClick={handleStepClick}
          selectedStep={selectedStep}
        />
      )}
    </div>
  );
}
