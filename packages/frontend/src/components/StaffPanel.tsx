import { useState } from 'react';
import { Plus, Trash2, User, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkillType } from '@workforce/shared';
import { useSimulationStore } from '../store/useSimulationStore';
import socket from '../services/socket';
import { generateRandomStaff, GeneratorConfig } from '../utils/randomGenerator';

export default function StaffPanel() {
  const { staff } = useSimulationStore();
  const [showForm, setShowForm] = useState(false);
  const [showGeneratorForm, setShowGeneratorForm] = useState(false);
  const [generatorConfig, setGeneratorConfig] = useState<GeneratorConfig>({
    staffCount: 10,
    centerLat: 12.9716, // Bangalore, India
    centerLng: 77.5946,
    radius: 0.1,
  });

  const handleCreateStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newStaff = {
      name: formData.get('name') as string,
      skills: (formData.get('skills') as string).split(',').map(s => s.trim()) as SkillType[],
      location: {
        lat: parseFloat(formData.get('lat') as string),
        lng: parseFloat(formData.get('lng') as string),
      },
      status: 'idle' as const,
      availability: true,
      capacity: parseInt(formData.get('capacity') as string),
    };

    socket.emit('createStaff', newStaff);
    setShowForm(false);
    e.currentTarget.reset();
  };

  const handleDeleteStaff = (staffId: string) => {
    socket.emit('deleteStaff', staffId);
  };

  const handleGenerateStaff = () => {
    const staffMembers = generateRandomStaff(generatorConfig);
    staffMembers.forEach(member => {
      socket.emit('createStaff', member);
    });
    setShowGeneratorForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-accent-green';
      case 'busy': return 'bg-accent-blue';
      case 'rest': return 'bg-accent-yellow';
      case 'unavailable': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 bg-dark-surface rounded-lg border border-dark-border p-4 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Staff</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGeneratorForm(!showGeneratorForm)}
            className="bg-accent-purple hover:bg-purple-600 text-white p-2 rounded transition"
            title="Generate Random Staff"
          >
            <Wand2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-accent-green hover:bg-green-600 text-white p-2 rounded transition"
            title="Add Single Staff"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generate random staff form */}
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
              Generate Random Staff
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 w-24">Count:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={generatorConfig.staffCount}
                  onChange={(e) => setGeneratorConfig({ ...generatorConfig, staffCount: parseInt(e.target.value) || 10 })}
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
                onClick={handleGenerateStaff}
                className="bg-accent-purple hover:bg-purple-600 text-white px-3 py-2 rounded text-sm transition flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Generate {generatorConfig.staffCount} Staff
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create staff form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleCreateStaff}
            className="bg-dark-bg rounded p-3 mb-4 overflow-hidden"
          >
            <div className="flex flex-col gap-2">
              <input
                name="name"
                placeholder="Name"
                required
                className="bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
              />

              <input
                name="skills"
                placeholder="Skills (comma-separated)"
                required
                className="bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
              />

              <div className="flex gap-2">
                <input
                  name="lat"
                  type="number"
                  step="0.0001"
                  placeholder="Latitude"
                  defaultValue="40.7489"
                  required
                  className="flex-1 bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
                />
                <input
                  name="lng"
                  type="number"
                  step="0.0001"
                  placeholder="Longitude"
                  defaultValue="-73.9680"
                  required
                  className="flex-1 bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
                />
              </div>

              <input
                name="capacity"
                type="number"
                min="1"
                max="10"
                placeholder="Capacity"
                defaultValue="3"
                required
                className="bg-dark-surface border border-dark-border text-white px-2 py-1 rounded text-sm"
              />

              <button
                type="submit"
                className="bg-accent-green hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition"
              >
                Create Staff
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Staff list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {staff.map((member) => (
            <motion.div
              key={member.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="bg-dark-bg rounded p-3 border border-dark-border hover:border-accent-green/50 transition slide-in"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <User className="w-8 h-8 text-gray-400" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${getStatusColor(member.status)} border-2 border-dark-bg`} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{member.name}</div>
                    <div className="text-xs text-gray-400">
                      {member.currentTasks.length}/{member.capacity} tasks
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteStaff(member.id)}
                  className="text-gray-400 hover:text-accent-red transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {member.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {member.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {staff.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No staff yet. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
}
