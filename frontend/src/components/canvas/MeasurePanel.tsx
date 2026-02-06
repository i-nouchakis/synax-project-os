import { useState } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawing.store';

export function MeasurePanel() {
  const activeTool = useDrawingStore((s) => s.activeTool);
  const calibration = useDrawingStore((s) => s.calibration);
  const setCalibration = useDrawingStore((s) => s.setCalibration);
  const measurements = useDrawingStore((s) => s.measurements);
  const clearMeasurements = useDrawingStore((s) => s.clearMeasurements);

  const [showCalibration, setShowCalibration] = useState(false);
  const [calValue, setCalValue] = useState('');
  const [calUnit, setCalUnit] = useState('m');

  if (activeTool !== 'measure') return null;

  const handleCalibrate = () => {
    // Use last measurement as calibration reference
    if (measurements.length === 0 || !calValue) return;
    const last = measurements[measurements.length - 1];
    const dx = last.endX - last.startX;
    const dy = last.endY - last.startY;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    const realValue = parseFloat(calValue);
    if (!isNaN(realValue) && realValue > 0 && pixelDist > 0) {
      setCalibration({ pixelsPerUnit: pixelDist / realValue, unit: calUnit });
      setShowCalibration(false);
      setCalValue('');
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-surface border border-surface-border rounded-lg shadow-sm text-body-sm">
      <span className="text-caption text-text-tertiary font-medium">
        Measure Tool
      </span>

      <div className="w-px h-5 bg-surface-border" />

      {/* Calibration status */}
      {calibration ? (
        <span className="text-caption text-success">
          Calibrated: 1 {calibration.unit} = {Math.round(calibration.pixelsPerUnit)} px
        </span>
      ) : (
        <span className="text-caption text-warning">Not calibrated (showing pixels)</span>
      )}

      <div className="w-px h-5 bg-surface-border" />

      {/* Calibrate button */}
      <button
        onClick={() => setShowCalibration(!showCalibration)}
        title="Calibrate scale"
        className="flex items-center gap-1 px-2 py-1 rounded text-caption text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
      >
        <Settings size={13} />
        Calibrate
      </button>

      {/* Calibration input */}
      {showCalibration && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-caption text-text-tertiary">
              {measurements.length > 0 ? 'Last line =' : 'Draw a line first'}
            </span>
            {measurements.length > 0 && (
              <>
                <input
                  type="number"
                  value={calValue}
                  onChange={(e) => setCalValue(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-16 h-7 bg-background border border-surface-border rounded text-caption text-text-primary px-1.5"
                  min="0"
                  step="0.1"
                />
                <select
                  value={calUnit}
                  onChange={(e) => setCalUnit(e.target.value)}
                  className="h-7 bg-background border border-surface-border rounded text-caption text-text-primary px-1"
                >
                  <option value="m">meters</option>
                  <option value="cm">cm</option>
                  <option value="ft">feet</option>
                  <option value="in">inches</option>
                </select>
                <button
                  onClick={handleCalibrate}
                  className="px-2 py-1 bg-primary text-white text-caption rounded hover:bg-primary-600 transition-colors"
                >
                  Set
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Clear calibration */}
      {calibration && (
        <button
          onClick={() => setCalibration(null)}
          title="Clear calibration"
          className="text-caption text-text-tertiary hover:text-error transition-colors"
        >
          Reset
        </button>
      )}

      <div className="w-px h-5 bg-surface-border" />

      {/* Measurement count + clear */}
      <span className="text-caption text-text-tertiary">
        {measurements.length} measurement{measurements.length !== 1 ? 's' : ''}
      </span>
      {measurements.length > 0 && (
        <button
          onClick={clearMeasurements}
          title="Clear all measurements"
          className="p-1 rounded text-text-tertiary hover:text-error transition-colors"
        >
          <Trash2 size={13} />
        </button>
      )}

      <span className="text-caption text-text-tertiary ml-1">
        Click on a line to remove it
      </span>
    </div>
  );
}
