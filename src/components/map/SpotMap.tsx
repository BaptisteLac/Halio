'use client';

import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Spot } from '@/types';
import type { SpotScoreMap } from '@/types';
import SpotMarker from './SpotMarker';

const INITIAL_VIEW = {
  longitude: -1.175,
  latitude: 44.615,
  zoom: 11,
};

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

interface Props {
  spots: Spot[];
  scoreMap: SpotScoreMap;
  selectedSpotId: string | null;
  onSelect: (spot: Spot | null) => void;
}

export default function SpotMap({ spots, scoreMap, selectedSpotId, onSelect }: Props) {
  return (
    <Map
      initialViewState={INITIAL_VIEW}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
      onClick={() => onSelect(null)}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {spots.map((spot) => {
        const entry = scoreMap.get(spot.id);
        const score = entry?.best.total;
        const isSelected = spot.id === selectedSpotId;

        return (
          <Marker
            key={spot.id}
            longitude={spot.longitude}
            latitude={spot.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              navigator.vibrate?.(8);
              onSelect(isSelected ? null : spot);
            }}
          >
            <SpotMarker spot={spot} score={score} isSelected={isSelected} />
          </Marker>
        );
      })}
    </Map>
  );
}
