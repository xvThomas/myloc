import { useRef, useCallback, useState, useEffect } from "react";
import Map, { type MapRef, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import { useGeolocation } from "../hooks/useGeolocation";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import CurrentLocation from "../components/CurrentLocation";
import GPSStatus from "../components/GPSStatus";
import Coordinates from "../components/Coordinates";
import CenterButton from "../components/CenterButton";
import InstallButton from "../components/InstallButton";
import Routing from "../components/Routing";
import RouteFlags from "../components/RouteFlags";
import RouteInstance from "../components/RouteInstance";
import type { RouteInstanceInfo } from "../components/RouteInstance";
import MeetingInfo from "../components/MeetingInfo";
import type { LatLng } from "../types/geo";
import type { RouteResult } from "../services/routeService";

const IGN_STYLE = "https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json";
const DRAG_CLICK_GUARD_MS = 250;

export default function HomePage() {
  const mapRef = useRef<MapRef>(null);
  const { position, error, loading } = useGeolocation();
  const { canInstall, install } = useInstallPrompt();
  const [hasFlown, setHasFlown] = useState(false);
  const [zoom, setZoom] = useState(6);
  const [mapClickHandler, setMapClickHandler] = useState<(event: MapLayerMouseEvent) => void>(() => () => {});
  const [mapContextMenuHandler, setMapContextMenuHandler] = useState<(event: MapLayerMouseEvent) => void>(() => () => {});
  const [routeStart, setRouteStart] = useState<LatLng | null>(null);
  const [routeWaypoints, setRouteWaypoints] = useState<LatLng[]>([]);
  const [routeEnd, setRouteEnd] = useState<LatLng | null>(null);
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [routeInfos, setRouteInfos] = useState<RouteInstanceInfo[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const lastDragEndAtRef = useRef(0);

  // Append new route to the list
  const handleRouteChange = useCallback((newRoute: RouteResult | null) => {
    if (newRoute) {
      setRoutes((prev) => [...prev, newRoute]);
      setRouteInfos((prev) => [...prev, { pedestrianTimeSec: 0, vehicleTimeSec: 0, computing: true }]);
    }
  }, []);

  // Callback for RouteInstance to report its meeting info
  const handleRouteInfoChange = useCallback((index: number, info: RouteInstanceInfo) => {
    setRouteInfos((prev) => {
      if (prev[index]?.pedestrianTimeSec === info.pedestrianTimeSec &&
          prev[index]?.vehicleTimeSec === info.vehicleTimeSec &&
          prev[index]?.computing === info.computing) {
        return prev;
      }
      const next = [...prev];
      next[index] = info;
      return next;
    });
  }, []);

  // Center on user position on first geolocation fix
  useEffect(() => {
    if (position && !hasFlown && mapRef.current) {
      mapRef.current.flyTo({ center: [position.lng, position.lat], zoom: 15 });
      setHasFlown(true);
    }
  }, [position, hasFlown]);

  const recenter = useCallback(() => {
    if (position && mapRef.current) {
      mapRef.current.flyTo({ center: [position.lng, position.lat] });
    }
  }, [position]);

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (Date.now() - lastDragEndAtRef.current < DRAG_CLICK_GUARD_MS) {
        return;
      }

      // Check if a route layer was clicked
      if (mapRef.current && routes.length > 0) {
        const layerIds = routes.flatMap((_, i) => [
          `route-${i}-line`,
          `pedestrian-route-${i}-line`,
        ]);
        const features = mapRef.current.queryRenderedFeatures(event.point, { layers: layerIds });
        if (features && features.length > 0) {
          const layerId = features[0]!.layer.id;
          const match = layerId.match(/route-(\d+)-line/);
          if (match) {
            setSelectedRouteIndex(Number(match[1]));
            return;
          }
        }
      }

      // Click on empty area: deselect and delegate to routing
      setSelectedRouteIndex(null);
      mapClickHandler(event);
    },
    [mapClickHandler, routes]
  );

  const handleContextMenu = useCallback(
    (event: MapLayerMouseEvent) => {
      if (Date.now() - lastDragEndAtRef.current < DRAG_CLICK_GUARD_MS) {
        return;
      }
      mapContextMenuHandler(event);
    },
    [mapContextMenuHandler]
  );

  const handleMapDragEnd = useCallback(() => {
    lastDragEndAtRef.current = Date.now();
  }, []);

  return (
    <div className="relative h-dvh w-full">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 2.35, latitude: 46.85, zoom: 6 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={IGN_STYLE}
        onZoom={(e) => setZoom(e.viewState.zoom)}
        onClick={handleMapClick}
        onContextMenu={handleContextMenu}
        onDragEnd={handleMapDragEnd}
        minZoom={6}
        maxZoom={18.99}
      >
        <CurrentLocation position={position} />
        <RouteFlags start={routeStart} end={routeEnd} waypoints={routeWaypoints} routeComputed={false} id="current" />
        {routes.map((r, i) => (
          <RouteInstance
            key={i}
            route={r}
            routeIndex={i}
            userPosition={position}
            selected={selectedRouteIndex === i}
            onInfoChange={handleRouteInfoChange}
          />
        ))}
      </Map>
      <GPSStatus loading={loading} error={error} />
      <Routing
        onMapClickChange={setMapClickHandler}
        onContextMenuChange={setMapContextMenuHandler}
        onPointsChange={(start, end, waypoints) => {
          setRouteStart(start);
          setRouteEnd(end);
          setRouteWaypoints(waypoints);
        }}
        onRouteChange={handleRouteChange}
      />
      <InstallButton canInstall={canInstall} onInstall={install} />
      <Coordinates position={position} zoom={zoom} />
      <CenterButton position={position} onRecenter={recenter} />
      {routeInfos.length > 0 && (
        <div className="absolute right-2 top-4 z-50 flex flex-col gap-2">
          {routeInfos.map((info, i) => (
            <MeetingInfo
              key={i}
              routeLabel={`Itinéraire ${i + 1}`}
              pedestrianTimeSec={info.pedestrianTimeSec}
              vehicleTimeSec={info.vehicleTimeSec}
              computing={info.computing}
              selected={selectedRouteIndex === i}
              onClick={() => setSelectedRouteIndex(selectedRouteIndex === i ? null : i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
