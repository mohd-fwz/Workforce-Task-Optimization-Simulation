import { useState } from 'react';
import { Database, List, Binary, Network } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import HeapVisualization from './visualizations/HeapVisualization';
import QueueVisualization from './visualizations/QueueVisualization';
import GraphVisualization from './visualizations/GraphVisualization';

type ViewType = 'heap' | 'queue' | 'graph' | 'data';

export default function DataStructureInspector() {
  const [activeView, setActiveView] = useState<ViewType>('heap');
  const { priorityQueue, taskQueue, graphNodes, graphEdges, tasks, staff } = useSimulationStore();

  const tabs = [
    { id: 'heap' as ViewType, label: 'Heap', icon: Binary, count: priorityQueue.length },
    { id: 'queue' as ViewType, label: 'Queue', icon: List, count: taskQueue.length },
    { id: 'graph' as ViewType, label: 'Graph', icon: Network, count: graphNodes.length },
    { id: 'data' as ViewType, label: 'Raw Data', icon: Database, count: null },
  ];

  return (
    <div className="flex-1 bg-dark-surface rounded-lg border border-dark-border shadow-sm flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-dark-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeView === tab.id
                ? 'bg-dark-bg text-accent-blue border-b-2 border-accent-blue'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className="bg-dark-bg text-gray-700 px-2 py-0.5 rounded text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeView === 'heap' && <HeapVisualization data={priorityQueue} />}
        {activeView === 'queue' && <QueueVisualization data={taskQueue} tasks={tasks} />}
        {activeView === 'graph' && <GraphVisualization nodes={graphNodes} edges={graphEdges} />}
        {activeView === 'data' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Priority Queue</h3>
              <pre className="bg-dark-bg p-3 rounded text-xs text-gray-700 overflow-auto max-h-40">
                {JSON.stringify(priorityQueue, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Task Queue</h3>
              <pre className="bg-dark-bg p-3 rounded text-xs text-gray-700 overflow-auto max-h-40">
                {JSON.stringify(taskQueue, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Staff HashMap</h3>
              <pre className="bg-dark-bg p-3 rounded text-xs text-gray-700 overflow-auto max-h-40">
                {JSON.stringify(
                  Object.fromEntries(staff.map(s => [s.id, s])),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
