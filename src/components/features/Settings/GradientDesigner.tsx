import { memo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, NumberSlider, SwatchPicker } from '@/components/common';
import {
  GRADIENT_PRESETS,
  createStop,
  distributeStops,
  fromPreset,
  gradientCss,
  reverseStops,
  sampleAt,
  sortedStops,
  stripCss,
} from '@/lib/gradient';
import type { GradientConfig, GradientKind, GradientStop } from '@/types';
import styles from './GradientDesigner.module.scss';
import settings from './Settings.module.scss';

interface GradientDesignerProps {
  value: GradientConfig;
  onChange: (next: GradientConfig) => void;
  aspect: number;
}

const KINDS: ReadonlyArray<{ value: GradientKind; label: string }> = [
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' },
  { value: 'conic', label: 'Conic' },
];

const SWATCHES = ['#ff69b4', '#7c2bff', '#45caff', '#3ddc97', '#ffbe0b', '#ff4d6d', '#ffffff', '#0e0e0e'];

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const round = (value: number, digits = 3): number => Number(value.toFixed(digits));

const relativePoint = (event: ReactPointerEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: clamp01((event.clientX - rect.left) / rect.width), y: clamp01((event.clientY - rect.top) / rect.height), rect };
};

const angleFrom = (event: ReactPointerEvent<HTMLElement>, center: { x: number; y: number }): number => {
  const { rect } = relativePoint(event);
  const dx = event.clientX - (rect.left + rect.width * center.x);
  const dy = event.clientY - (rect.top + rect.height * center.y);
  const degrees = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  return event.shiftKey ? (Math.round(degrees / 15) * 15) % 360 : Math.round(degrees);
};

const capture = (event: ReactPointerEvent<HTMLElement>): void => {
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
};

const dragging = (event: ReactPointerEvent<HTMLElement>): boolean => event.currentTarget.hasPointerCapture(event.pointerId);

function Canvas({ value, onChange, aspect }: GradientDesignerProps) {
  const movesCenter = value.kind !== 'linear';
  const handle = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (movesCenter) {
      const { x, y } = relativePoint(event);
      onChange({ ...value, center: { x: round(x), y: round(y) } });
      return;
    }
    onChange({ ...value, angle: angleFrom(event, { x: 0.5, y: 0.5 }) });
  };
  const radians = (value.angle * Math.PI) / 180;
  const guide = { x: 50 + Math.sin(radians) * 38, y: 50 - Math.cos(radians) * 38 };

  return (
    <div
      className={styles.canvas}
      style={{ aspectRatio: `${Math.min(2.2, Math.max(0.6, aspect))}` }}
      onPointerDown={(event) => {
        capture(event);
        handle(event);
      }}
      onPointerMove={(event) => {
        if (dragging(event)) handle(event);
      }}
      title={movesCenter ? 'Drag to move the centre' : 'Drag to aim the gradient. Hold Shift to snap.'}
    >
      <div className={styles.canvasFill} style={{ background: gradientCss(value) }} />
      {movesCenter ? (
        <span className={styles.centerDot} style={{ left: `${value.center.x * 100}%`, top: `${value.center.y * 100}%` }} />
      ) : (
        <svg className={styles.guide} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <line x1={100 - guide.x} y1={100 - guide.y} x2={guide.x} y2={guide.y} vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      {!movesCenter && <span className={styles.angleHandle} style={{ left: `${guide.x}%`, top: `${guide.y}%` }} />}
      <span className={styles.canvasBadge}>{value.kind === 'radial' ? 'centre' : `${value.angle}°`}</span>
    </div>
  );
}

function StopBar({
  value,
  selected,
  onSelect,
  onChange,
}: {
  value: GradientConfig;
  selected: string;
  onSelect: (id: string) => void;
  onChange: (next: GradientConfig) => void;
}) {
  const moveStop = (id: string, offset: number) =>
    onChange({ ...value, stops: value.stops.map((stop) => (stop.id === id ? { ...stop, offset: round(offset) } : stop)) });

  const addAt = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rail = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!rail) return;
    const x = clamp01((event.clientX - rail.left) / rail.width);
    const sample = sampleAt(value.stops, x);
    const stop = createStop(sample.color, x, sample.opacity);
    onChange({ ...value, stops: [...value.stops, stop] });
    onSelect(stop.id);
  };

  return (
    <div className={styles.stopBar}>
      <div className={styles.track} onPointerDown={addAt} title="Click to add a stop">
        <div className={styles.trackFill} style={{ background: stripCss(value) }} />
      </div>
      {value.stops.map((stop) => (
        <button
          key={stop.id}
          type="button"
          className={`${styles.stop} ${stop.id === selected ? styles.stopActive : ''}`}
          style={{ left: `${stop.offset * 100}%` }}
          aria-label={`Stop at ${Math.round(stop.offset * 100)}%`}
          onPointerDown={(event) => {
            capture(event);
            onSelect(stop.id);
          }}
          onPointerMove={(event) => {
            if (!dragging(event)) return;
            const track = event.currentTarget.parentElement?.getBoundingClientRect();
            if (track) moveStop(stop.id, clamp01((event.clientX - track.left) / track.width));
          }}
          onKeyDown={(event) => {
            const delta = event.key === 'ArrowLeft' ? -0.01 : event.key === 'ArrowRight' ? 0.01 : 0;
            if (delta) moveStop(stop.id, clamp01(stop.offset + delta));
          }}
        >
          <span className={styles.stopSwatch} style={{ background: stop.color, opacity: Math.max(0.35, stop.opacity) }} />
        </button>
      ))}
    </div>
  );
}

