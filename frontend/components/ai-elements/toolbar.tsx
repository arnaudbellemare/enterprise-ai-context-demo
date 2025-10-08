'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  children: ReactNode;
  className?: string;
}

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div className={cn(
      "absolute -top-12 left-1/2 -translate-x-1/2",
      "bg-card border border-border rounded-lg shadow-lg",
      "p-1 flex gap-1",
      "opacity-0 group-hover:opacity-100 transition-opacity",
      className
    )}>
      {children}
    </div>
  );
}

