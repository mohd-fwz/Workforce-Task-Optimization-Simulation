/**
 * Allocation Engine - The Brain
 * Matches staff to tasks based on priority, skills, distance, and availability
 */

import { Task, Staff, SimulationConfig, Assignment, SkillType } from '@workforce/shared';
import { Graph } from '../dataStructures/Graph.js';

export class AllocationEngine {
  /**
   * Calculate task priority based on multiple factors
   */
  static calculatePriority(task: Task, config: SimulationConfig, currentTime: number): number {
    const timeFactor = this.getTimeFactor(task, currentTime);
    const unmetNeed = this.getUnmetNeedFactor(task);

    // Priority = urgency × timeFactor × unmetNeed × disasterSeverity
    const priority =
      (task.urgency / 10) *
      config.urgencyWeight *
      timeFactor *
      unmetNeed *
      config.disasterSeverity;

    return priority;
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
    if (availableStaff.length === 0) return null;

    let bestStaff: Staff | null = null;
    let bestScore = -Infinity;
    let bestAssignment: Assignment | null = null;

    for (const staff of availableStaff) {
      // Check capacity
      if (staff.currentTasks.length >= config.maxWorkloadPerStaff) continue;

      // Calculate skill match
      const skillMatch = this.calculateSkillMatch(task.requiredSkills, staff.skills);

      // Check skill strictness
      if (skillMatch < config.skillStrictness) continue;

      // Calculate distance
      const taskNodeId = graph.findNearestNode(task.location);
      const staffNodeId = graph.findNearestNode(staff.location);

      let distance = 0;
      if (taskNodeId && staffNodeId) {
        const path = graph.dijkstra(staffNodeId, taskNodeId);
        distance = path ? path.distance : 999;
      }

      // Calculate combined score
      // Higher skill match and lower distance = better
      const distanceScore = 1 / (1 + distance * config.distanceWeight);
      const score = (skillMatch * 100) + (distanceScore * 100);

      if (score > bestScore) {
        bestScore = score;
        bestStaff = staff;

        bestAssignment = {
          taskId: task.id,
          staffId: staff.id,
          reason: this.generateAssignmentReason(skillMatch, distance),
          travelDistance: distance,
          skillMatch,
        };
      }
    }

    if (!bestStaff || !bestAssignment) return null;

    return {
      staff: bestStaff,
      assignment: bestAssignment,
    };
  }

  /**
   * Calculate how well staff skills match task requirements
   */
  private static calculateSkillMatch(requiredSkills: SkillType[], staffSkills: SkillType[]): number {
    if (requiredSkills.length === 0) return 1.0;

    const matchedSkills = requiredSkills.filter(req => staffSkills.includes(req));
    return matchedSkills.length / requiredSkills.length;
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
