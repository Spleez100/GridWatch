import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DbNode, statusToColor } from '@/hooks/useGridData';

function createNodeIcon(status: string, severity: string = 'LOW', isSelected: boolean = false) {
  const color = statusToColor(status);
  const isCritical = status === 'OUTAGE' && (severity === 'CRITICAL' || severity === 'HIGH');
  const size = isSelected ? 30 : 26;
  const statusClass = `status-${color}${isCritical ? ' status-critical' : ''}`;
  const icon = color === 'green' ? '✓' : color === 'red' ? '!' : '⚡';

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
  nodes: DbNode[];
  flyTo: { lat: number; lng: number; zoom: number } | null;
  onClearFlyTo: () => void;
  onSelectNode: (node: DbNode, pixel?: { x: number; y: number }) => void;
  selectedNode: DbNode | null;
}

export default function ElectricityMap({ nodes, flyTo, onClearFlyTo, onSelectNode, selectedNode }: ElectricityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const nodesRef = useRef<DbNode[]>([]);

  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;

  // Initialize map once
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

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // Sync markers with nodes from database
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    nodesRef.current = nodes;

    // Add new markers, update existing
    const currentIds = new Set<string>();
    nodes.forEach((node) => {
      currentIds.add(node.id);
      const existing = markersRef.current[node.id];

      if (existing) {
        // Update icon if status changed
        existing.setIcon(createNodeIcon(node.status, selectedNode?.id === node.id));
      } else {
        // Create new marker
        const marker = L.marker([node.latitude, node.longitude], {
          icon: createNodeIcon(node.status, selectedNode?.id === node.id),
        });

        marker.on('click', () => {
          const currentNode = nodesRef.current.find(n => n.id === node.id) || node;
          const px = map.latLngToContainerPoint([currentNode.latitude, currentNode.longitude]);
          onSelectNodeRef.current(currentNode, { x: px.x, y: px.y });
        });

        marker.addTo(map);
        markersRef.current[node.id] = marker;
      }
    });

    // Remove markers no longer in data
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [nodes, selectedNode]);

  // Handle flyTo
  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom, { duration: 1.5 });
      onClearFlyTo();
    }
  }, [flyTo, onClearFlyTo]);

  // Fly to selected node
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedNode) return;
    map.flyTo([selectedNode.latitude, selectedNode.longitude], Math.max(map.getZoom(), 11), { duration: 0.8 });
  }, [selectedNode]);

  return <div ref={containerRef} className="absolute inset-0" aria-label="Electricity map" />;
}
