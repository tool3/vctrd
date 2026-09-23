import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '@/components/common';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import { toCss, usePanZoom } from '@/hooks/usePanZoom';
import type { RenderView } from '@/hooks/useRender';
import { useStore } from '@/store';
import styles from './Preview.module.scss';

interface PreviewProps {
  render: RenderView;
  onUpload: () => void;
}

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

function CompareHandle({ stage }: { stage: React.RefObject<HTMLDivElement | null> }) {
  const position = useStore((s) => s.comparePosition);
  const setPosition = useStore((s) => s.setComparePosition);

  const track = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = stage.current?.getBoundingClientRect();
    if (rect && rect.width > 0) setPosition(clampPercent(((event.clientX - rect.left) / rect.width) * 100));
  };

  return (
    <div
      className={styles.divider}
      style={{ left: `${position}%` }}
      data-pan-ignore
      role="slider"
      aria-label="Compare original and processed"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') setPosition(clampPercent(position - 2));
        if (event.key === 'ArrowRight') setPosition(clampPercent(position + 2));
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        track(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) track(event);
      }}
    >
      <span className={styles.dividerLine} />
      <span className={styles.dividerKnob}>
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
          <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

export function Preview({ render, onUpload }: PreviewProps) {
  const compareMode = useStore((s) => s.compareMode);
  const setCompareMode = useStore((s) => s.setCompareMode);
  const position = useStore((s) => s.comparePosition);
  const { output, error, busy, empty } = render;
  const afterUrl = useObjectUrl(output?.after ?? null);
  const beforeUrl = useObjectUrl(compareMode ? (output?.before ?? null) : null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { containerRef, contentRef, transform, isPanning, zoomIn, zoomOut, zoomTo, fit } = usePanZoom();
  const width = output?.width ?? 0;
  const height = output?.height ?? 0;

  useEffect(() => {
    if (width > 0 && height > 0) fit({ width, height });
  }, [width, height, fit]);

  const stats = output ? `${Math.round(width)}×${Math.round(height)} · ${Math.max(1, Math.round(output.ms))}ms` : '';

  return (
    <div className={styles.preview}>
      <div className={styles.toolbar}>
        <div className={styles.titleGroup}>
          <span className={styles.title}>Preview</span>
          {stats && <span className={styles.stats}>{stats}</span>}
          {busy && <span className={styles.busy} aria-label="Rendering" />}
        </div>
        <div className={styles.controls}>
          <Button
            variant={compareMode ? 'primary' : 'ghost'}
            size="sm"
            icon="compare"
            onClick={() => setCompareMode(!compareMode)}
            aria-pressed={compareMode}
            disabled={!output}
          >
            <span className={styles.compareLabel}>Compare</span>
          </Button>
          <span className={styles.separator} />
          <Button variant="ghost" size="sm" icon="zoomOut" onClick={zoomOut} aria-label="Zoom out" />
          <button type="button" className={styles.zoomLevel} onClick={() => zoomTo(1)} title="Reset to 100%">
            {Math.round(transform.scale * 100)}%
          </button>
          <Button variant="ghost" size="sm" icon="zoomIn" onClick={zoomIn} aria-label="Zoom in" />
          <Button variant="ghost" size="sm" icon="fitView" onClick={() => fit({ width, height })} aria-label="Fit to view" />
        </div>
      </div>

      <div ref={containerRef} className={`${styles.canvas} ${isPanning ? styles.panning : ''}`}>
        {error && output && (
          <div className={styles.errorBanner} data-pan-ignore>
            <strong>Not rendered</strong>
            <span>{error}</span>
          </div>
        )}

        {empty && (
          <div className={styles.empty} data-pan-ignore>
            <p>Paste SVG markup into the editor, or drop an .svg file anywhere.</p>
            <Button variant="primary" icon="upload" onClick={onUpload}>
              Upload SVG
            </Button>
          </div>
        )}

        {!empty && !output && error && (
          <div className={styles.error}>
            <p>This SVG could not be rendered</p>
            <code>{error}</code>
          </div>
        )}

        {!empty && !output && !error && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Rendering…</p>
          </div>
        )}

        {output && afterUrl && (
          <div ref={contentRef} className={styles.transformer} style={{ transform: toCss(transform) }}>
            <div ref={stageRef} className={styles.stage} style={{ width, height }}>
              {compareMode && beforeUrl && <img className={styles.layer} src={beforeUrl} alt="Original artwork" draggable={false} />}
              <img
                className={styles.layer}
                src={afterUrl}
                alt="Processed artwork"
                draggable={false}
                style={compareMode ? { clipPath: `inset(0 0 0 ${position}%)` } : undefined}
              />
              {compareMode && (
                <>
                  <span className={`${styles.tag} ${styles.tagBefore}`}>Original</span>
                  <span className={`${styles.tag} ${styles.tagAfter}`}>vctrd</span>
                  <CompareHandle stage={stageRef} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
