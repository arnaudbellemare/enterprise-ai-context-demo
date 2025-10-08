'use client';

import { Panel as ReactFlowPanel, PanelPosition } from '@xyflow/react';
import { ReactNode } from 'react';

interface PanelProps {
  position?: PanelPosition;
  children: ReactNode;
  className?: string;
}

export function Panel({ position = 'top-left', children, className }: PanelProps) {
  return (
    <ReactFlowPanel position={position} className={className}>
      {children}
    </ReactFlowPanel>
  );
}

