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
  onConnectStart?: () => void;
  onConnectEnd?: () => void;
  onNodeClick?: (event: any, node: any) => void;
  onInit?: (instance: any) => void;
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
  onConnectStart,
  onConnectEnd,
  onNodeClick,
  onInit,
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
          minZoom={0.1}
          maxZoom={2.0}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeClick={onNodeClick}
          onInit={onInit}
          className="bg-white"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          {children}
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}

