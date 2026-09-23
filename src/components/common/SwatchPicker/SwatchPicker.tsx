import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { hexToHsv, hsvToHex, normalizeHex, parseHex, type Hsv } from '@/lib/color';
import styles from './SwatchPicker.module.scss';

interface SwatchPickerProps {
  value: string;
  onChange: (hex: string) => void;
  size?: number;
  presets?: readonly string[];
  ariaLabel?: string;
  className?: string;
}

const POPOVER = { width: 236, height: 250, gap: 8, edge: 8 };

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

const placeBelowOrAbove = (rect: DOMRect): { left: number; top: number } => ({
  left: Math.max(POPOVER.edge, Math.min(rect.left, window.innerWidth - POPOVER.width - POPOVER.edge)),
  top:
    rect.bottom + POPOVER.gap + POPOVER.height > window.innerHeight - POPOVER.edge
      ? Math.max(POPOVER.edge, rect.top - POPOVER.height - POPOVER.gap)
      : rect.bottom + POPOVER.gap,
});

function Panel({ value, onChange, presets }: { value: string; onChange: (hex: string) => void; presets?: readonly string[] }) {
  const hex = normalizeHex(value);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(hex));
  const [draft, setDraft] = useState<string | null>(null);
  const shown = hsvToHex(hsv) === hex ? hsv : hexToHsv(hex);

  const commit = (next: Hsv) => {
    setHsv(next);
    onChange(hsvToHex(next));
  };

  const trackPad = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    commit({ h: shown.h, s: clamp01((event.clientX - rect.left) / rect.width), v: 1 - clamp01((event.clientY - rect.top) / rect.height) });
  };

  return (
    <>
      <div
        className={styles.pad}
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${hsvToHex({ h: shown.h, s: 1, v: 1 })}` }}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          trackPad(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) trackPad(event);
        }}
      >
        <span className={styles.thumb} style={{ left: `${shown.s * 100}%`, top: `${(1 - shown.v) * 100}%`, background: hex }} />
      </div>
      <input
        type="range"
        min={0}
        max={360}
        step={1}
        value={Math.round(shown.h)}
        onChange={(event) => commit({ ...shown, h: Number(event.target.value) })}
        className={styles.hue}
        aria-label="Hue"
      />
      <div className={styles.row}>
        <span className={styles.preview} style={{ background: hex }} aria-hidden />
        <input
          type="text"
          className={styles.hex}
          value={draft ?? hex}
          spellCheck={false}
          autoComplete="off"
          aria-label="Hex colour"
          onChange={(event) => {
            const parsed = parseHex(event.target.value);
            setDraft(event.target.value);
            if (parsed) {
              setHsv(hexToHsv(parsed));
              onChange(parsed);
            }
          }}
          onBlur={() => setDraft(null)}
        />
      </div>
      {presets && presets.length > 0 && (
        <div className={styles.presets}>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`${styles.preset} ${preset === hex ? styles.presetActive : ''}`}
              style={{ background: preset }}
              onClick={() => {
                setHsv(hexToHsv(preset));
                onChange(preset);
              }}
              aria-label={`Use ${preset}`}
              title={preset}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function SwatchPicker({ value, onChange, size = 24, presets, ariaLabel = 'Pick a colour', className = '' }: SwatchPickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const open = position !== null;

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPosition(placeBelowOrAbove(rect));
    };
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setPosition(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setPosition(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${className}`}
        style={{ background: normalizeHex(value), width: size, height: size }}
        onClick={(event) => setPosition(open ? null : placeBelowOrAbove(event.currentTarget.getBoundingClientRect()))}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={ariaLabel}
      />
      {position &&
        createPortal(
          <div ref={popoverRef} data-popover-portal className={styles.popover} style={position} role="dialog" aria-label={ariaLabel}>
            <Panel value={value} onChange={onChange} presets={presets} />
          </div>,
          document.body,
        )}
    </>
  );
}
