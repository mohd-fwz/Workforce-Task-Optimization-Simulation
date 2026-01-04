// Core type definitions shared between frontend and backend

export type SkillType = 'medical' | 'logistics' | 'survey' | 'rescue' | 'engineering' | 'communication';

export type TaskType = 'Survey' | 'Distribution' | 'Medical' | 'Rescue' | 'Infrastructure';

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
  urgency: number; // 1-10
  location: Location;
  timeWindow?: {
    start: number;
    end: number;
  };
  estimatedDuration: number; // minutes
  assignedStaffId?: string;
  status: 'pending' | 'queued' | 'assigned' | 'in-progress' | 'completed';
  createdAt: number;
  priority?: number; // calculated
}

export interface Staff {
  id: string;
  name: string;
  skills: SkillType[];
  location: Location;
  status: StaffStatus;
  availability: boolean;
  capacity: number; // max concurrent tasks
  currentTasks: string[]; // task IDs
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
  distance: number; // km
  travelTime: number; // minutes
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
}

export interface SimulationConfig {
  urgencyWeight: number; // 0-1
  distanceWeight: number; // 0-1
  skillStrictness: number; // 0-1 (1 = must match all skills)
  maxWorkloadPerStaff: number;
  disasterSeverity: number; // multiplier
  tickInterval: number; // ms
}

export interface SimulationState {
  tick: number;
  tasks: Map<string, Task>;
  staff: Map<string, Staff>;
  taskQueue: string[]; // FIFO queue of task IDs
  priorityQueue: Array<{ taskId: string; priority: number }>; // Heap
  graph: Graph;
  config: SimulationConfig;
  metrics: {
    tasksCompleted: number;
    tasksAssigned: number;
    tasksPending: number;
    averageResponseTime: number;
    staffUtilization: number;
  };
}

export interface Assignment {
  taskId: string;
  staffId: string;
  reason: string;
  travelDistance: number;
  skillMatch: number; // 0-1
}

// WebSocket Events
export interface ServerToClientEvents {
  stateUpdate: (state: Partial<SimulationState>) => void;
  taskAssigned: (assignment: Assignment) => void;
  simulationTick: (tick: number) => void;
  error: (error: string) => void;
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
