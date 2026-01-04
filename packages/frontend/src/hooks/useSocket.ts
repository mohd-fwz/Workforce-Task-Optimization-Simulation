/**
 * Hook for socket connection and event handling
 */

import { useEffect } from 'react';
import socket from '../services/socket';
import { useSimulationStore } from '../store/useSimulationStore';

export const useSocket = () => {
  const { updateState, setConnected, setRunning } = useSimulationStore();

  useEffect(() => {
    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to simulation server');
      setConnected(true);
      setRunning(false); // Start paused by default
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from simulation server');
      setConnected(false);
      setRunning(false);
    });

    // State updates
    socket.on('stateUpdate', (state) => {
      console.log('📥 Received state update:', {
        tasksCount: state.tasks instanceof Map ? state.tasks.size : (Array.isArray(state.tasks) ? state.tasks.length : 'unknown'),
        staffCount: state.staff instanceof Map ? state.staff.size : (Array.isArray(state.staff) ? state.staff.length : 'unknown'),
        tick: state.tick
      });
      updateState(state);
    });

    socket.on('simulationTick', (tick) => {
      // Optional: handle tick updates
    });

    socket.on('taskAssigned', (assignment) => {
      console.log('📋 Task assigned:', assignment);
    });

    socket.on('error', (error) => {
      console.error('❌ Simulation error:', error);
    });

    socket.on('simulationPaused', () => {
      console.log('⏸️  Simulation paused');
      setRunning(false);
    });

    socket.on('simulationResumed', () => {
      console.log('▶️  Simulation resumed');
      setRunning(true);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('stateUpdate');
      socket.off('simulationTick');
      socket.off('taskAssigned');
      socket.off('error');
      socket.off('simulationPaused');
      socket.off('simulationResumed');
    };
  }, [updateState, setConnected, setRunning]);

  return socket;
};
