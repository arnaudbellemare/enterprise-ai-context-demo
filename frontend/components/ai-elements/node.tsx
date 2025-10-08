'use client';

import { Handle, Position } from '@xyflow/react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NodeProps {
  children: ReactNode;
  handles?: {
    target?: boolean;
    source?: boolean;
  };
  className?: string;
}

export function Node({ children, handles = { target: true, source: true }, className }: NodeProps) {
  return (
    <div className={cn("bg-card border border-border rounded-lg shadow-lg min-w-[300px] relative", className)}>
      {handles.target && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-blue-500 !border-2 !border-white hover:!w-5 hover:!h-5 transition-all cursor-pointer"
          style={{ left: -8 }}
        />
      )}
      {children}
      {handles.source && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-green-500 !border-2 !border-white hover:!w-5 hover:!h-5 transition-all cursor-pointer"
          style={{ right: -8 }}
        />
      )}
    </div>
  );
}

export function NodeHeader({ children }: { children: ReactNode }) {
  return (
    <div className="p-4 border-b border-border">
      {children}
    </div>
  );
}

export function NodeTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-semibold text-lg">{children}</h3>
  );
}

export function NodeDescription({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground mt-1">{children}</p>
  );
}

export function NodeContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("p-4", className)}>
      {children}
    </div>
  );
}

export function NodeFooter({ children }: { children: ReactNode }) {
  return (
    <div className="p-4 border-t border-border bg-muted/50">
      {children}
    </div>
  );
}

