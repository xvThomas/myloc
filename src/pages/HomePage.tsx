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
import RouteLayer from "../components/RouteLayer";
import VehicleMarker from "../components/VehicleMarker";
import PedestrianRouteLayer from "../components/PedestrianRouteLayer";
import MeetingInfo from "../components/MeetingInfo";
import type { LatLng } from "../types/geo";
import type { RouteResult } from "../services/routeService";
import { useVehicleSimulation } from "../hooks/useVehicleSimulation";
import { useMeetingPoint, computeRemainingPedestrianTime } from "../hooks/useMeetingPoint";

const IGN_STYLE = "https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json";
const DRAG_CLICK_GUARD_MS = 250;

export default function HomePage() {
  const mapRef = useRef<MapRef>(null);
  const { position, error, loading } = useGeolocation();
  const { canInstall, install } = useInstallPrompt();
  const [hasFlown, setHasFlown] = useState(false);
  const [zoom, setZoom] = useState(6);
  const [mapClickHandler, setMapClickHandler] = useState<(event: MapLayerMouseEvent) => void>(() => () => {});
  const [routeStart, setRouteStart] = useState<LatLng | null>(null);
  const [routeEnd, setRouteEnd] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const vehicle = useVehicleSimulation(route);
  const { result: meetingResult, computing: meetingComputing, compute: computeMeeting, clear: clearMeeting } = useMeetingPoint();
  const lastDragEndAtRef = useRef(0);

  // Clear meeting point when route changes
  useEffect(() => { clearMeeting(); }, [route, clearMeeting]);

  const handleMeetVehicle = useCallback(() => {
    if (position && vehicle) {
      computeMeeting(position, vehicle.timedPoints, vehicle.currentTimeSec);
    }
  }, [position, vehicle, computeMeeting]);

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
      mapClickHandler(event);
    },
    [mapClickHandler]
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
        onDragEnd={handleMapDragEnd}
        minZoom={6}
        maxZoom={18.99}
      >
        <CurrentLocation position={position} />
        <RouteFlags start={routeStart} end={routeEnd} />
        <RouteLayer route={route} />
        <PedestrianRouteLayer route={meetingResult?.pedestrianRoute ?? null} />
        <VehicleMarker vehicle={vehicle} />
      </Map>
      <GPSStatus loading={loading} error={error} />
      <Routing
        onMapClickChange={setMapClickHandler}
        onPointsChange={(start, end) => {
          setRouteStart(start);
          setRouteEnd(end);
        }}
        onRouteChange={setRoute}
      />
      <InstallButton canInstall={canInstall} onInstall={install} />
      <Coordinates position={position} zoom={zoom} />
      <CenterButton position={position} onRecenter={recenter} />
      {vehicle && position && !meetingResult && !meetingComputing && (
        <button
          onClick={handleMeetVehicle}
          className="absolute right-4 top-4 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-lg"
        >
          Rejoindre le véhicule
        </button>
      )}
      {(meetingResult || meetingComputing) && (
        <MeetingInfo
          pedestrianTimeSec={
            meetingResult && position
              ? computeRemainingPedestrianTime(position, meetingResult.pedestrianTimedPoints)
              : meetingResult?.pedestrianTimeSec ?? 0
          }
          vehicleTimeSec={
            meetingResult && vehicle
              ? meetingResult.meetingPointCumulativeTime >= vehicle.currentTimeSec
                ? meetingResult.meetingPointCumulativeTime - vehicle.currentTimeSec
                : meetingResult.totalDurationSec - vehicle.currentTimeSec + meetingResult.meetingPointCumulativeTime
              : 0
          }
          computing={meetingComputing}
        />
      )}
    </div>
  );
}
