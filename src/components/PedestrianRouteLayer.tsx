import { Source, Layer } from "react-map-gl/maplibre";
import type { RouteResult } from "../services/routeService";

interface PedestrianRouteLayerProps {
  route: RouteResult | null;
  id?: string;
  selected?: boolean;
}

export default function PedestrianRouteLayer({ route, id = "pedestrian-route", selected = false }: PedestrianRouteLayerProps) {
  if (!route) return null;

  const geojson: GeoJSON.Feature = {
    type: "Feature",
    properties: {},
    geometry: route.geometry,
  };

  return (
    <Source id={id} type="geojson" data={geojson}>
      <Layer
        id={`${id}-line`}
        type="line"
        paint={{
          "line-color": "#2563eb",
          "line-width": selected ? 7 : 4,
          "line-opacity": selected ? 1 : 0.8,
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
