import { useState } from 'react';
import { Database, List, Binary, Network, Cpu, X } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import HeapVisualization from './visualizations/HeapVisualization';
import QueueVisualization from './visualizations/QueueVisualization';
import GraphVisualization from './visualizations/GraphVisualization';
import AlgorithmTracePanel from './visualizations/AlgorithmTracePanel';

type ViewType = 'algorithm' | 'heap' | 'queue' | 'graph' | 'data';

export default function DataStructureInspector() {
  const [activeView, setActiveView] = useState<ViewType>('algorithm');
  const [showAlgorithmModal, setShowAlgorithmModal] = useState(false);
  const { priorityQueue, taskQueue, graphNodes, graphEdges, tasks, staff, algorithmTrace } = useSimulationStore();

  const tabs = [
    { id: 'algorithm' as ViewType, label: 'Algorithm', icon: Cpu, count: algorithmTrace?.assignmentDecisions.length ?? 0 },
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
        {activeView === 'algorithm' && (
          <AlgorithmTracePanel
            trace={algorithmTrace}
            graphNodes={graphNodes}
            onExpand={() => setShowAlgorithmModal(true)}
          />
        )}
        {activeView === 'heap' && <HeapVisualization data={priorityQueue} />}
        {activeView === 'queue' && <QueueVisualization data={taskQueue} tasks={tasks} />}
        {activeView === 'graph' && (
          <GraphVisualization
            nodes={graphNodes}
            edges={graphEdges}
            highlightedPath={algorithmTrace?.latestShortestPath?.path}
          />
        )}
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

      {showAlgorithmModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm p-6">
          <div className="h-full bg-dark-surface border border-dark-border rounded-lg shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-dark-border px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Expanded Algorithm Analysis</h2>
                <p className="text-sm text-gray-600">
                  Step through Dijkstra and compare the map highlights with each decision.
                </p>
              </div>
              <button
                onClick={() => setShowAlgorithmModal(false)}
                className="bg-dark-bg hover:bg-gray-200 border border-dark-border text-gray-700 p-2 rounded transition"
                title="Close expanded analysis"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <AlgorithmTracePanel
                trace={algorithmTrace}
                graphNodes={graphNodes}
                expanded
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
