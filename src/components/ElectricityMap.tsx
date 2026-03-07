import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { powerNodes, PowerNode, cityCoords } from '@/data/nigeriaNodes';
import NodeDetailCard from './NodeDetailCard';

function createNodeIcon(status: string, size: number = 14) {
  return L.divIcon({
    className: '',
    html: `<div class="node-marker status-${status}" style="width:${size}px;height:${size}px;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface MapEventsProps {
  searchCity: string | null;
  onClearSearch: () => void;
}

function MapEvents({ searchCity, onClearSearch }: MapEventsProps) {
  const map = useMap();
  useEffect(() => {
    if (searchCity && cityCoords[searchCity]) {
      map.flyTo(cityCoords[searchCity], 12, { duration: 1.5 });
      onClearSearch();
    }
  }, [searchCity, map, onClearSearch]);
  return null;
}

interface ElectricityMapProps {
  searchCity: string | null;
  onClearSearch: () => void;
  onSelectNode: (node: PowerNode) => void;
  selectedNode: PowerNode | null;
}

export default function ElectricityMap({ searchCity, onClearSearch, onSelectNode, selectedNode }: ElectricityMapProps) {
  return (
    <MapContainer
      center={[9.0, 7.5]}
      zoom={6}
      className="w-full h-full"
      zoomControl={true}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapEvents searchCity={searchCity} onClearSearch={onClearSearch} />
      {powerNodes.map((node) => (
        <Marker
          key={node.id}
          position={[node.lat, node.lng]}
          icon={createNodeIcon(node.status)}
          eventHandlers={{
            click: () => onSelectNode(node),
          }}
        />
      ))}
    </MapContainer>
  );
}
