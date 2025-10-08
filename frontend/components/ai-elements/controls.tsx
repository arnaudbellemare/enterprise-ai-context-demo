'use client';

import { Controls as ReactFlowControls } from '@xyflow/react';

export function Controls() {
  return (
    <ReactFlowControls
      className="!bg-card !border !border-border !shadow-lg"
      showZoom
      showFitView
      showInteractive={false}
    />
  );
}