function StopEditor({ stop, removable, onUpdate, onRemove }: { stop: GradientStop; removable: boolean; onUpdate: (patch: Partial<GradientStop>) => void; onRemove: () => void }) {
  return (
    <div className={styles.editor}>
      <div className={styles.editorHead}>
        <SwatchPicker value={stop.color} onChange={(color) => onUpdate({ color })} presets={SWATCHES} size={32} ariaLabel="Stop colour" />
        <div className={styles.editorMeta}>
          <span className={styles.editorLabel}>Selected stop</span>
          <span className={styles.editorHex}>{stop.color}</span>
        </div>
        <Button variant="ghost" size="sm" icon="trash" onClick={onRemove} disabled={!removable} aria-label="Remove stop" />
      </div>
      <div className={settings.row}>
        <NumberSlider label="Position" value={Math.round(stop.offset * 100)} onChange={(v) => onUpdate({ offset: v / 100 })} min={0} max={100} suffix="%" />
        <NumberSlider label="Opacity" value={Math.round(stop.opacity * 100)} onChange={(v) => onUpdate({ opacity: v / 100 })} min={0} max={100} suffix="%" />
      </div>
    </div>
  );
}

export const GradientDesigner = memo(function GradientDesigner({ value, onChange, aspect }: GradientDesignerProps) {
  const [selectedId, setSelectedId] = useState<string>(() => value.stops[0]?.id ?? '');
  const selected = value.stops.find((stop) => stop.id === selectedId) ?? sortedStops(value.stops)[0];

  const updateStop = (patch: Partial<GradientStop>) => {
    if (selected) onChange({ ...value, stops: value.stops.map((stop) => (stop.id === selected.id ? { ...stop, ...patch } : stop)) });
  };

  const removeStop = () => {
    if (!selected || value.stops.length <= 2) return;
    const remaining = value.stops.filter((stop) => stop.id !== selected.id);
    onChange({ ...value, stops: remaining });
    setSelectedId(remaining[0]?.id ?? '');
  };

  return (
    <div className={styles.designer}>
      <Canvas value={value} onChange={onChange} aspect={aspect} />

      <div className={settings.segmented} role="group" aria-label="Gradient type">
        {KINDS.map((kind) => (
          <button
            key={kind.value}
            type="button"
            className={`${settings.segment} ${value.kind === kind.value ? settings.segmentActive : ''}`}
            onClick={() => onChange({ ...value, kind: kind.value })}
            aria-pressed={value.kind === kind.value}
          >
            {kind.label}
          </button>
        ))}
      </div>

      <StopBar value={value} selected={selected?.id ?? ''} onSelect={setSelectedId} onChange={onChange} />

      {selected && <StopEditor stop={selected} removable={value.stops.length > 2} onUpdate={updateStop} onRemove={removeStop} />}

      {value.kind !== 'radial' && (
        <NumberSlider label="Angle" value={value.angle} onChange={(angle) => onChange({ ...value, angle })} min={0} max={360} suffix="°" />
      )}

      <div className={styles.actions}>
        <Button variant="ghost" size="sm" icon="reset" onClick={() => onChange(reverseStops(value))}>
          Reverse
        </Button>
        <Button variant="ghost" size="sm" icon="padding" onClick={() => onChange(distributeStops(value))}>
          Distribute
        </Button>
        <span className={styles.stopCount}>{value.stops.length} stops</span>
      </div>

      <div className={styles.presets}>
        {GRADIENT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={styles.preset}
            style={{ background: gradientCss(fromPreset(preset, value)) }}
            onClick={() => {
              const next = fromPreset(preset, value);
              onChange(next);
              setSelectedId(next.stops[0]?.id ?? '');
            }}
            title={preset.label}
            aria-label={`${preset.label} gradient`}
          />
        ))}
      </div>
    </div>
  );
});
