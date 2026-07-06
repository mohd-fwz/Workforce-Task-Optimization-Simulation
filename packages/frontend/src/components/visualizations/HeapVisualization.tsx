import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface HeapNode {
  taskId: string;
  priority: number;
}

interface HeapVisualizationProps {
  data: HeapNode[];
}

export default function HeapVisualization({ data }: HeapVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 400;

    // Calculate tree layout
    const levels = Math.floor(Math.log2(data.length)) + 1;
    const nodeRadius = 20;
    const levelHeight = height / (levels + 1);

    interface TreeNode {
      index: number;
      data: HeapNode;
      x: number;
      y: number;
      level: number;
    }

    const nodes: TreeNode[] = data.map((d, i) => {
      const level = Math.floor(Math.log2(i + 1));
      const positionInLevel = i - (Math.pow(2, level) - 1);
      const nodesInLevel = Math.pow(2, level);

      return {
        index: i,
        data: d,
        level,
        x: ((positionInLevel + 1) * width) / (nodesInLevel + 1),
        y: (level + 1) * levelHeight,
      };
    });

    // Draw edges
    const edges: { source: TreeNode; target: TreeNode }[] = [];
    nodes.forEach((node) => {
      const leftChildIndex = 2 * node.index + 1;
      const rightChildIndex = 2 * node.index + 2;

      if (leftChildIndex < nodes.length) {
        edges.push({ source: node, target: nodes[leftChildIndex] });
      }
      if (rightChildIndex < nodes.length) {
        edges.push({ source: node, target: nodes[rightChildIndex] });
      }
    });

    svg
      .selectAll('.edge')
      .data(edges)
      .enter()
      .append('line')
      .attr('class', 'edge')
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y)
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2);

    // Draw nodes
    const nodeGroups = svg
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`);

    nodeGroups
      .append('circle')
      .attr('r', nodeRadius)
      .attr('fill', (d, i) => (i === 0 ? '#6366f1' : '#3b82f6'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', (d, i) => (i === 0 ? 'drop-shadow(0 0 8px #6366f1)' : 'none'));

    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text((d) => Math.round(d.data.priority));

    // Add task ID tooltip
    nodeGroups.append('title').text((d) => `Task: ${d.data.taskId}\nPriority: ${d.data.priority.toFixed(2)}`);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No tasks in priority queue
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Priority Queue (Min Heap)</h3>
        <p className="text-xs text-gray-600 mt-1">
          Top node = highest priority (lowest value) • Purple = root
        </p>
      </div>
      <svg ref={svgRef} className="w-full" height="400" />
    </motion.div>
  );
}
