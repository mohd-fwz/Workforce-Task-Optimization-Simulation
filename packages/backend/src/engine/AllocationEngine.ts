/**
 * Allocation Engine - The Brain
 * Matches staff to tasks based on priority, skills, distance, and availability
 */

import {
  Task,
  Staff,
  SimulationConfig,
  Assignment,
  SkillType,
  PriorityCalculationTrace,
  AssignmentDecisionTrace,
  StaffEvaluationTrace,
} from '@workforce/shared';
import { Graph } from '../dataStructures/Graph.js';

export class AllocationEngine {
  /**
   * Calculate task priority based on multiple factors
   */
  static calculatePriority(task: Task, config: SimulationConfig, currentTime: number): number {
    return this.calculatePriorityTrace(task, config, currentTime).priorityScore;
  }

  /**
   * Calculate task priority and expose each formula factor for teaching.
   */
  static calculatePriorityTrace(
    task: Task,
    config: SimulationConfig,
    currentTime: number
  ): PriorityCalculationTrace {
    const timeFactor = this.getTimeFactor(task, currentTime);
    const unmetNeed = this.getUnmetNeedFactor(task);
    const urgencyNormalized = task.urgency / 10;

    const priorityScore =
      urgencyNormalized *
      config.urgencyWeight *
      timeFactor *
      unmetNeed *
      config.disasterSeverity;

    return {
      taskId: task.id,
      taskType: task.type,
      urgencyNormalized,
      urgencyWeight: config.urgencyWeight,
      timeFactor,
      unmetNeed,
      disasterSeverity: config.disasterSeverity,
      priorityScore,
      heapKey: -priorityScore,
      explanation: 'Higher computed priority becomes a lower heap key, so the min-heap extracts it first.',
    };
  }

  /**
   * Get time-based urgency factor
   */
  private static getTimeFactor(task: Task, currentTime: number): number {
    if (!task.timeWindow) return 1.0;

    const timeRemaining = task.timeWindow.end - currentTime;
    const totalWindow = task.timeWindow.end - task.timeWindow.start;

    if (timeRemaining <= 0) return 2.0; // Overdue
    if (timeRemaining < totalWindow * 0.2) return 1.8; // Critical
    if (timeRemaining < totalWindow * 0.5) return 1.4; // Urgent
    return 1.0; // Normal
  }

  /**
   * Get unmet need factor (how long has task been waiting)
   */
  private static getUnmetNeedFactor(task: Task): number {
    const waitingTime = Date.now() - task.createdAt;
    const hoursWaiting = waitingTime / (1000 * 60 * 60);

    // Increases linearly up to 2x after 24 hours
    return Math.min(1.0 + (hoursWaiting / 24), 2.0);
  }

  /**
   * Find best staff member for a task
   */
  static findBestStaff(
    task: Task,
    availableStaff: Staff[],
    graph: Graph,
    config: SimulationConfig
  ): { staff: Staff; assignment: Assignment } | null {
    const detailed = this.findBestStaffWithTrace(task, availableStaff, graph, config, 0, 0, 0);
    if (!detailed.staff || !detailed.assignment) return null;

    return {
      staff: detailed.staff,
      assignment: detailed.assignment,
    };
  }

