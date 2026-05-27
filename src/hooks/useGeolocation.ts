import { useState, useEffect, useRef, useCallback } from "react";
import type { LatLng } from "../types/geo";

interface GeolocationState {
  position: LatLng | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
  });
  const watchIdRef = useRef<number | null>(null);

  const startWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
        });
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Géolocalisation refusée. Autorisez l'accès à la position dans les paramètres du navigateur."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Position indisponible."
              : "Délai d'attente dépassé pour obtenir la position.";
        setState((prev) => ({ ...prev, error: message, loading: false }));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ position: null, error: "Géolocalisation non supportée par ce navigateur.", loading: false });
      return;
    }

    startWatching();

    // Restart watcher when app returns to foreground (fixes iOS PWA standby issue)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startWatching();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatching]);

  return state;
}
