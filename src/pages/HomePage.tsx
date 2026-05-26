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

const IGN_STYLE = "https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json";

export default function HomePage() {
  const mapRef = useRef<MapRef>(null);
  const { position, error, loading } = useGeolocation();
  const { canInstall, install } = useInstallPrompt();
  const [hasFlown, setHasFlown] = useState(false);
  const [zoom, setZoom] = useState(6);
  const [mapClickHandler, setMapClickHandler] = useState<(event: MapLayerMouseEvent) => void>(() => () => {});

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

  return (
    <div className="relative h-dvh w-full">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 2.35, latitude: 46.85, zoom: 6 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={IGN_STYLE}
        onZoom={(e) => setZoom(e.viewState.zoom)}
        onClick={mapClickHandler}
        minZoom={6}
        maxZoom={18.99}
      >
        <CurrentLocation position={position} />
      </Map>
      <GPSStatus loading={loading} error={error} />
      <Routing onMapClickChange={setMapClickHandler} />
      <InstallButton canInstall={canInstall} onInstall={install} />
      <Coordinates position={position} zoom={zoom} />
      <CenterButton position={position} onRecenter={recenter} />
    </div>
  );
}
