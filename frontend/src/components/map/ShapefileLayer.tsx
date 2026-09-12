import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface ShapefileLayerProps {
  data: GeoJSON.FeatureCollection | null;
  color: string;
  weight?: number;
  dashArray?: string;
  fillOpacity?: number;
  highlightName?: string | null;
  /** Optional property key to use for highlight comparison */
  highlightKey?: string;
}

export function ShapefileLayer({
  data,
  color,
  weight = 1,
  dashArray,
  fillOpacity = 0.1,
  highlightName,
  highlightKey = 'panchayat',
}: ShapefileLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!data || !data.features?.length) return;

    const layer = L.geoJSON(data as any, {
      // For polygons
      style: (feature) => {
        const props = feature?.properties || {};
        const isHighlighted =
          highlightName &&
          (props[highlightKey] === highlightName ||
            props.name === highlightName ||
            props.block_name === highlightName);

        return {
          color: isHighlighted ? '#dc2626' : color,
          weight: isHighlighted ? 3 : weight,
          dashArray: dashArray,
          fillColor: isHighlighted ? '#fca5a5' : color,
          fillOpacity: isHighlighted ? 0.35 : fillOpacity,
        };
      },
      // For point features
      pointToLayer: (_feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 4,
          color: color,
          weight: 1,
          fillColor: color,
          fillOpacity: 0.6,
        });
      },
      // Apply highlight styling to points too
      onEachFeature: (feature, featureLayer) => {
        if (featureLayer instanceof L.CircleMarker) {
          const props: any = feature.properties || {};
          const isHighlighted =
            highlightName &&
            (props[highlightKey] === highlightName ||
              props.name === highlightName ||
              props.panchayat === highlightName);

          if (isHighlighted) {
            featureLayer.setStyle({
              radius: 8,
              color: '#dc2626',
              weight: 2,
              fillColor: '#ef4444',
              fillOpacity: 0.9,
            });
            featureLayer.bringToFront();
          }
        }
      },
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, data, color, weight, dashArray, fillOpacity, highlightName, highlightKey]);

  return null;
}