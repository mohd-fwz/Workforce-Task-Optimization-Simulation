import { Activity, Wifi, WifiOff } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export default function Header() {
  const { isConnected, tick, isRunning } = useSimulationStore();

  return (
    <header className="bg-dark-surface border-b border-dark-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent-blue" />
            <h1 className="text-2xl font-bold text-white">
              Workforce Optimizer
            </h1>
          </div>
          <span className="text-sm text-gray-400">
            NGO Emergency Response Dashboard
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Tick counter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Tick:</span>
            <span className={`text-lg font-mono font-bold ${isRunning ? 'text-accent-green' : 'text-gray-400'}`}>
              {tick}
            </span>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-accent-green" />
                <span className="text-sm text-accent-green">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-accent-red" />
                <span className="text-sm text-accent-red">Disconnected</span>
              </>
            )}
          </div>

          {/* Running indicator */}
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent-green rounded-full pulse-glow" />
              <span className="text-sm text-accent-green">Running</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
