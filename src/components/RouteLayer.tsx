import { Source, Layer } from "react-map-gl/maplibre";
import type { RouteResult } from "../services/routeService";

interface RouteLayerProps {
  route: RouteResult | null;
  id?: string;
  selected?: boolean;
}

export default function RouteLayer({ route, id = "route", selected = false }: RouteLayerProps) {
  if (!route) return null;

  const geojson: GeoJSON.Feature = {
    type: "Feature",
    properties: {},
    geometry: route.geometry,
  };

  return (
    <Source id={id} type="geojson" data={geojson}>
      {selected && (
        <Layer
          id={`${id}-line-highlight`}
          type="line"
          paint={{
            "line-color": "#dc2626",
            "line-width": 10,
            "line-opacity": 0.5,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
          }}
        />
      )}
      <Layer
        id={`${id}-line`}
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
