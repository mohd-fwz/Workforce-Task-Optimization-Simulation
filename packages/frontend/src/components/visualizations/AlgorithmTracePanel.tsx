import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Pause, Play } from 'lucide-react';
import { AlgorithmTrace, DijkstraTrace, GraphNode } from '@workforce/shared';
import { useSimulationStore } from '../../store/useSimulationStore';

interface AlgorithmTracePanelProps {
  trace?: AlgorithmTrace;
  graphNodes: GraphNode[];
  expanded?: boolean;
  onExpand?: () => void;
}

const formatNumber = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
  return value.toFixed(digits);
};

const getDijkstraTrace = (trace?: AlgorithmTrace): DijkstraTrace | undefined => {
  const latestDecision = trace?.assignmentDecisions[trace.assignmentDecisions.length - 1];
  const selectedEvaluation = latestDecision?.evaluations.find(
    evaluation => evaluation.staffId === latestDecision.selectedStaffId
  );
  return selectedEvaluation?.pathTrace || trace?.latestDijkstraTrace;
};

export default function AlgorithmTracePanel({
  trace,
  graphNodes,
  expanded = false,
  onExpand,
}: AlgorithmTracePanelProps) {
  const { selectedDijkstraStepIndex, setSelectedDijkstraStepIndex } = useSimulationStore();
  const [isPlaying, setIsPlaying] = useState(false);

  const getNodeLabel = (nodeId: string) => {
    const node = graphNodes.find(item => item.id === nodeId);
    return node?.location.label || nodeId.replace(/^([a-z]+-).{8}.*/, '$1...');
  };

  const latestDecision = trace?.assignmentDecisions[trace.assignmentDecisions.length - 1];
  const dijkstraTrace = useMemo(() => getDijkstraTrace(trace), [trace]);
  const stepCount = dijkstraTrace?.steps.length ?? 0;
  const selectedIndex = stepCount > 0
    ? Math.min(selectedDijkstraStepIndex, stepCount - 1)
    : 0;
  const selectedStep = dijkstraTrace?.steps[selectedIndex];

  useEffect(() => {
    if (!isPlaying || stepCount === 0) return;

    const timer = window.setInterval(() => {
      setSelectedDijkstraStepIndex(
        selectedDijkstraStepIndex >= stepCount - 1 ? 0 : selectedDijkstraStepIndex + 1
      );
    }, 1100);

    return () => window.clearInterval(timer);
  }, [isPlaying, selectedDijkstraStepIndex, setSelectedDijkstraStepIndex, stepCount]);

  useEffect(() => {
    if (stepCount === 0) {
      setIsPlaying(false);
    }
  }, [stepCount]);

  const moveStep = (direction: number) => {
    if (stepCount === 0) return;
    setSelectedDijkstraStepIndex(Math.max(0, Math.min(stepCount - 1, selectedIndex + direction)));
  };

  if (!trace || trace.tick === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Step or resume the simulation to see algorithm reasoning
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={expanded ? 'text-lg font-semibold text-gray-900' : 'text-sm font-semibold text-gray-900'}>
            Algorithm Trace
          </h3>
        <p className="text-xs text-gray-600 mt-1">
          Tick {trace.tick}: FIFO queue, priority heap, staff scoring, and Dijkstra exploration
        </p>
        </div>
        {onExpand && (
          <button
            onClick={onExpand}
            className="bg-dark-bg hover:bg-gray-200 border border-dark-border text-gray-700 p-2 rounded transition"
            title="Open expanded algorithm analysis"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <section className="bg-dark-bg border border-dark-border rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">Priority Calculations</h4>
          <span className="text-xs text-gray-500">{trace.priorityCalculations.length} recalculated</span>
        </div>
        <div className={`space-y-2 overflow-auto ${expanded ? 'max-h-80' : 'max-h-44'}`}>
          {trace.priorityCalculations.slice(0, expanded ? undefined : 6).map(priority => (
            <div key={`${priority.taskId}-${priority.heapKey}`} className="text-xs bg-dark-surface border border-dark-border rounded p-2">
              <div className="flex justify-between gap-2">
                <span className="font-semibold text-gray-800">{priority.taskType}</span>
                <span className="font-mono text-accent-blue">score {formatNumber(priority.priorityScore)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-gray-600">
                <span>Urgency: {formatNumber(priority.urgencyNormalized)}</span>
                <span>Weight: {formatNumber(priority.urgencyWeight)}</span>
                <span>Time: {formatNumber(priority.timeFactor)}</span>
                <span>Need: {formatNumber(priority.unmetNeed)}</span>
                <span>Severity: {formatNumber(priority.disasterSeverity)}</span>
                <span>Heap key: {formatNumber(priority.heapKey)}</span>
              </div>
              <p className="mt-2 text-gray-500">{priority.explanation}</p>
            </div>
          ))}
          {trace.priorityCalculations.length === 0 && (
            <div className="text-xs text-gray-500">No queued tasks were prioritized on this tick.</div>
          )}
        </div>
      </section>

      <section className="bg-dark-bg border border-dark-border rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">Assignment Decision</h4>
          {latestDecision && (
            <span className="text-xs font-mono text-accent-purple">
              priority {formatNumber(latestDecision.priorityScore)}
            </span>
          )}
        </div>

        {!latestDecision ? (
          <div className="text-xs text-gray-500">No assignment was attempted on this tick.</div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-gray-700">
              Task <span className="font-semibold">{latestDecision.taskType}</span>
              {latestDecision.selectedStaffName
                ? <> selected <span className="font-semibold text-accent-green">{latestDecision.selectedStaffName}</span></>
                : <> was not assigned</>}
              <div className="text-gray-500 mt-1">{latestDecision.selectedReason}</div>
            </div>

            <div className={`space-y-2 overflow-auto ${expanded ? 'max-h-96' : 'max-h-52'}`}>
              {latestDecision.evaluations.map(evaluation => (
                <div
                  key={evaluation.staffId}
                  className={`text-xs rounded border p-2 ${
                    evaluation.staffId === latestDecision.selectedStaffId
                      ? 'bg-accent-green/10 border-accent-green/40'
                      : 'bg-dark-surface border-dark-border'
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-gray-800">{evaluation.staffName}</span>
                    <span className={evaluation.eligible ? 'text-accent-blue' : 'text-accent-red'}>
                      {evaluation.eligible ? `score ${formatNumber(evaluation.combinedScore, 1)}` : 'rejected'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-gray-600">
                    <span>Skill {Math.round(evaluation.skillMatch * 100)}%</span>
                    <span>Distance {formatNumber(evaluation.distance)} km</span>
                    <span>Distance score {formatNumber(evaluation.distanceScore)}</span>
                  </div>
                  {evaluation.missingSkills.length > 0 && (
                    <div className="mt-1 text-gray-500">Missing: {evaluation.missingSkills.join(', ')}</div>
                  )}
                  <div className="mt-1 text-gray-500">{evaluation.explanation}</div>
                </div>
              ))}
              {latestDecision.evaluations.length === 0 && (
                <div className="text-xs text-gray-500">No candidate staff were available for scoring.</div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="bg-dark-bg border border-dark-border rounded p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Dijkstra Exploration</h4>
            {selectedStep && (
              <p className="text-xs text-gray-500 mt-1">
                Map synchronized to step {selectedIndex + 1}: exploring {getNodeLabel(selectedStep.currentNodeId)}
              </p>
            )}
          </div>
          {dijkstraTrace?.distance !== null && dijkstraTrace?.distance !== undefined && (
            <span className="text-xs font-mono text-accent-blue">{formatNumber(dijkstraTrace.distance)} km</span>
          )}
        </div>

        {!dijkstraTrace ? (
          <div className="text-xs text-gray-500">No pathfinding trace is available yet.</div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-gray-700">
              {getNodeLabel(dijkstraTrace.startNodeId)} to {getNodeLabel(dijkstraTrace.endNodeId)}
              <div className="mt-1 text-gray-500">
                Final path: {dijkstraTrace.finalPath.map(getNodeLabel).join(' -> ') || 'No path found'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => moveStep(-1)}
                disabled={selectedIndex === 0}
                className="bg-dark-surface border border-dark-border text-gray-700 disabled:opacity-40 p-2 rounded transition"
                title="Previous Dijkstra step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={stepCount === 0}
                className="bg-accent-blue hover:bg-blue-500 disabled:opacity-40 text-white px-3 py-2 rounded flex items-center gap-2 text-xs transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={() => moveStep(1)}
                disabled={selectedIndex >= stepCount - 1}
                className="bg-dark-surface border border-dark-border text-gray-700 disabled:opacity-40 p-2 rounded transition"
                title="Next Dijkstra step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0"
                max={Math.max(stepCount - 1, 0)}
                value={selectedIndex}
                onChange={(event) => setSelectedDijkstraStepIndex(parseInt(event.target.value))}
                className="flex-1 accent-accent-blue"
              />
              <span className="text-xs font-mono text-gray-600">
                {stepCount === 0 ? '0/0' : `${selectedIndex + 1}/${stepCount}`}
              </span>
            </div>

            {expanded && selectedStep && (
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-dark-surface border border-dark-border rounded p-3">
                  <div className="text-gray-500">Current Node</div>
                  <div className="font-semibold text-accent-purple mt-1">{getNodeLabel(selectedStep.currentNodeId)}</div>
                  <div className="font-mono text-gray-600 mt-1">{formatNumber(selectedStep.currentDistance)} km</div>
                </div>
                <div className="bg-dark-surface border border-dark-border rounded p-3">
                  <div className="text-gray-500">Visited</div>
                  <div className="font-semibold text-accent-green mt-1">{selectedStep.visitedNodeIds.length} nodes</div>
                </div>
                <div className="bg-dark-surface border border-dark-border rounded p-3">
                  <div className="text-gray-500">Frontier</div>
                  <div className="font-semibold text-accent-blue mt-1">{selectedStep.frontier.length} candidates</div>
                </div>
              </div>
            )}

            <div className={`space-y-2 overflow-auto ${expanded ? 'max-h-[34rem]' : 'max-h-64'}`}>
              {dijkstraTrace.steps.map((step, index) => (
                <button
                  key={step.step}
                  onClick={() => setSelectedDijkstraStepIndex(index)}
                  className={`w-full text-left text-xs rounded border p-2 transition ${
                    index === selectedIndex
                      ? 'bg-accent-blue/10 border-accent-blue/50'
                      : 'bg-dark-surface border-dark-border hover:border-accent-blue/30'
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-gray-800">
                      Step {step.step}: explore {getNodeLabel(step.currentNodeId)}
                    </span>
                    <span className="font-mono text-accent-blue">{formatNumber(step.currentDistance)} km</span>
                  </div>
                  <p className="mt-1 text-gray-500">{step.selectedReason}</p>

                  {step.candidateUpdates.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {step.candidateUpdates.map(update => (
                        <div key={`${step.step}-${update.neighborId}`} className={update.updated ? 'text-accent-green' : 'text-gray-500'}>
                          {getNodeLabel(update.neighborId)}: candidate {formatNumber(update.candidateDistance)} km
                          {update.updated ? ' updates distance' : ' kept existing distance'}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 text-gray-500">
                    Frontier: {step.frontier.slice(0, 4).map(item => `${getNodeLabel(item.nodeId)} ${formatNumber(item.distance)}`).join(', ') || 'empty'}
                  </div>
                  <div className="mt-1 text-gray-500">
                    Visited: {step.visitedNodeIds.map(getNodeLabel).join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
