import { Source, Layer } from "react-map-gl/maplibre";
import type { RouteResult } from "../services/routeService";

interface PedestrianRouteLayerProps {
  route: RouteResult | null;
}

export default function PedestrianRouteLayer({ route }: PedestrianRouteLayerProps) {
  if (!route) return null;

  const geojson: GeoJSON.Feature = {
    type: "Feature",
    properties: {},
    geometry: route.geometry,
  };

  return (
    <Source id="pedestrian-route" type="geojson" data={geojson}>
      <Layer
        id="pedestrian-route-line"
        type="line"
        paint={{
          "line-color": "#2563eb",
          "line-width": 4,
          "line-opacity": 0.8,
          "line-dasharray": [2, 1],
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round",
        }}
      />
    </Source>
  );
}
