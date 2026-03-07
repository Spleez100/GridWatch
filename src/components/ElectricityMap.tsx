import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { powerNodes, PowerNode, cityCoords } from '@/data/nigeriaNodes';

function createNodeIcon(status: string, isSelected: boolean = false) {
  const size = isSelected ? 30 : 26;
  const statusClass = `status-${status}`;
  const icon = status === 'green' ? '✓' : status === 'red' ? '!' : status === 'yellow' ? '⚡' : '⊘';

  return L.divIcon({
    className: '',
    html: `<div class="node-icon-marker${isSelected ? ' selected' : ''}" style="width:${size}px;height:${size}px;">
      <div class="marker-icon ${statusClass}">${icon}</div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface ElectricityMapProps {
  searchCity: string | null;
  onClearSearch: () => void;
  onSelectNode: (node: PowerNode, pixel?: { x: number; y: number }) => void;
  selectedNode: PowerNode | null;
}

export default function ElectricityMap({ searchCity, onClearSearch, onSelectNode, selectedNode }: ElectricityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([9.0, 7.5], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    powerNodes.forEach((node) => {
      const marker = L.marker([node.lat, node.lng], {
        icon: createNodeIcon(node.status),
      });

      marker.on('click', () => {
        const px = map.latLngToContainerPoint([node.lat, node.lng]);
        onSelectNodeRef.current(node, { x: px.x, y: px.y });
      });

      marker.addTo(map);
      markersRef.current[node.id] = marker;
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

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
      const marker = markersRef.current[node.id];
      if (!marker) return;
      marker.setIcon(createNodeIcon(node.status, selectedNode?.id === node.id));
    });

    if (selectedNode) {
      map.flyTo([selectedNode.lat, selectedNode.lng], Math.max(map.getZoom(), 11), { duration: 0.8 });
    }
  }, [selectedNode]);

  return <div ref={containerRef} className="absolute inset-0" aria-label="Electricity map" />;
}
