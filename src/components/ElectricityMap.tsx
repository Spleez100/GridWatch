import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { powerNodes, PowerNode, cityCoords } from '@/data/nigeriaNodes';

function createNodeIcon(status: string, size: number = 14) {
  return L.divIcon({
    className: '',
    html: `<div class="node-marker status-${status}" style="width:${size}px;height:${size}px;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface ElectricityMapProps {
  searchCity: string | null;
  onClearSearch: () => void;
  onSelectNode: (node: PowerNode) => void;
  selectedNode: PowerNode | null;
}

export default function ElectricityMap({ searchCity, onClearSearch, onSelectNode, selectedNode }: ElectricityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([9.0, 7.5], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    powerNodes.forEach((node) => {
      const marker = L.marker([node.lat, node.lng], {
        icon: createNodeIcon(node.status, selectedNode?.id === node.id ? 18 : 14),
      });

      marker.on('click', () => onSelectNode(node));
      marker.addTo(map);
      markerRefs.current[node.id] = marker;
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRefs.current = {};
    };
  }, [onSelectNode]);

  useEffect(() => {
    if (searchCity && cityCoords[searchCity] && mapRef.current) {
      mapRef.current.flyTo(cityCoords[searchCity], 12, { duration: 1.5 });
      onClearSearch();
    }
  }, [searchCity, onClearSearch]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    powerNodes.forEach((node) => {
      const marker = markerRefs.current[node.id];
      if (!marker) return;

      marker.setIcon(createNodeIcon(node.status, selectedNode?.id === node.id ? 18 : 14));
    });

    if (selectedNode) {
      map.flyTo([selectedNode.lat, selectedNode.lng], Math.max(map.getZoom(), 11), { duration: 1 });
    }
  }, [selectedNode]);

  return <div ref={mapContainerRef} className="w-full h-full" aria-label="Electricity map" />;
}

