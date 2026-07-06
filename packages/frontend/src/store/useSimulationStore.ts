/**
 * Zustand store for simulation state management
 */

import { create } from 'zustand';
import {
  Task,
  Staff,
  SimulationConfig,
  GraphNode,
  GraphEdge,
  AlgorithmTrace,
} from '@workforce/shared';

interface SimulationStore {
  // State
  tick: number;
  tasks: Task[];
  staff: Staff[];
  taskQueue: string[];
  priorityQueue: Array<{ taskId: string; priority: number; heapKey?: number }>;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  algorithmTrace?: AlgorithmTrace;
  selectedDijkstraStepIndex: number;
  config: SimulationConfig;
  metrics: {
    tasksCompleted: number;
    tasksAssigned: number;
    tasksPending: number;
    averageResponseTime: number;
    staffUtilization: number;
  };
  isConnected: boolean;
  isRunning: boolean;

  // Actions
  setTick: (tick: number) => void;
  setTasks: (tasks: Task[]) => void;
  setStaff: (staff: Staff[]) => void;
  setTaskQueue: (queue: string[]) => void;
  setPriorityQueue: (queue: Array<{ taskId: string; priority: number; heapKey?: number }>) => void;
  setGraphNodes: (nodes: GraphNode[]) => void;
  setGraphEdges: (edges: GraphEdge[]) => void;
  setAlgorithmTrace: (trace?: AlgorithmTrace) => void;
  setSelectedDijkstraStepIndex: (index: number) => void;
  setConfig: (config: SimulationConfig) => void;
  setMetrics: (metrics: any) => void;
  setConnected: (connected: boolean) => void;
  setRunning: (running: boolean) => void;
  updateState: (state: any) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  // Initial state
  tick: 0,
  tasks: [],
  staff: [],
  taskQueue: [],
  priorityQueue: [],
  graphNodes: [],
  graphEdges: [],
  algorithmTrace: undefined,
  selectedDijkstraStepIndex: 0,
  config: {
    urgencyWeight: 0.7,
    distanceWeight: 0.3,
    skillStrictness: 0.3, // Lowered to allow more partial skill matches
    maxWorkloadPerStaff: 3,
    disasterSeverity: 1.0,
    tickInterval: 1000,
  },
  metrics: {
    tasksCompleted: 0,
    tasksAssigned: 0,
    tasksPending: 0,
    averageResponseTime: 0,
    staffUtilization: 0,
  },
  isConnected: false,
  isRunning: false,

  // Actions
  setTick: (tick) => set({ tick }),
  setTasks: (tasks) => set({ tasks }),
  setStaff: (staff) => set({ staff }),
  setTaskQueue: (taskQueue) => set({ taskQueue }),
  setPriorityQueue: (priorityQueue) => set({ priorityQueue }),
  setGraphNodes: (graphNodes) => set({ graphNodes }),
  setGraphEdges: (graphEdges) => set({ graphEdges }),
  setAlgorithmTrace: (algorithmTrace) => set({ algorithmTrace }),
  setSelectedDijkstraStepIndex: (selectedDijkstraStepIndex) => set({ selectedDijkstraStepIndex }),
  setConfig: (config) => set({ config }),
  setMetrics: (metrics) => set({ metrics }),
  setConnected: (isConnected) => set({ isConnected }),
  setRunning: (isRunning) => set({ isRunning }),

  updateState: (state) => {
    const update: any = {};

    if (state.tick !== undefined) {
      update.tick = state.tick;
    }

    if (state.tasks !== undefined) {
      update.tasks = state.tasks instanceof Map ? Array.from(state.tasks.values()) : Array.isArray(state.tasks) ? state.tasks : [];
      console.log('🔄 Updating tasks in store:', update.tasks.length, 'tasks');
    }

    if (state.staff !== undefined) {
      update.staff = state.staff instanceof Map ? Array.from(state.staff.values()) : Array.isArray(state.staff) ? state.staff : [];
      console.log('🔄 Updating staff in store:', update.staff.length, 'staff');
    }

    if (state.taskQueue !== undefined) {
      update.taskQueue = Array.isArray(state.taskQueue) ? state.taskQueue : [];
    }

    if (state.priorityQueue !== undefined) {
      update.priorityQueue = Array.isArray(state.priorityQueue) ? state.priorityQueue : [];
    }

    if (state.graph) {
      update.graphNodes = state.graph.nodes instanceof Map
        ? Array.from(state.graph.nodes.values())
        : Array.isArray(state.graph.nodes) ? state.graph.nodes : [];
      update.graphEdges = Array.isArray(state.graph.edges) ? state.graph.edges : [];
    }

    if (state.config) {
      update.config = state.config;
    }

    if (state.metrics) {
      update.metrics = state.metrics;
    }

    if (state.algorithmTrace) {
      const previousTick = useSimulationStore.getState().algorithmTrace?.tick;
      update.algorithmTrace = state.algorithmTrace;
      if (previousTick !== state.algorithmTrace.tick) {
        update.selectedDijkstraStepIndex = 0;
      }
    }

    set(update);
  },
}));
