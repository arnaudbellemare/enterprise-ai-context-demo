'use client';

import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';

export const Edge = {
  Animated: (props: EdgeProps) => {
    const [edgePath] = getSmoothStepPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      targetX: props.targetX,
      targetY: props.targetY,
    });

    return (
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={{
          stroke: 'hsl(var(--primary))',
          strokeWidth: 2,
          animation: 'dashdraw 0.5s linear infinite',
        }}
      />
    );
  },

  Temporary: (props: EdgeProps) => {
    const [edgePath] = getSmoothStepPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      targetX: props.targetX,
      targetY: props.targetY,
    });

    return (
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={{
          stroke: 'hsl(var(--muted-foreground))',
          strokeWidth: 2,
          strokeDasharray: '5, 5',
        }}
      />
    );
  },
};

