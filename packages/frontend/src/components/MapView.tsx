import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { useSimulationStore } from '../store/useSimulationStore';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapUpdater() {
  const { graphNodes } = useSimulationStore();
  const map = useMap();

  useEffect(() => {
    if (graphNodes.length > 0) {
      const bounds = graphNodes.map(node => [node.location.lat, node.location.lng] as LatLngExpression);
      if (bounds.length > 0) {
        map.fitBounds(bounds as any, { padding: [50, 50] });
      }
    }
  }, [graphNodes, map]);

  return null;
}

export default function MapView() {
  const { graphNodes, graphEdges, tasks, staff } = useSimulationStore();

  const center: LatLngExpression = [12.9716, 77.5946]; // Bangalore, India default

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'base': return '#10b981'; // green
      case 'staff': return '#3b82f6'; // blue
      case 'site': return '#ef4444'; // red
      default: return '#6b7280';
    }
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur border border-dark-border rounded-lg p-3 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Map Legend</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-green" />
            <span className="text-gray-600">Base</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-blue" />
            <span className="text-gray-600">Staff</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-red" />
            <span className="text-gray-600">Task Site</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater />

        {/* Draw edges */}
        {graphEdges.map((edge, idx) => {
          const fromNode = graphNodes.find(n => n.id === edge.from);
          const toNode = graphNodes.find(n => n.id === edge.to);

          if (fromNode && toNode) {
            return (
              <Polyline
                key={idx}
                positions={[
                  [fromNode.location.lat, fromNode.location.lng],
                  [toNode.location.lat, toNode.location.lng],
                ]}
                color="#6366f1"
                weight={1.5}
                opacity={0.55}
              />
            );
          }
          return null;
        })}

        {/* Draw nodes */}
        {graphNodes.map((node) => {
          const color = getMarkerColor(node.type);

          // Create custom SVG marker
          const customIcon = new Icon({
            iconUrl: `data:image/svg+xml;base64,${btoa(`
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
              </svg>
            `)}`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          return (
            <Marker
              key={node.id}
              position={[node.location.lat, node.location.lng]}
              icon={customIcon}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{node.type.toUpperCase()}</div>
                  {node.location.label && <div className="text-gray-600">{node.location.label}</div>}
                  <div className="text-xs text-gray-500 mt-1">
                    {node.location.lat.toFixed(4)}, {node.location.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Draw assignment lines (staff to task) */}
        {tasks
          .filter(task => task.assignedStaffId && task.status === 'assigned')
          .map((task) => {
            const assignedStaff = staff.find(s => s.id === task.assignedStaffId);
            if (assignedStaff) {
              return (
                <Polyline
                  key={task.id}
                  positions={[
                    [assignedStaff.location.lat, assignedStaff.location.lng],
                    [task.location.lat, task.location.lng],
                  ]}
                  color="#6366f1"
                  weight={2}
                  opacity={0.7}
                  dashArray="5, 10"
                  className="pulse-glow"
                />
              );
            }
            return null;
          })}
      </MapContainer>
    </div>
  );
}
