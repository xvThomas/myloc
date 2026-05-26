import { useRef, useCallback, useState, useEffect } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/maplibre";
import { useGeolocation } from "../hooks/useGeolocation";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

const IGN_STYLE = "https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json";

export default function HomePage() {
  const mapRef = useRef<MapRef>(null);
  const { position, error, loading } = useGeolocation();
  const { canInstall, install } = useInstallPrompt();
  const [hasFlown, setHasFlown] = useState(false);

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
      >
        {position && (
          <Marker longitude={position.lng} latitude={position.lat} anchor="center">
            <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-lg" />
          </Marker>
        )}
      </Map>

      {/* GPS status overlay */}
      {loading && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-sm shadow">
          Localisation en cours…
        </div>
      )}
      {error && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-red-100 px-4 py-2 text-sm text-red-700 shadow">
          {error}
        </div>
      )}

      {/* Install button */}
      {canInstall && (
        <button
          onClick={install}
          className="absolute left-4 top-4 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg active:bg-blue-700"
        >
          Installer l'app
        </button>
      )}

      {/* Recenter button */}
      {position && (
        <button
          onClick={recenter}
          className="absolute bottom-6 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg active:bg-gray-100"
          aria-label="Recentrer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-blue-600">
            <path
              fillRule="evenodd"
              d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
