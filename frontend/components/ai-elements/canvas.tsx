'use client';

import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ReactNode } from 'react';

interface CanvasProps {
  nodes: any[];
  edges: any[];
  nodeTypes?: any;
  edgeTypes?: any;
  connectionLineComponent?: any;
  fitView?: boolean;
  onNodesChange?: (changes: any) => void;
  onEdgesChange?: (changes: any) => void;
  onConnect?: (connection: any) => void;
  onNodeClick?: (event: any, node: any) => void;
  children?: ReactNode;
}

export function Canvas({
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  connectionLineComponent,
  fitView = true,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  children,
}: CanvasProps) {
  return (
    <ReactFlowProvider>
      <div className="w-full h-screen">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineComponent={connectionLineComponent}
          fitView={fitView}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          {children}
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}

