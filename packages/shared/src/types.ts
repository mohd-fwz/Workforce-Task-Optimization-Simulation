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

export interface SimulationState {
  tick: number;
  tasks: Map<string, Task>;
  staff: Map<string, Staff>;
  taskQueue: string[];
  priorityQueue: Array<{ taskId: string; priority: number }>;
  graph: Graph;
  config: SimulationConfig;
  metrics: SimulationMetrics & {
    staffUtilization: number;
  };
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
  priorityQueue: Array<{ taskId: string; priority: number }>;
  config: SimulationConfig;
  metrics: SimulationMetrics;
}

// ✅ THIS is the correct assignment type
export interface Assignment {
  taskId: string;
  staffId: string;
  reason: string;
  travelDistance: number;
  skillMatch: number;
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
