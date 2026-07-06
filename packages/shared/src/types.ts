// Core type definitions shared between frontend and backend

export type SkillType =
  | 'medical'
  | 'logistics'
  | 'survey'
  | 'rescue'
  | 'engineering'
  | 'communication';

export type TaskType =
  | 'Survey'
  | 'Distribution'
  | 'Medical'
  | 'Rescue'
  | 'Infrastructure';

export type StaffStatus = 'idle' | 'busy' | 'rest' | 'unavailable';

export interface Location {
  lat: number;
  lng: number;
  label?: string;
}

export interface Task {
  id: string;
  type: TaskType;
  requiredSkills: SkillType[];
  urgency: number; // 1–10
  location: Location;
  timeWindow?: {
    start: number;
    end: number;
  };
  estimatedDuration: number; // minutes
  assignedStaffId?: string;
  status: 'pending' | 'queued' | 'assigned' | 'in-progress' | 'completed';
  createdAt: number;
  priority?: number;
}

export interface Staff {
  id: string;
  name: string;
  skills: SkillType[];
  location: Location;
  status: StaffStatus;
  availability: boolean;
  capacity: number;
  currentTasks: string[];
  assignedTasksHistory: string[];
}

export interface GraphNode {
  id: string;
  location: Location;
  type: 'site' | 'staff' | 'base';
}

export interface GraphEdge {
  from: string;
  to: string;
  distance: number;
  travelTime: number;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
}

export interface SimulationConfig {
  urgencyWeight: number;
  distanceWeight: number;
  skillStrictness: number;
  maxWorkloadPerStaff: number;
  disasterSeverity: number;
  tickInterval: number;
}

export interface SimulationMetrics {
  tasksCompleted: number;
  tasksAssigned: number;
  tasksPending: number;
  averageResponseTime: number;
}

export interface PriorityCalculationTrace {
  taskId: string;
  taskType: TaskType;
  urgencyNormalized: number;
  urgencyWeight: number;
  timeFactor: number;
  unmetNeed: number;
  disasterSeverity: number;
  priorityScore: number;
  heapKey: number;
  explanation: string;
}

export interface DijkstraCandidateUpdate {
  neighborId: string;
  edgeDistance: number;
  previousDistance: number | null;
  candidateDistance: number;
  updated: boolean;
  reason: string;
}

export interface DijkstraStepTrace {
  step: number;
  currentNodeId: string;
  currentDistance: number;
  selectedReason: string;
  visitedNodeIds: string[];
  candidateUpdates: DijkstraCandidateUpdate[];
  frontier: Array<{
    nodeId: string;
    distance: number;
    previousNodeId: string | null;
  }>;
}

export interface DijkstraTrace {
  startNodeId: string;
  endNodeId: string;
  found: boolean;
  distance: number | null;
  finalPath: string[];
  steps: DijkstraStepTrace[];
}

export interface StaffEvaluationTrace {
  staffId: string;
  staffName: string;
  eligible: boolean;
  rejectionReason?: string;
  skillMatch: number;
  matchedSkills: SkillType[];
  missingSkills: SkillType[];
  distance: number | null;
  distanceScore: number;
  combinedScore: number;
  pathTrace?: DijkstraTrace;
  explanation: string;
}

export interface AssignmentDecisionTrace {
  tick: number;
  taskId: string;
  taskType: TaskType;
  priorityScore: number;
  heapKey: number;
  selectedStaffId?: string;
  selectedStaffName?: string;
  selectedReason?: string;
  evaluations: StaffEvaluationTrace[];
}

export interface QueuePromotionTrace {
  taskId: string;
  taskType: TaskType;
  priority: PriorityCalculationTrace;
}

export interface AlgorithmTrace {
  tick: number;
  queuePromotions: QueuePromotionTrace[];
  priorityCalculations: PriorityCalculationTrace[];
  assignmentDecisions: AssignmentDecisionTrace[];
  latestDijkstraTrace?: DijkstraTrace;
  latestShortestPath?: {
    taskId: string;
    staffId: string;
    path: string[];
    distance: number;
  };
}

export interface SimulationState {
  tick: number;
  tasks: Map<string, Task>;
  staff: Map<string, Staff>;
  taskQueue: string[];
  priorityQueue: Array<{ taskId: string; priority: number; heapKey?: number }>;
  graph: Graph;
  config: SimulationConfig;
  metrics: SimulationMetrics & {
    staffUtilization: number;
  };
  algorithmTrace?: AlgorithmTrace;
}

// ✅ Serializable (socket-safe) version
export interface SerializableSimulationState {
  tasks: Task[];
  staff: Staff[];
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  tick: number;
  taskQueue: string[];
  priorityQueue: Array<{ taskId: string; priority: number; heapKey?: number }>;
  config: SimulationConfig;
  metrics: SimulationMetrics;
  algorithmTrace?: AlgorithmTrace;
}

// ✅ THIS is the correct assignment type
export interface Assignment {
  taskId: string;
  staffId: string;
  reason: string;
  travelDistance: number;
  skillMatch: number;
  trace?: AssignmentDecisionTrace;
}

// WebSocket Events
export interface ServerToClientEvents {
  stateUpdate: (state: SerializableSimulationState) => void;
  taskAssigned: (assignment: Assignment) => void;
  simulationTick: (tick: number) => void;
  simulationPaused: () => void;
  simulationResumed: () => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  createStaff: (staff: Omit<Staff, 'id' | 'currentTasks' | 'assignedTasksHistory'>) => void;
  updateConfig: (config: Partial<SimulationConfig>) => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  deleteTask: (taskId: string) => void;
  deleteStaff: (staffId: string) => void;
}
