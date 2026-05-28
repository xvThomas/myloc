import { useRef, useCallback, useState, useEffect } from "react";
import Map, { Marker, type MapRef, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import VehicleRouteList from "../components/VehicleRouteList";
import VehicleRoutingDriver from "../components/VehicleRoutingDriver";
import VehiclePositionMarker from "../components/VehiclePositionMarker";
import VehicleRouteSteps from "../components/VehicleRouteSteps";
import RouteLayer from "../components/RouteLayer";
import RouteFlags from "../components/RouteFlags";
import { useDriverRoutes } from "../hooks/useDriverRoutes";
import { useVehiclePosition } from "../hooks/useVehiclePosition";
import { getFullRoute } from "../services/vehicleRouteApi";
import type { RouteResult } from "../services/routeService";
import type { LatLng } from "../types/geo";

const IGN_STYLE = "https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json";

export default function DriverPage() {
  const mapRef = useRef<MapRef>(null);
  const { routes, saveRoute, startRoute, stopRoute, removeRoute, renameRoute } = useDriverRoutes();

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedRouteResult, setSelectedRouteResult] = useState<RouteResult | null>(null);
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

  // Poll vehicle position for selected route
  const vehiclePosition = useVehiclePosition(selectedRouteId, isStarted);

  // Load full route geometry when selection changes and fit map to bounds
  useEffect(() => {
    if (!selectedRouteId) {
      setSelectedRouteResult(null);
      return;
    }
    let cancelled = false;
    getFullRoute(selectedRouteId).then((stored) => {
      if (cancelled) return;
      setSelectedRouteResult(stored.routeResult);
      // Fit map to route bounding box from IGN API
      const bbox = stored.routeResult.bbox;
      if (bbox && mapRef.current) {
        mapRef.current.fitBounds(
          [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
          { padding: 60, duration: 500 }
        );
      }
    });
    return () => { cancelled = true; };
  }, [selectedRouteId]);

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
    async (name: string, routeResult: RouteResult) => {
      const saved = await saveRoute(name, routeResult);
      setSelectedRouteId(saved.id);
      setCreatingRoute(false);
    },
    [saveRoute]
  );

  const handleSaveAndStart = useCallback(
    async (name: string, routeResult: RouteResult) => {
      const saved = await saveRoute(name, routeResult);
      await startRoute(saved.id);
      setSelectedRouteId(saved.id);
      setCreatingRoute(false);
    },
    [saveRoute, startRoute]
  );

  const handleStart = useCallback(
    async (id: string) => {
      await startRoute(id);
    },
    [startRoute]
  );

  const handleStop = useCallback(
    async (id: string) => {
      await stopRoute(id);
    },
    [stopRoute]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await removeRoute(id);
      if (selectedRouteId === id) {
        setSelectedRouteId(null);
        setSelectedRouteResult(null);
      }
    },
    [removeRoute, selectedRouteId]
  );

  const handleRename = useCallback(
    async (id: string, newName: string) => {
      await renameRoute(id, newName);
    },
    [renameRoute]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedRouteId(id);
    setCreatingRoute(false);
    setHighlightedPoint(null);
    setSelectedStep(null);
  }, []);

  const handleNewRoute = useCallback(() => {
    setSelectedRouteId(null);
    setSelectedRouteResult(null);
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
            setSelectedRouteResult(null);
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
