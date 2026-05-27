import { Source, Layer } from "react-map-gl/maplibre";
import type { RouteResult } from "../services/routeService";

interface RouteLayerProps {
  route: RouteResult | null;
}

export default function RouteLayer({ route }: RouteLayerProps) {
  if (!route) return null;

  const geojson: GeoJSON.Feature = {
    type: "Feature",
    properties: {},
    geometry: route.geometry,
  };

  return (
    <Source id="route" type="geojson" data={geojson}>
      <Layer
        id="route-line"
        type="line"
        paint={{
          "line-color": "#dc2626",
          "line-width": 5,
          "line-opacity": 0.8,
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round",
        }}
      />
    </Source>
  );
}
