'use client';

import { BaseEdge, EdgeProps, getSmoothStepPath, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

export const Edge = {
  Animated: (props: EdgeProps & { isValid?: boolean }) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      sourcePosition: props.sourcePosition,
      targetX: props.targetX,
      targetY: props.targetY,
      targetPosition: props.targetPosition,
    });

    // Determine edge color based on validation status
    const edgeColor = props.isValid === false ? '#ef4444' : '#6b7280'; // Red if invalid, gray if valid
    const strokeWidth = props.isValid === false ? 4 : 3; // Thicker if invalid

    return (
      <>
        <BaseEdge
          id={props.id}
          path={edgePath}
          style={{
            stroke: edgeColor,
            strokeWidth: strokeWidth,
          }}
        />
        <path
          d={edgePath}
          fill="none"
          stroke={edgeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={props.isValid === false ? "8,4" : "5,5"}
          className={props.isValid === false ? "animate-dash-error" : "animate-dash"}
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
              fill={edgeColor}
            />
          </marker>
        </defs>
        {/* Error indicator for invalid edges */}
        {props.isValid === false && (
          <g>
            <circle cx={labelX} cy={labelY} r="8" fill="#ef4444" />
            <text x={labelX} y={labelY + 2} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">!</text>
          </g>
        )}
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

