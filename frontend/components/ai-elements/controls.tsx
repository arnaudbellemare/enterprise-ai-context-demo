'use client';

import { Controls as ReactFlowControls } from '@xyflow/react';

export function Controls() {
  return (
    <ReactFlowControls
      className="!bg-card !border !border-border !shadow-lg [&_button]:!text-black [&_button]:!fill-black [&_button_svg]:!fill-black [&_button_svg]:!stroke-black"
      showZoom
      showFitView
      showInteractive={false}
    />
  );
}

