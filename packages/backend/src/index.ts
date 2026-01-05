/**
 * Backend Server - Express + Socket.IO
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SimulationEngine } from './engine/SimulationEngine.js';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SerializableSimulationState
} from '@workforce/shared';


const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Create simulation engine
const simulation = new SimulationEngine();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', tick: simulation.getState().tick });
});

// Get current state
app.get('/api/state', (req, res) => {
  res.json(simulation.getSerializableState());
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send initial state
  socket.emit(
    'stateUpdate', 
    simulation.getSerializableState() as SerializableSimulationState
);

  // Create task
  socket.on('createTask', (taskData) => {
    try {
      const task = simulation.createTask(taskData);
      console.log(`Task created: ${task.id} - ${task.type}`);
    } catch (error) {
      socket.emit('error', `Failed to create task: ${error}`);
    }
  });

  // Create staff
  socket.on('createStaff', (staffData) => {
    try {
      const staff = simulation.createStaff(staffData);
      console.log(`Staff created: ${staff.id} - ${staff.name}`);
    } catch (error) {
      socket.emit('error', `Failed to create staff: ${error}`);
    }
  });

  // Update config
  socket.on('updateConfig', (config) => {
    try {
      simulation.updateConfig(config);
      console.log('Config updated:', config);
    } catch (error) {
      socket.emit('error', `Failed to update config: ${error}`);
    }
  });

  // Pause simulation
  socket.on('pauseSimulation', () => {
    simulation.pause();
    io.emit('simulationPaused');
    console.log('Simulation paused');
  });

  // Resume simulation
  socket.on('resumeSimulation', () => {
    simulation.start();
    io.emit('simulationResumed');
    console.log('Simulation resumed');
  });

  // Step simulation
  socket.on('stepSimulation', () => {
    simulation.step();
    console.log('Simulation stepped');
  });

  // Reset simulation
  socket.on('resetSimulation', () => {
    simulation.reset();
    console.log('Simulation reset');
  });

  // Delete task
  socket.on('deleteTask', (taskId) => {
    try {
      simulation.deleteTask(taskId);
      console.log(`Task deleted: ${taskId}`);
    } catch (error) {
      socket.emit('error', `Failed to delete task: ${error}`);
    }
  });

  // Delete staff
  socket.on('deleteStaff', (staffId) => {
    try {
      simulation.deleteStaff(staffId);
      console.log(`Staff deleted: ${staffId}`);
    } catch (error) {
      socket.emit('error', `Failed to delete staff: ${error}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Forward simulation events to all connected clients
simulation.on('stateUpdate', (state) => {
  io.emit('stateUpdate', state);
});

simulation.on('taskAssigned', (assignment) => {
  io.emit('taskAssigned', assignment);
});

simulation.on('tick', (tick) => {
  io.emit('simulationTick', tick);
});

// Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Simulation engine initialized`);
  console.log('⏸️  Simulation paused - click Resume to start');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  simulation.pause();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
