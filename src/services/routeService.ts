import type { LatLng } from "../types/geo";

export interface RouteStep {
  geometry: GeoJSON.LineString;
  distance: number;
  duration: number;
  instruction: { type: string; modifier?: string };
  attributes?: { name?: { nom_1_gauche?: string; nom_1_droite?: string } };
}

export interface RouteResult {
  geometry: GeoJSON.LineString;
  distance: number;
  duration: number;
  steps: RouteStep[];
}

const BASE_URL = "https://data.geopf.fr/navigation/itineraire";

export async function computeRoute(start: LatLng, end: LatLng): Promise<RouteResult> {
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

  const response = await fetch(`${BASE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Erreur API itinéraire (${response.status})`);
  }

  const data = await response.json();

  const steps: RouteStep[] = data.portions.flatMap(
    (portion: { steps: RouteStep[] }) => portion.steps
  );

  return {
    geometry: data.geometry,
    distance: data.distance,
    duration: data.duration,
    steps,
  };
}
