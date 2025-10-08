'use client';

import { BaseEdge, EdgeProps, getSmoothStepPath, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

export const Edge = {
  Animated: (props: EdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      sourcePosition: props.sourcePosition,
      targetX: props.targetX,
      targetY: props.targetY,
      targetPosition: props.targetPosition,
    });

    return (
      <>
        <BaseEdge
          id={props.id}
          path={edgePath}
          style={{
            stroke: '#3b82f6',
            strokeWidth: 3,
          }}
        />
        <path
          d={edgePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={3}
          strokeDasharray="5,5"
          className="animate-dash"
        />
        {/* Arrow marker */}
        <defs>
          <marker
            id={`arrow-${props.id}`}
            markerWidth="20"
            markerHeight="20"
            refX="18"
            refY="10"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,20 L20,10 z"
              fill="#3b82f6"
            />
          </marker>
        </defs>
      </>
    );
  },

  Temporary: (props: EdgeProps) => {
    const [edgePath] = getBezierPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      sourcePosition: props.sourcePosition,
      targetX: props.targetX,
      targetY: props.targetY,
      targetPosition: props.targetPosition,
    });

    return (
      <BaseEdge
        id={props.id}
        path={edgePath}
        style={{
          stroke: '#6b7280',
          strokeWidth: 2,
          strokeDasharray: '5, 5',
        }}
      />
    );
  },
};

