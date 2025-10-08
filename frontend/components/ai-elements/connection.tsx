'use client';

import { ConnectionLineComponentProps, getSmoothStepPath } from '@xyflow/react';

export function Connection({
  fromX,
  fromY,
  toX,
  toY,
}: ConnectionLineComponentProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        d={edgePath}
        strokeDasharray="5,5"
      />
    </g>
  );
}

