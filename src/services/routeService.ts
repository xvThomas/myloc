import type { LatLng } from "../types/geo";

export interface RouteStep {
  geometry: GeoJSON.LineString;
  distance: number;
  duration: number;
  instruction: { type: string; modifier?: string };
  attributes?: { name?: { nom_1_gauche?: string; nom_1_droite?: string } };
}

export interface RoutePortion {
  start: LatLng;
  end: LatLng;
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteResult {
  geometry: GeoJSON.LineString;
  distance: number;
  duration: number;
  steps: RouteStep[];
  portions: RoutePortion[];
  start: LatLng;
  end: LatLng;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

const BASE_URL = "https://data.geopf.fr/navigation/itineraire";

export async function computeRoute(start: LatLng, end: LatLng, intermediates: LatLng[] = []): Promise<RouteResult> {
  const params = new URLSearchParams({
    resource: "bdtopo-osrm",
    start: `${start.lng},${start.lat}`,
    end: `${end.lng},${end.lat}`,
    profile: "car",
    optimization: "fastest",
    getSteps: "true",
    geometryFormat: "geojson",
    distanceUnit: "meter",
    timeUnit: "second",
  });

  if (intermediates.length > 0) {
    params.set("intermediates", intermediates.map((p) => `${p.lng},${p.lat}`).join("|"));
  }

  const response = await fetch(`${BASE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Erreur API itinéraire (${response.status})`);
  }

  const data = await response.json();

  const portions: RoutePortion[] = data.portions.map(
    (portion: { start: string; end: string; distance: number; duration: number; steps: RouteStep[] }) => {
      const [pSLng, pSLat] = portion.start.split(",").map(Number);
      const [pELng, pELat] = portion.end.split(",").map(Number);
      return {
        start: { lat: pSLat, lng: pSLng },
        end: { lat: pELat, lng: pELng },
        distance: portion.distance,
        duration: portion.duration,
        steps: portion.steps,
      };
    }
  );

  const steps: RouteStep[] = portions.flatMap((p) => p.steps);

  const [sLng, sLat] = data.start.split(",").map(Number);
  const [eLng, eLat] = data.end.split(",").map(Number);

  return {
    geometry: data.geometry,
    distance: data.distance,
    duration: data.duration,
    steps,
    portions,
    start: { lat: sLat, lng: sLng },
    end: { lat: eLat, lng: eLng },
    bbox: data.bbox,
  };
}

export async function computePedestrianRoute(start: LatLng, end: LatLng): Promise<RouteResult> {
  const params = new URLSearchParams({
    resource: "bdtopo-osrm",
    start: `${start.lng},${start.lat}`,
    end: `${end.lng},${end.lat}`,
    profile: "pedestrian",
    optimization: "fastest",
    getSteps: "true",
    geometryFormat: "geojson",
    distanceUnit: "meter",
    timeUnit: "second",
  });

  const response = await fetch(`${BASE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Erreur API itinéraire piéton (${response.status})`);
  }

  const data = await response.json();

  const portions: RoutePortion[] = data.portions.map(
    (portion: { start: string; end: string; distance: number; duration: number; steps: RouteStep[] }) => {
      const [pSLng, pSLat] = portion.start.split(",").map(Number);
      const [pELng, pELat] = portion.end.split(",").map(Number);
      return {
        start: { lat: pSLat, lng: pSLng },
        end: { lat: pELat, lng: pELng },
        distance: portion.distance,
        duration: portion.duration,
        steps: portion.steps,
      };
    }
  );

  const steps: RouteStep[] = portions.flatMap((p) => p.steps);

  const [sLng, sLat] = data.start.split(",").map(Number);
  const [eLng, eLat] = data.end.split(",").map(Number);

  return {
    geometry: data.geometry,
    distance: data.distance,
    duration: data.duration,
    steps,
    portions,
    start: { lat: sLat, lng: sLng },
    end: { lat: eLat, lng: eLng },
    bbox: data.bbox,
  };
}
