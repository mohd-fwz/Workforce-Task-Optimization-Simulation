import { useState } from 'react';
import { Plus, Trash2, AlertCircle, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskType, SkillType } from '@workforce/shared';
import { useSimulationStore } from '../store/useSimulationStore';
import socket from '../services/socket';
import { generateRandomTasks, GeneratorConfig } from '../utils/randomGenerator';

export default function TaskPanel() {
  const { tasks } = useSimulationStore();
  const [showForm, setShowForm] = useState(false);
  const [showGeneratorForm, setShowGeneratorForm] = useState(false);
  const [generatorConfig, setGeneratorConfig] = useState<GeneratorConfig>({
    taskCount: 15,
    centerLat: 12.9716, // Bangalore, India
    centerLng: 77.5946,
    radius: 0.1,
  });

  const handleCreateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const task = {
      type: formData.get('type') as TaskType,
      requiredSkills: (formData.get('skills') as string).split(',').map(s => s.trim()) as SkillType[],
      urgency: parseInt(formData.get('urgency') as string),
      location: {
        lat: parseFloat(formData.get('lat') as string),
        lng: parseFloat(formData.get('lng') as string),
      },
      estimatedDuration: parseInt(formData.get('duration') as string),
    };

    socket.emit('createTask', task);
    setShowForm(false);
    e.currentTarget.reset();
  };

  const handleDeleteTask = (taskId: string) => {
    socket.emit('deleteTask', taskId);
  };

  const handleGenerateTasks = () => {
    const newTasks = generateRandomTasks(generatorConfig);
    newTasks.forEach(task => {
      socket.emit('createTask', task);
    });
    setShowGeneratorForm(false);
  };

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 8) return 'text-accent-red';
    if (urgency >= 5) return 'text-accent-yellow';
    return 'text-accent-green';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-accent-green/20 text-accent-green';
      case 'assigned':
      case 'in-progress': return 'bg-accent-blue/20 text-accent-blue';
      case 'queued': return 'bg-accent-purple/20 text-accent-purple';
      default: return 'bg-gray-700/20 text-gray-400';
    }
  };

  return (
    <div className="flex-1 bg-dark-surface rounded-lg border border-dark-border p-4 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Tasks</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGeneratorForm(!showGeneratorForm)}
            className="bg-accent-purple hover:bg-purple-600 text-white p-2 rounded transition"
            title="Generate Random Tasks"
          >
            <Wand2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-accent-blue hover:bg-blue-600 text-white p-2 rounded transition"
            title="Add Single Task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generate random tasks form */}
      <AnimatePresence>
        {showGeneratorForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-dark-bg rounded p-3 mb-4 overflow-hidden border-2 border-accent-purple/50"
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Generate Random Tasks
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 w-24">Count:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={generatorConfig.taskCount}
                  onChange={(e) => setGeneratorConfig({ ...generatorConfig, taskCount: parseInt(e.target.value) || 15 })}
                  className="flex-1 bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 w-24">Center Lat:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={generatorConfig.centerLat}
                  onChange={(e) => setGeneratorConfig({ ...generatorConfig, centerLat: parseFloat(e.target.value) || 40.7128 })}
                  className="flex-1 bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 w-24">Center Lng:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={generatorConfig.centerLng}
                  onChange={(e) => setGeneratorConfig({ ...generatorConfig, centerLng: parseFloat(e.target.value) || -74.0060 })}
                  className="flex-1 bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 w-24">Radius:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1"
                  value={generatorConfig.radius}
                  onChange={(e) => setGeneratorConfig({ ...generatorConfig, radius: parseFloat(e.target.value) || 0.1 })}
                  className="flex-1 bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
                />
                <span className="text-xs text-gray-500">~{Math.round((generatorConfig.radius || 0.1) * 111)} km</span>
              </div>

              <button
                onClick={handleGenerateTasks}
                className="bg-accent-purple hover:bg-purple-600 text-white px-3 py-2 rounded text-sm transition flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Generate {generatorConfig.taskCount} Tasks
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create task form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleCreateTask}
            className="bg-dark-bg rounded p-3 mb-4 overflow-hidden"
          >
            <div className="flex flex-col gap-2">
              <select name="type" required className="bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm">
                <option value="Medical">Medical</option>
                <option value="Distribution">Distribution</option>
                <option value="Survey">Survey</option>
                <option value="Rescue">Rescue</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>

              <input
                name="skills"
                placeholder="Skills (comma-separated)"
                className="bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
              />

              <div className="flex gap-2">
                <input
                  name="lat"
                  type="number"
                  step="0.0001"
                  placeholder="Latitude"
                  defaultValue="40.7128"
                  required
                  className="flex-1 bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
                />
                <input
                  name="lng"
                  type="number"
                  step="0.0001"
                  placeholder="Longitude"
                  defaultValue="-74.0060"
                  required
                  className="flex-1 bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
                />
              </div>

              <div className="flex gap-2">
                <input
                  name="urgency"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Urgency (1-10)"
                  defaultValue="5"
                  required
                  className="flex-1 bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
                />
                <input
                  name="duration"
                  type="number"
                  min="10"
                  placeholder="Duration (min)"
                  defaultValue="60"
                  required
                  className="flex-1 bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
                />
              </div>

              <button
                type="submit"
                className="bg-accent-green hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition"
              >
                Create Task
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="bg-dark-bg rounded p-3 border border-dark-border hover:border-accent-blue/50 transition slide-in"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{task.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <AlertCircle className={`w-3 h-3 ${getUrgencyColor(task.urgency)}`} />
                    <span className={`text-xs ${getUrgencyColor(task.urgency)}`}>
                      Urgency: {task.urgency}/10
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-gray-400 hover:text-accent-red transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {task.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-accent-purple/20 text-accent-purple px-2 py-0.5 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {task.assignedStaffId && (
                <div className="text-xs text-gray-400 mt-2">
                  Assigned to: {task.assignedStaffId.slice(0, 8)}...
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No tasks yet. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
}
