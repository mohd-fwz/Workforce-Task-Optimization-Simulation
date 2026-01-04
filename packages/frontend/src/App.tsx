import { useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import TaskPanel from './components/TaskPanel';
import StaffPanel from './components/StaffPanel';
import MapView from './components/MapView';
import DataStructureInspector from './components/DataStructureInspector';
import MetricsPanel from './components/MetricsPanel';

function App() {
  const socket = useSocket();

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-bg overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left sidebar - Task & Staff panels */}
        <div className="w-80 flex flex-col gap-4 overflow-hidden">
          <TaskPanel />
          <StaffPanel />
        </div>

        {/* Center - Map and visualizations */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
            <MapView />
          </div>

          {/* Metrics */}
          <MetricsPanel />
        </div>

        {/* Right sidebar - Data structure inspector & controls */}
        <div className="w-96 flex flex-col gap-4 overflow-hidden">
          <ControlPanel />
          <DataStructureInspector />
        </div>
      </div>
    </div>
  );
}

export default App;
