import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import socket from '../services/socket';

export default function ControlPanel() {
  const { isRunning, config, setConfig } = useSimulationStore();

  const handlePause = () => {
    socket.emit('pauseSimulation');
  };

  const handleResume = () => {
    socket.emit('resumeSimulation');
  };

  const handleStep = () => {
    socket.emit('stepSimulation');
  };

  const handleReset = () => {
    if (confirm('Reset simulation? This will clear all tasks and staff.')) {
      socket.emit('resetSimulation');
    }
  };

  const handleConfigChange = (key: keyof typeof config, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    socket.emit('updateConfig', { [key]: value });
  };

  return (
    <div className="bg-dark-surface rounded-lg border border-dark-border p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold text-white">Control Panel</h2>

      {/* Playback controls */}
      <div className="flex gap-2">
        {isRunning ? (
          <button
            onClick={handlePause}
            className="flex-1 bg-accent-yellow hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        ) : (
          <button
            onClick={handleResume}
            className="flex-1 bg-accent-green hover:bg-green-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4" />
            Resume
          </button>
        )}

        <button
          onClick={handleStep}
          className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <button
          onClick={handleReset}
          className="bg-accent-red hover:bg-red-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Configuration sliders */}
      <div className="flex flex-col gap-4 pt-4 border-t border-dark-border">
        <h3 className="text-sm font-semibold text-gray-300">Parameters</h3>

        {/* Urgency Weight */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm text-gray-400">Urgency Weight</label>
            <span className="text-sm text-accent-blue font-mono">{config.urgencyWeight.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.urgencyWeight}
            onChange={(e) => handleConfigChange('urgencyWeight', parseFloat(e.target.value))}
            className="w-full accent-accent-blue"
          />
        </div>

        {/* Distance Weight */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm text-gray-400">Distance Weight</label>
            <span className="text-sm text-accent-blue font-mono">{config.distanceWeight.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.distanceWeight}
            onChange={(e) => handleConfigChange('distanceWeight', parseFloat(e.target.value))}
            className="w-full accent-accent-blue"
          />
        </div>

        {/* Skill Strictness */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm text-gray-400">Skill Strictness</label>
            <span className="text-sm text-accent-purple font-mono">{config.skillStrictness.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.skillStrictness}
            onChange={(e) => handleConfigChange('skillStrictness', parseFloat(e.target.value))}
            className="w-full accent-accent-purple"
          />
        </div>

        {/* Max Workload */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm text-gray-400">Max Workload per Staff</label>
            <span className="text-sm text-accent-green font-mono">{config.maxWorkloadPerStaff}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={config.maxWorkloadPerStaff}
            onChange={(e) => handleConfigChange('maxWorkloadPerStaff', parseInt(e.target.value))}
            className="w-full accent-accent-green"
          />
        </div>

        {/* Disaster Severity */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm text-gray-400">Disaster Severity</label>
            <span className="text-sm text-accent-red font-mono">{config.disasterSeverity.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={config.disasterSeverity}
            onChange={(e) => handleConfigChange('disasterSeverity', parseFloat(e.target.value))}
            className="w-full accent-accent-red"
          />
        </div>
      </div>
    </div>
  );
}
