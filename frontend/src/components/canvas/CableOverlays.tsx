import { useEffect, useState } from 'react';
import type Konva from 'konva';
import { useDrawingStore } from '@/stores/drawing.store';
import { CABLE_TYPE_COLORS, type CableType } from '@/services/drawing.service';

const CABLE_TYPES: { value: CableType; label: string }[] = [
  { value: 'ETHERNET', label: 'Ethernet' },
  { value: 'FIBER', label: 'Fiber' },
  { value: 'POWER', label: 'Power' },
  { value: 'COAXIAL', label: 'Coaxial' },
  { value: 'HDMI', label: 'HDMI' },
  { value: 'USB', label: 'USB' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'OTHER', label: 'Other' },
];

interface CableOverlaysProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  assetPinCount: number;
}

export function CableOverlays({ stageRef, assetPinCount }: CableOverlaysProps) {
  const activeTool = useDrawingStore((s) => s.activeTool);
  const cablePhase = useDrawingStore((s) => s.cablePhase);
  const pendingCable = useDrawingStore((s) => s.pendingCable);

  if (activeTool !== 'cable') return null;

  return (
    <>
      {/* Cable type popup */}
      {cablePhase === 'selecting_type' && pendingCable && (
        <CableTypePopup
          stageRef={stageRef}
          sourceX={pendingCable.sourceX}
          sourceY={pendingCable.sourceY}
          sourceName={pendingCable.sourceAssetName}
        />
      )}

      {/* Cable status bar */}
      {cablePhase === 'selecting_source' && (
        <CableStatusBar message={`Click on an asset pin to start a cable (${assetPinCount} available)`} />
      )}
      {cablePhase === 'selecting_type' && (
        <CableStatusBar message="Select cable type from the popup" />
      )}
      {cablePhase === 'selecting_target' && (
        <CableStatusBar message="Click on a target asset pin to complete the cable" />
      )}
    </>
  );
}

function CableStatusBar({ message }: { message: string }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-surface/95 backdrop-blur border border-primary/30 rounded-lg shadow-lg px-4 py-2 text-body-sm text-text-primary">
      <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
      {message}
    </div>
  );
}

function CableTypePopup({
  stageRef,
  sourceX,
  sourceY,
  sourceName,
}: {
  stageRef: React.RefObject<Konva.Stage | null>;
  sourceX: number;
  sourceY: number;
  sourceName: string;
}) {
  const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const transform = stage.getAbsoluteTransform();
    const pos = transform.point({ x: sourceX, y: sourceY });
    const container = stage.container().getBoundingClientRect();
    setScreenPos({
      x: container.left + pos.x + 20,
      y: container.top + pos.y - 10,
    });
  }, [stageRef, sourceX, sourceY]);

  const handleSelect = (cableType: CableType) => {
    const store = useDrawingStore.getState();
    if (!store.pendingCable) return;
    store.setPendingCable({ ...store.pendingCable, cableType });
    store.setCablePhase('selecting_target');
  };

  const handleCancel = () => {
    useDrawingStore.getState().setCablePhase('selecting_source');
    useDrawingStore.getState().setPendingCable(null);
  };

  if (!screenPos) return null;

  return (
    <>
    {/* Backdrop - click outside to cancel */}
    <div className="fixed inset-0 z-[99]" onClick={handleCancel} />
    <div
      className="fixed z-[100] bg-surface border border-surface-border rounded-lg shadow-xl p-2 min-w-[180px]"
      style={{ left: screenPos.x, top: screenPos.y }}
    >
      <div className="text-caption text-text-tertiary px-2 py-1 border-b border-surface-border mb-1">
        From: <span className="text-text-primary font-medium">{sourceName}</span>
      </div>
      <div className="text-caption text-text-secondary px-2 py-1 mb-1">Select cable type:</div>
      {CABLE_TYPES.map((ct) => (
        <button
          key={ct.value}
          onClick={() => handleSelect(ct.value)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-body-sm text-text-primary hover:bg-surface-hover rounded transition-colors"
        >
          <span
            className="w-3 h-3 rounded-full border border-black/10"
            style={{ backgroundColor: CABLE_TYPE_COLORS[ct.value] }}
          />
          {ct.label}
        </button>
      ))}
      <div className="border-t border-surface-border mt-1 pt-1">
        <button
          onClick={handleCancel}
          className="w-full text-caption text-text-tertiary hover:text-text-secondary px-2 py-1 rounded hover:bg-surface-hover transition-colors"
        >
          Cancel (Esc)
        </button>
      </div>
    </div>
    </>
  );
}
