import { TrendingUp, Clock, Users, CheckCircle } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export default function MetricsPanel() {
  const { metrics } = useSimulationStore();

  const metricItems = [
    {
      label: 'Tasks Completed',
      value: metrics.tasksCompleted,
      icon: CheckCircle,
      color: 'text-accent-green',
    },
    {
      label: 'Tasks Assigned',
      value: metrics.tasksAssigned,
      icon: TrendingUp,
      color: 'text-accent-blue',
    },
    {
      label: 'Tasks Pending',
      value: metrics.tasksPending,
      icon: Clock,
      color: 'text-accent-yellow',
    },
    {
      label: 'Staff Utilization',
      value: `${(metrics.staffUtilization * 100).toFixed(0)}%`,
      icon: Users,
      color: 'text-accent-purple',
    },
  ];

  return (
    <div className="bg-dark-surface rounded-lg border border-dark-border p-4">
      <h2 className="text-lg font-bold text-white mb-4">Metrics</h2>

      <div className="grid grid-cols-4 gap-4">
        {metricItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-dark-bg rounded p-4 border border-dark-border hover:border-accent-blue/50 transition"
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-xs text-gray-400">{item.label}</span>
            </div>
            <div className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {metrics.averageResponseTime > 0 && (
        <div className="mt-4 text-sm text-gray-400">
          Avg Response Time: <span className="text-accent-blue font-mono">{metrics.averageResponseTime.toFixed(1)}</span> min
        </div>
      )}
    </div>
  );
}
