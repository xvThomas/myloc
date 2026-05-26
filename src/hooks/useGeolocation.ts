import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ position: null, error: "Géolocalisation non supportée par ce navigateur.", loading: false });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
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
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