  /**
   * Find best staff member and keep every candidate score visible.
   */
  static findBestStaffWithTrace(
    task: Task,
    availableStaff: Staff[],
    graph: Graph,
    config: SimulationConfig,
    tick: number,
    priorityScore: number,
    heapKey: number
  ): { staff: Staff | null; assignment: Assignment | null; decision: AssignmentDecisionTrace } {
    if (availableStaff.length === 0) {
      return {
        staff: null,
        assignment: null,
        decision: {
          tick,
          taskId: task.id,
          taskType: task.type,
          priorityScore,
          heapKey,
          selectedReason: 'No available staff under the current workload limits',
          evaluations: [],
        },
      };
    }

    let bestStaff: Staff | null = null;
    let bestScore = -Infinity;
    let bestAssignment: Assignment | null = null;
    const evaluations: StaffEvaluationTrace[] = [];

    for (const staff of availableStaff) {
      const skillDetails = this.calculateSkillMatchDetails(task.requiredSkills, staff.skills);
      let eligible = true;
      let rejectionReason: string | undefined;

      if (staff.currentTasks.length >= config.maxWorkloadPerStaff) {
        eligible = false;
        rejectionReason = `Capacity full (${staff.currentTasks.length}/${config.maxWorkloadPerStaff})`;
      } else if (skillDetails.score < config.skillStrictness) {
        eligible = false;
        rejectionReason = `Skill match ${Math.round(skillDetails.score * 100)}% is below strictness ${Math.round(config.skillStrictness * 100)}%`;
      }

      const taskNodeId = graph.findNearestNode(task.location);
      const staffNodeId = graph.findNearestNode(staff.location);

      let distance: number | null = null;
      let distanceScore = 0;
      let pathTrace;
      if (taskNodeId && staffNodeId) {
        pathTrace = graph.dijkstraWithTrace(staffNodeId, taskNodeId);
        distance = pathTrace.found && pathTrace.distance !== null ? pathTrace.distance : null;
      }

      if (eligible && distance === null) {
        eligible = false;
        rejectionReason = 'No reachable graph path from staff to task';
      }

      if (distance !== null) {
        distanceScore = 1 / (1 + distance * config.distanceWeight);
      }

      const score = eligible
        ? (skillDetails.score * 100) + (distanceScore * 100)
        : 0;

      evaluations.push({
        staffId: staff.id,
        staffName: staff.name,
        eligible,
        rejectionReason,
        skillMatch: skillDetails.score,
        matchedSkills: skillDetails.matchedSkills,
        missingSkills: skillDetails.missingSkills,
        distance,
        distanceScore,
        combinedScore: score,
        pathTrace,
        explanation: eligible
          ? `Score = skill ${Math.round(skillDetails.score * 100)} + distance ${distanceScore.toFixed(2)} x 100 = ${score.toFixed(1)}`
          : rejectionReason || 'Candidate rejected',
      });

      if (!eligible) continue;

      if (score > bestScore) {
        bestScore = score;
        bestStaff = staff;

        bestAssignment = {
          taskId: task.id,
          staffId: staff.id,
          reason: this.generateAssignmentReason(skillDetails.score, distance ?? 999),
          travelDistance: distance ?? 999,
          skillMatch: skillDetails.score,
        };
      }
    }

    if (!bestStaff || !bestAssignment) {
      return {
        staff: null,
        assignment: null,
        decision: {
          tick,
          taskId: task.id,
          taskType: task.type,
          priorityScore,
          heapKey,
          selectedReason: 'Every candidate was rejected by capacity, skill, or path constraints',
          evaluations,
        },
      };
    }

    const decision: AssignmentDecisionTrace = {
      tick,
      taskId: task.id,
      taskType: task.type,
      priorityScore,
      heapKey,
      selectedStaffId: bestStaff.id,
      selectedStaffName: bestStaff.name,
      selectedReason: bestAssignment.reason,
      evaluations,
    };

    bestAssignment.trace = decision;

    return {
      staff: bestStaff,
      assignment: bestAssignment,
      decision,
    };
  }

  /**
   * Calculate how well staff skills match task requirements
   */
  private static calculateSkillMatch(requiredSkills: SkillType[], staffSkills: SkillType[]): number {
    return this.calculateSkillMatchDetails(requiredSkills, staffSkills).score;
  }

  private static calculateSkillMatchDetails(
    requiredSkills: SkillType[],
    staffSkills: SkillType[]
  ): { score: number; matchedSkills: SkillType[]; missingSkills: SkillType[] } {
    if (requiredSkills.length === 0) {
      return {
        score: 1.0,
        matchedSkills: [],
        missingSkills: [],
      };
    }

    const matchedSkills = requiredSkills.filter(req => staffSkills.includes(req));
    const missingSkills = requiredSkills.filter(req => !staffSkills.includes(req));

    return {
      score: matchedSkills.length / requiredSkills.length,
      matchedSkills,
      missingSkills,
    };
  }

  /**
   * Generate human-readable assignment reason
   */
  private static generateAssignmentReason(skillMatch: number, distance: number): string {
    const reasons: string[] = [];

    if (skillMatch === 1.0) {
      reasons.push('Perfect skill match');
    } else if (skillMatch >= 0.7) {
      reasons.push('Good skill match');
    } else if (skillMatch >= 0.5) {
      reasons.push('Partial skill match');
    }

    if (distance < 5) {
      reasons.push('Very close proximity');
    } else if (distance < 20) {
      reasons.push('Reasonable distance');
    } else if (distance < 50) {
      reasons.push('Moderate distance');
    } else {
      reasons.push('Long distance travel required');
    }

    return reasons.join(' • ');
  }

  /**
   * Calculate overall metrics for the simulation
   */
  static calculateMetrics(tasks: Map<string, Task>, staff: Map<string, Staff>) {
    const tasksCompleted = Array.from(tasks.values()).filter(t => t.status === 'completed').length;
    const tasksAssigned = Array.from(tasks.values()).filter(t => t.status === 'assigned' || t.status === 'in-progress').length;
    const tasksPending = Array.from(tasks.values()).filter(t => t.status === 'pending' || t.status === 'queued').length;

    // Calculate average response time
    const completedTasks = Array.from(tasks.values()).filter(t => t.status === 'completed');
    const averageResponseTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => sum + (Date.now() - task.createdAt), 0) / completedTasks.length / 1000 / 60
      : 0;

    // Calculate staff utilization
    const busyStaff = Array.from(staff.values()).filter(s => s.status === 'busy').length;
    const staffUtilization = staff.size > 0 ? busyStaff / staff.size : 0;

    return {
      tasksCompleted,
      tasksAssigned,
      tasksPending,
      averageResponseTime,
      staffUtilization,
    };
  }
}
