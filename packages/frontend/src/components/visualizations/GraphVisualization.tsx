import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphEdge } from '@workforce/shared';

interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function GraphVisualization({ nodes, edges }: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 400;

    // Convert edges to D3 format (from/to -> source/target)
    const d3Edges = edges.map(edge => ({
      source: edge.from,
      target: edge.to,
      distance: edge.distance,
      travelTime: edge.travelTime
    }));

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        'link',
        d3
          .forceLink(d3Edges)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Draw edges with reduced clutter
    const link = svg
      .selectAll('.link')
      .data(d3Edges)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6);

    // Draw edge labels (show only for short distances to reduce clutter)
    const linkLabels = svg
      .selectAll('.link-label')
      .data(d3Edges.filter(d => d.distance < 15)) // Only show labels for distances < 15km
      .enter()
      .append('text')
      .attr('class', 'link-label')
      .attr('font-size', '9px')
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .attr('opacity', 0.6) // Slightly transparent
      .text((d) => `${d.distance.toFixed(1)}km`);

    // Draw nodes with cleaner styling
    const node = svg
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('r', 12) // Slightly smaller for less clutter
      .attr('fill', (d) => {
        switch (d.type) {
          case 'base':
            return '#10b981';
          case 'staff':
            return '#3b82f6';
          case 'site':
            return '#ef4444';
          default:
            return '#6b7280';
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))') // Add subtle shadow
      .call(
        d3.drag<any, any>()
          .on('start', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Add node labels with cleaner styling
    const nodeLabels = svg
      .selectAll('.node-label')
      .data(nodes)
      .enter()
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', 25)
      .attr('font-size', '9px')
      .attr('font-weight', '500')
      .attr('fill', '#334155')
      .style('text-shadow', '0 1px 2px rgba(255,255,255,0.8)')
      .text((d) => d.location.label || d.id.slice(0, 8));

    // Add tooltips
    node.append('title').text((d) => `${d.type}\n${d.location.label || d.id}`);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      nodeLabels.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No nodes in graph
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Location Graph</h3>
        <p className="text-xs text-gray-600 mt-1">
          Drag nodes to rearrange • Edge labels show distance
        </p>
      </div>

      <div className="flex gap-3 text-xs mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-accent-green" />
          <span className="text-gray-600">Base</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-accent-blue" />
          <span className="text-gray-600">Staff</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-accent-red" />
          <span className="text-gray-600">Task</span>
        </div>
      </div>

      <svg ref={svgRef} className="w-full bg-dark-bg rounded border border-dark-border" height="400" />
    </div>
  );
}
