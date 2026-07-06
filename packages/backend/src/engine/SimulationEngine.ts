/**
 * Simulation Engine - Main tick-based simulation loop
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  Staff,
  SimulationConfig,
  SimulationState,
  Assignment,
  GraphNode,
  AlgorithmTrace,
  QueuePromotionTrace,
  AssignmentDecisionTrace,
  PriorityCalculationTrace,
} from '@workforce/shared';
import { MinHeap } from '../dataStructures/MinHeap.js';
import { Queue } from '../dataStructures/Queue.js';
import { Graph } from '../dataStructures/Graph.js';
import { AllocationEngine } from './AllocationEngine.js';

export class SimulationEngine extends EventEmitter {
  private tick: number = 0;
  private tasks: Map<string, Task> = new Map();
  private staff: Map<string, Staff> = new Map();
  private taskQueue: Queue<string> = new Queue();
  private priorityQueue: MinHeap<string> = new MinHeap();
  private graph: Graph = new Graph();
  private config: SimulationConfig;
  private isRunning: boolean = false;
  private tickTimer: NodeJS.Timeout | null = null;
  private algorithmTrace: AlgorithmTrace = this.createEmptyTrace(0);

  constructor(config?: Partial<SimulationConfig>) {
    super();
    this.config = {
      urgencyWeight: 0.7,
      distanceWeight: 0.3,
      skillStrictness: 0.3, // Lowered from 0.6 to allow more assignments with partial skill matches
      maxWorkloadPerStaff: 3,
      disasterSeverity: 1.0,
      tickInterval: 1000,
      ...config,
    };

    this.initializeDefaultGraph();
  }

  /**
   * Initialize a default graph with some locations
   */
  private initializeDefaultGraph(): void {
    // Add some default base locations in Bangalore, India
    const baseLocations: GraphNode[] = [
      { id: 'base-1', type: 'base', location: { lat: 12.9716, lng: 77.5946, label: 'Bangalore Central' } },
      { id: 'base-2', type: 'base', location: { lat: 13.0358, lng: 77.5970, label: 'Bangalore North' } },
      { id: 'base-3', type: 'base', location: { lat: 12.9141, lng: 77.6411, label: 'Bangalore East' } },
    ];

    baseLocations.forEach(node => this.graph.addNode(node));

    // Connect bases with distances
    this.graph.addEdge('base-1', 'base-2', 7.2);
    this.graph.addEdge('base-2', 'base-3', 14.5);
    this.graph.addEdge('base-1', 'base-3', 8.8);
  }

  private createEmptyTrace(tick: number): AlgorithmTrace {
    return {
      tick,
      queuePromotions: [],
      priorityCalculations: [],
      assignmentDecisions: [],
    };
  }

  /**
   * Start the simulation
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.emit('started');
    this.runTick();
  }

  /**
   * Pause the simulation
   */
  pause(): void {
    this.isRunning = false;
    if (this.tickTimer) {
      clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
    this.emit('paused');
  }

  /**
   * Step forward one tick
   */
  step(): void {
    this.processTick();
  }

  /**
   * Reset the simulation
   */
  reset(): void {
    this.pause();
    this.tick = 0;
    this.tasks.clear();
    this.staff.clear();
    this.taskQueue.clear();
    this.priorityQueue.clear();
    this.graph.clear();
    this.initializeDefaultGraph();
    this.emit('reset');
    this.emitStateUpdate();
  }

  /**
   * Main tick loop
   */
  private runTick(): void {
    if (!this.isRunning) return;

    this.processTick();

    this.tickTimer = setTimeout(() => {
      this.runTick();
    }, this.config.tickInterval);
  }

  /**
   * Process a single tick
   */
  private processTick(): void {
    this.tick++;
    this.algorithmTrace = this.createEmptyTrace(this.tick);

    // 1. Update staff availability (simulate task completion)
    this.updateStaffAvailability();

    // 2. Move tasks from queue to priority queue
    this.processTaskQueue();

    // 3. Recalculate priorities
    this.updatePriorities();

    // 4. Attempt to assign highest priority tasks
    this.assignTasks();

    // 5. Emit state update
    this.emitStateUpdate();

    this.emit('tick', this.tick);
  }

  /**
   * Update staff availability (simulate tasks completing)
   */
  private updateStaffAvailability(): void {
    for (const staff of this.staff.values()) {
      // Simulate random task completion (for demo purposes)
      // Increased completion rate from 5% to 40% for faster simulation
      if (staff.status === 'busy' && Math.random() < 0.4) {
        const completedTaskId = staff.currentTasks.shift();
        if (completedTaskId) {
          const task = this.tasks.get(completedTaskId);
          if (task) {
            task.status = 'completed';
            this.emit('taskCompleted', task);
            console.log(`[COMPLETE] ✅ Task ${task.type} completed by staff ${staff.name}`);
          }
        }

        if (staff.currentTasks.length === 0) {
          staff.status = 'idle';
          staff.availability = true;
          console.log(`[STAFF] 🟢 ${staff.name} is now idle and available`);
        }
      }
    }
  }

  /**
   * Move tasks from FIFO queue to priority queue
   */
  private processTaskQueue(): void {
    while (!this.taskQueue.isEmpty()) {
      const taskId = this.taskQueue.dequeue();
      if (taskId) {
        const task = this.tasks.get(taskId);
        if (task) {
          task.status = 'queued';
          const priorityTrace = AllocationEngine.calculatePriorityTrace(task, this.config, Date.now());
          task.priority = priorityTrace.priorityScore;
          this.priorityQueue.insert(priorityTrace.heapKey, taskId);
          this.algorithmTrace.queuePromotions.push({
            taskId,
            taskType: task.type,
            priority: priorityTrace,
          });
          this.algorithmTrace.priorityCalculations.push(priorityTrace);
        }
      }
    }
  }

  /**
   * Update priorities of all tasks in priority queue
   */
  private updatePriorities(): void {
    const tasks = this.priorityQueue.toArray();
    this.priorityQueue.clear();

    for (const { data: taskId } of tasks) {
      const task = this.tasks.get(taskId);
      if (task && task.status === 'queued') {
        const priorityTrace = AllocationEngine.calculatePriorityTrace(task, this.config, Date.now());
        task.priority = priorityTrace.priorityScore;
        this.priorityQueue.insert(priorityTrace.heapKey, taskId);
        this.algorithmTrace.priorityCalculations.push(priorityTrace);
      }
    }
  }

  /**
   * Assign tasks to available staff
   */
  private assignTasks(): void {
    const availableStaff = Array.from(this.staff.values()).filter(
      s => s.availability && s.currentTasks.length < this.config.maxWorkloadPerStaff
    );

    console.log(`[ASSIGN] Available staff: ${availableStaff.length}, Priority queue size: ${this.priorityQueue.size()}`);

    let assignmentsMade = 0;
    const maxAssignmentsPerTick = 10; // Increased from 5 to 10 for faster assignments

    while (!this.priorityQueue.isEmpty() && assignmentsMade < maxAssignmentsPerTick) {
      const topTask = this.priorityQueue.peek();
      if (!topTask) break;

      const task = this.tasks.get(topTask.data);
      if (!task) {
        this.priorityQueue.extractMin();
        continue;
      }

      const priorityScore = task.priority ?? -topTask.priority;
      console.log(`[ASSIGN] Trying to assign task ${task.type} (priority: ${priorityScore.toFixed(2)}, skills: ${task.requiredSkills.join(',')})`);

      const result = AllocationEngine.findBestStaffWithTrace(
        task,
        availableStaff,
        this.graph,
        this.config,
        this.tick,
        priorityScore,
        topTask.priority
      );

      this.recordAssignmentDecision(result.decision);

      if (result.staff && result.assignment) {
        const assignedStaff = result.staff;

        // Assign task to staff
        this.priorityQueue.extractMin();
        task.status = 'assigned';
        task.assignedStaffId = assignedStaff.id;

        assignedStaff.currentTasks.push(task.id);
        assignedStaff.assignedTasksHistory.push(task.id);
        assignedStaff.status = 'busy';

        // Remove from available staff
        const staffIndex = availableStaff.findIndex(s => s.id === assignedStaff.id);
        if (staffIndex !== -1) {
          availableStaff.splice(staffIndex, 1);
        }

        console.log(`[ASSIGN] ✅ Assigned ${task.type} to ${assignedStaff.name}`);
        this.emit('taskAssigned', result.assignment);
        assignmentsMade++;
      } else {
        // No suitable staff available, stop trying
        console.log(`[ASSIGN] ❌ No suitable staff found for ${task.type}`);
        break;
      }
    }

    console.log(`[ASSIGN] Total assignments made this tick: ${assignmentsMade}`);
  }

  private recordAssignmentDecision(decision: AssignmentDecisionTrace): void {
    this.algorithmTrace.assignmentDecisions.push(decision);

    const selectedEvaluation = decision.evaluations.find(
      evaluation => evaluation.staffId === decision.selectedStaffId
    );

    if (selectedEvaluation?.pathTrace) {
      this.algorithmTrace.latestDijkstraTrace = selectedEvaluation.pathTrace;
    }

    if (
      decision.selectedStaffId &&
      selectedEvaluation?.pathTrace?.found &&
      selectedEvaluation.pathTrace.distance !== null
    ) {
      this.algorithmTrace.latestShortestPath = {
        taskId: decision.taskId,
        staffId: decision.selectedStaffId,
        path: selectedEvaluation.pathTrace.finalPath,
        distance: selectedEvaluation.pathTrace.distance,
      };
    }
  }

  /**
   * Create a new task
   */
  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'status'>): Task {
    const task: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: Date.now(),
      status: 'pending',
    };

    this.tasks.set(task.id, task);
    this.taskQueue.enqueue(task.id);

    // Add task location to graph if needed
    const nodeId = `task-${task.id}`;
    this.graph.addNode({
      id: nodeId,
      type: 'site',
      location: task.location,
    });

    // Connect to nearby nodes
    this.connectToNearbyNodes(nodeId, task.location);

    this.emit('taskCreated', task);
    this.emitStateUpdate();
    return task;
  }

  /**
   * Create a new staff member
   */
  createStaff(staffData: Omit<Staff, 'id' | 'currentTasks' | 'assignedTasksHistory'>): Staff {
    const staff: Staff = {
      ...staffData,
      id: uuidv4(),
      currentTasks: [],
      assignedTasksHistory: [],
    };

    this.staff.set(staff.id, staff);

    // Add staff location to graph
    const nodeId = `staff-${staff.id}`;
    this.graph.addNode({
      id: nodeId,
      type: 'staff',
      location: staff.location,
    });

    this.connectToNearbyNodes(nodeId, staff.location);

    this.emit('staffCreated', staff);
    this.emitStateUpdate();
    return staff;
  }

  /**
   * Connect a new node to nearby existing nodes
   */
  private connectToNearbyNodes(nodeId: string, location: { lat: number; lng: number }): void {
    // Only connect to the 3 nearest nodes to reduce graph clutter
    const distances: Array<{ id: string; distance: number }> = [];

    for (const [existingId, existingNode] of this.graph.nodes) {
      if (existingId === nodeId) continue;
      const distance = Graph.calculateDistance(location, existingNode.location);
      distances.push({ id: existingId, distance });
    }

    // Sort by distance and connect to only 3 closest nodes
    distances.sort((a, b) => a.distance - b.distance);
    distances.slice(0, 3).forEach(({ id, distance }) => {
      this.graph.addEdge(nodeId, id, distance);
    });
  }

  /**
   * Delete a task
   */
  deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Remove from queue or priority queue
    this.taskQueue.remove(id => id === taskId);
    this.priorityQueue.remove(id => id === taskId);

    // Unassign from staff if assigned
    if (task.assignedStaffId) {
      const staff = this.staff.get(task.assignedStaffId);
      if (staff) {
        staff.currentTasks = staff.currentTasks.filter(id => id !== taskId);
        if (staff.currentTasks.length === 0) {
          staff.status = 'idle';
        }
      }
    }

    this.tasks.delete(taskId);
    this.graph.nodes.delete(`task-${taskId}`);
    this.emitStateUpdate();
    return true;
  }

  /**
   * Delete a staff member
   */
  deleteStaff(staffId: string): boolean {
    const staff = this.staff.get(staffId);
    if (!staff) return false;

    // Unassign all tasks
    for (const taskId of staff.currentTasks) {
      const task = this.tasks.get(taskId);
      if (task) {
        task.status = 'queued';
        task.assignedStaffId = undefined;
        const priorityTrace = AllocationEngine.calculatePriorityTrace(task, this.config, Date.now());
        task.priority = priorityTrace.priorityScore;
        this.priorityQueue.insert(priorityTrace.heapKey, taskId);
      }
    }

    this.staff.delete(staffId);
    this.graph.nodes.delete(`staff-${staffId}`);
    this.emitStateUpdate();
    return true;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
    this.emitStateUpdate();
  }

  /**
   * Get current state
   */
  getState(): SimulationState {
    return {
      tick: this.tick,
      tasks: this.tasks, // Keep as Map for backend
      staff: this.staff, // Keep as Map for backend
      taskQueue: this.taskQueue.toArray(),
      priorityQueue: this.priorityQueue.toArray().map(n => {
        const task = this.tasks.get(n.data);
        return {
          taskId: n.data,
          priority: task?.priority ?? -n.priority,
          heapKey: n.priority,
        };
      }),
      graph: {
        nodes: this.graph.nodes,
        edges: this.graph.getEdges(),
      },
      config: this.config,
      metrics: AllocationEngine.calculateMetrics(this.tasks, this.staff),
      algorithmTrace: this.algorithmTrace,
    };
  }

  /**
   * Get serializable state for socket emission
   */
  getSerializableState() {
    const state = this.getState();
    return {
      ...state,
      tasks: Array.from(this.tasks.values()),
      staff: Array.from(this.staff.values()),
      graph: {
        nodes: Array.from(this.graph.nodes.values()),
        edges: state.graph.edges,
      },
    };
  }

  /**
   * Emit state update event
   */
  private emitStateUpdate(): void {
    this.emit('stateUpdate', this.getSerializableState());
  }
}
