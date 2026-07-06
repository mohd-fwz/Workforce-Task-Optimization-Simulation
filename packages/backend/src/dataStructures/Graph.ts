/**
 * Graph implementation for location management and pathfinding
 */

import {
  GraphNode,
  GraphEdge,
  Location,
  DijkstraTrace,
  DijkstraCandidateUpdate,
} from '@workforce/shared';

export class Graph {
  nodes: Map<string, GraphNode>;
  adjacencyList: Map<string, Map<string, number>>; // nodeId -> (neighborId -> distance)

  constructor() {
    this.nodes = new Map();
    this.adjacencyList = new Map();
  }

  /**
   * Add a node to the graph
   */
  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Map());
    }
  }

  /**
   * Add an edge between two nodes
   */
  addEdge(from: string, to: string, distance: number): void {
    if (!this.adjacencyList.has(from)) {
      this.adjacencyList.set(from, new Map());
    }
    if (!this.adjacencyList.has(to)) {
      this.adjacencyList.set(to, new Map());
    }

    // Undirected graph
    this.adjacencyList.get(from)!.set(to, distance);
    this.adjacencyList.get(to)!.set(from, distance);
  }

  /**
   * Calculate distance between two locations using Haversine formula
   */
  static calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLng = this.toRad(loc2.lng - loc1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.lat)) *
        Math.cos(this.toRad(loc2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  /**
   * Find shortest path using Dijkstra's algorithm
   */
  dijkstra(startId: string, endId: string): {
    path: string[];
    distance: number;
  } | null {
    const trace = this.dijkstraWithTrace(startId, endId);
    if (!trace.found || trace.distance === null) {
      return null;
    }

    return {
      path: trace.finalPath,
      distance: trace.distance,
    };
  }

  /**
   * Find shortest path and record each Dijkstra decision for visualization.
   */
  dijkstraWithTrace(startId: string, endId: string): DijkstraTrace {
    const emptyTrace: DijkstraTrace = {
      startNodeId: startId,
      endNodeId: endId,
      found: false,
      distance: null,
      finalPath: [],
      steps: [],
    };

    if (!this.nodes.has(startId) || !this.nodes.has(endId)) {
      return emptyTrace;
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();
    const visited = new Set<string>();
    const steps: DijkstraTrace['steps'] = [];

    // Initialize
    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }
    distances.set(startId, 0);

    while (unvisited.size > 0) {
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId)!;
        if (dist < minDistance) {
          minDistance = dist;
          currentId = nodeId;
        }
      }

      if (currentId === null || minDistance === Infinity) break;

      unvisited.delete(currentId);
      visited.add(currentId);

      const candidateUpdates: DijkstraCandidateUpdate[] = [];
      const neighbors = this.adjacencyList.get(currentId);

      if (currentId !== endId && neighbors) {
        for (const [neighborId, edgeDistance] of neighbors) {
          if (unvisited.has(neighborId)) {
            const previousDistance = distances.get(neighborId)!;
            const alt = distances.get(currentId)! + edgeDistance;
            const updated = alt < previousDistance;

            if (updated) {
              distances.set(neighborId, alt);
              previous.set(neighborId, currentId);
            }

            candidateUpdates.push({
              neighborId,
              edgeDistance,
              previousDistance: previousDistance === Infinity ? null : previousDistance,
              candidateDistance: alt,
              updated,
              reason: updated
                ? `${currentId} offers a shorter route to ${neighborId}`
                : `${neighborId} already has an equal or shorter known route`,
            });
          }
        }
      }

      const frontier = Array.from(unvisited)
        .map(nodeId => ({
          nodeId,
          distance: distances.get(nodeId)!,
          previousNodeId: previous.get(nodeId) ?? null,
        }))
        .filter(item => item.distance < Infinity)
        .sort((a, b) => a.distance - b.distance);

      steps.push({
        step: steps.length + 1,
        currentNodeId: currentId,
        currentDistance: minDistance,
        selectedReason: frontier.length > 0
          ? `${currentId} has the smallest tentative distance among unvisited nodes`
          : `${currentId} is the only reachable unvisited node`,
        visitedNodeIds: Array.from(visited),
        candidateUpdates,
        frontier,
      });

      if (currentId === endId) break;
    }

    const path: string[] = [];
    let current: string | null = endId;

    while (current !== null) {
      path.unshift(current);
      current = previous.get(current)!;
    }

    if (path[0] !== startId) {
      return {
        ...emptyTrace,
        steps,
      };
    }

    return {
      startNodeId: startId,
      endNodeId: endId,
      found: true,
      distance: distances.get(endId)!,
      finalPath: path,
      steps,
    };
  }

  /**
   * Get edges as array (for serialization)
   */
  getEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    const seen = new Set<string>();

    for (const [from, neighbors] of this.adjacencyList) {
      for (const [to, distance] of neighbors) {
        const edgeKey = [from, to].sort().join('-');
        if (!seen.has(edgeKey)) {
          seen.add(edgeKey);
          edges.push({
            from,
            to,
            distance,
            travelTime: (distance / 40) * 60, // Assume 40 km/h avg speed
          });
        }
      }
    }

    return edges;
  }

  /**
   * Find nearest node to a location
   */
  findNearestNode(location: Location): string | null {
    let nearestId: string | null = null;
    let minDistance = Infinity;

    for (const [id, node] of this.nodes) {
      const dist = Graph.calculateDistance(location, node.location);
      if (dist < minDistance) {
        minDistance = dist;
        nearestId = id;
      }
    }

    return nearestId;
  }

  /**
   * Get direct distance between two nodes
   */
  getDistance(fromId: string, toId: string): number | null {
    const neighbors = this.adjacencyList.get(fromId);
    if (!neighbors) return null;
    return neighbors.get(toId) || null;
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.nodes.clear();
    this.adjacencyList.clear();
  }
}
