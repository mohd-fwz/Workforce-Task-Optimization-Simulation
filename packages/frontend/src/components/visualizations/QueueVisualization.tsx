import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Task } from '@workforce/shared';

interface QueueVisualizationProps {
  data: string[];
  tasks: Task[];
}

export default function QueueVisualization({ data, tasks }: QueueVisualizationProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No tasks in queue
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Task Queue (FIFO)</h3>
        <p className="text-xs text-gray-600 mt-1">
          Tasks enter from right, exit from left
        </p>
      </div>

      <div className="relative">
        {/* Queue visualization */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          <div className="text-xs text-accent-green font-semibold whitespace-nowrap">
            OUT
          </div>

          <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" />

          <div className="flex gap-2 flex-1">
            <AnimatePresence mode="popLayout">
              {data.map((taskId, index) => {
                const task = tasks.find(t => t.id === taskId);

                return (
                  <motion.div
                    key={taskId}
                    initial={{ scale: 0, x: 100 }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{ scale: 0, x: -100 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="flex-shrink-0 w-20 h-20 bg-dark-bg border-2 border-accent-blue rounded-lg flex flex-col items-center justify-center relative hover:border-accent-purple transition"
                  >
                    <div className="absolute -top-2 -left-2 bg-accent-blue text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>

                    {task && (
                      <>
                        <div className="text-xs font-semibold text-gray-900 text-center px-1 truncate w-full">
                          {task.type}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          U: {task.urgency}
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" />

          <div className="text-xs text-accent-red font-semibold whitespace-nowrap">
            IN
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-dark-bg p-2 rounded">
            <span className="text-gray-600">Size:</span>{' '}
            <span className="text-accent-blue font-mono">{data.length}</span>
          </div>
          <div className="bg-dark-bg p-2 rounded">
            <span className="text-gray-600">Front:</span>{' '}
            <span className="text-accent-blue font-mono">{data[0]?.slice(0, 8) || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
