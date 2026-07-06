import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { AlgorithmTrace, DijkstraTrace } from '@workforce/shared';
import { useSimulationStore } from '../store/useSimulationStore';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

Icon.Default.mergeOptions({
  iconUrl: icon,
  shadowUrl: iconShadow,
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

const getDijkstraTrace = (trace?: AlgorithmTrace): DijkstraTrace | undefined => {
  const latestDecision = trace?.assignmentDecisions[trace.assignmentDecisions.length - 1];
  const selectedEvaluation = latestDecision?.evaluations.find(
    evaluation => evaluation.staffId === latestDecision.selectedStaffId
  );
  return selectedEvaluation?.pathTrace || trace?.latestDijkstraTrace;
};

export default function MapView() {
  const {
    graphNodes,
    graphEdges,
    tasks,
    staff,
    algorithmTrace,
    selectedDijkstraStepIndex,
  } = useSimulationStore();

  const center: LatLngExpression = [12.9716, 77.5946]; // Bangalore, India default
  const latestPath = algorithmTrace?.latestShortestPath?.path ?? [];
  const dijkstraTrace = getDijkstraTrace(algorithmTrace);
  const selectedStep = dijkstraTrace?.steps[
    Math.min(selectedDijkstraStepIndex, Math.max((dijkstraTrace?.steps.length ?? 1) - 1, 0))
  ];
  const currentNodeId = selectedStep?.currentNodeId;
  const visitedNodeIds = new Set(selectedStep?.visitedNodeIds ?? []);
  const frontierNodeIds = new Set(selectedStep?.frontier.map(item => item.nodeId) ?? []);
  const updatedNodeIds = new Set(
    selectedStep?.candidateUpdates
      .filter(update => update.updated)
      .map(update => update.neighborId) ?? []
  );
  const exploredNeighborIds = new Set(selectedStep?.candidateUpdates.map(update => update.neighborId) ?? []);

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'base': return '#10b981'; // green
      case 'staff': return '#3b82f6'; // blue
      case 'site': return '#ef4444'; // red
      default: return '#6b7280';
    }
  };

  const isPathEdge = (from: string, to: string) => {
    return latestPath.some((nodeId, index) => {
      const nextNodeId = latestPath[index + 1];
      return nextNodeId && (
        (nodeId === from && nextNodeId === to) ||
        (nodeId === to && nextNodeId === from)
      );
    });
  };

  const isStepEdge = (from: string, to: string) => {
    if (!currentNodeId) return false;
    return (
      (from === currentNodeId && exploredNeighborIds.has(to)) ||
      (to === currentNodeId && exploredNeighborIds.has(from))
    );
  };

  const isUpdatedStepEdge = (from: string, to: string) => {
    if (!currentNodeId) return false;
    return (
      (from === currentNodeId && updatedNodeIds.has(to)) ||
      (to === currentNodeId && updatedNodeIds.has(from))
    );
  };

  const getNodeVisual = (nodeId: string, type: string) => {
    if (nodeId === currentNodeId) {
      return { fill: '#8b5cf6', stroke: '#4c1d95', radius: 10, ring: '#ddd6fe' };
    }
    if (updatedNodeIds.has(nodeId)) {
      return { fill: '#f59e0b', stroke: '#92400e', radius: 9, ring: '#fde68a' };
    }
    if (frontierNodeIds.has(nodeId)) {
      return { fill: '#3b82f6', stroke: '#1d4ed8', radius: 9, ring: '#bfdbfe' };
    }
    if (visitedNodeIds.has(nodeId)) {
      return { fill: '#10b981', stroke: '#047857', radius: 8, ring: '#bbf7d0' };
    }
    return { fill: getMarkerColor(type), stroke: '#ffffff', radius: 8, ring: 'transparent' };
  };

  const latestPathPositions = latestPath
    .map(nodeId => graphNodes.find(node => node.id === nodeId))
    .filter(Boolean)
    .map(node => [node!.location.lat, node!.location.lng] as LatLngExpression);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur border border-dark-border rounded-lg p-3 shadow-sm max-w-64">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Map Legend</h3>
        <div className="space-y-1.5 text-xs">
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
          <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
            <div className="w-8 border-t-2 border-gray-400" />
            <span className="text-gray-600">Graph connection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 border-t-[3px] border-amber-500" />
            <span className="text-gray-600">Current shortest route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 border-t-[3px] border-violet-500 border-dashed" />
            <span className="text-gray-600">Explored edge this step</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 border-t-2 border-accent-purple"
              style={{ borderTopStyle: 'dotted' }}
            />
            <span className="text-gray-600">Assigned staff to task</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 border-t border-gray-200">
            <span className="flex items-center gap-1 text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Current</span>
            <span className="flex items-center gap-1 text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-accent-green" /> Visited</span>
            <span className="flex items-center gap-1 text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-accent-blue" /> Frontier</span>
            <span className="flex items-center gap-1 text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Updated</span>
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

        {/* Draw graph edges */}
        {graphEdges.map((edge, idx) => {
          const fromNode = graphNodes.find(n => n.id === edge.from);
          const toNode = graphNodes.find(n => n.id === edge.to);
          const highlighted = isPathEdge(edge.from, edge.to);
          const explored = isStepEdge(edge.from, edge.to);
          const updated = isUpdatedStepEdge(edge.from, edge.to);

          if (fromNode && toNode) {
            return (
              <Polyline
                key={idx}
                positions={[
                  [fromNode.location.lat, fromNode.location.lng],
                  [toNode.location.lat, toNode.location.lng],
                ]}
                color={updated ? '#10b981' : explored ? '#8b5cf6' : highlighted ? '#f59e0b' : '#64748b'}
                weight={updated || explored ? 4 : highlighted ? 4 : 1.25}
                opacity={updated || explored || highlighted ? 0.9 : 0.35}
                dashArray={explored ? '8, 8' : undefined}
                className={explored ? 'algorithm-edge-flow' : undefined}
              />
            );
          }
          return null;
        })}

        {latestPathPositions.length > 1 && (
          <Polyline
            positions={latestPathPositions}
            color="#f59e0b"
            weight={4}
            opacity={0.95}
          />
        )}

        {/* Draw nodes */}
        {graphNodes.map((node) => {
          const visual = getNodeVisual(node.id, node.type);
          const frontierDistance = selectedStep?.frontier.find(item => item.nodeId === node.id)?.distance;
          const update = selectedStep?.candidateUpdates.find(item => item.neighborId === node.id);

          // Create custom SVG marker
          const customIcon = new Icon({
            iconUrl: `data:image/svg+xml;base64,${btoa(`
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="${visual.ring}" opacity="0.85"/>
                <circle cx="12" cy="12" r="${visual.radius}" fill="${visual.fill}" stroke="${visual.stroke}" stroke-width="2"/>
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
                  {node.id === currentNodeId && (
                    <div className="text-xs text-purple-700 mt-1">Current Dijkstra node</div>
                  )}
                  {frontierDistance !== undefined && (
                    <div className="text-xs text-blue-700 mt-1">
                      Frontier distance: {frontierDistance.toFixed(2)} km
                    </div>
                  )}
                  {update && (
                    <div className="text-xs text-amber-700 mt-1">
                      Candidate: {update.candidateDistance.toFixed(2)} km
                      {update.updated ? ' updated' : ' not improved'}
                    </div>
                  )}
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
                  weight={2.5}
                  opacity={0.75}
                  dashArray="2, 8"
                />
              );
            }
            return null;
          })}
      </MapContainer>
    </div>
  );
}
