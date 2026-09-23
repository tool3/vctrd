import { memo, useMemo } from 'react';
import { Button, ColorPicker, Input, Select, Slider, Toggle } from '@/components/common';
import type { ExportStatus } from '@/hooks/useExport';
import type { RenderView } from '@/hooks/useRender';
import { EXTENSION, safeScale } from '@/lib/export';
import { prepareTimeline } from '@/lib/timeline';
import { isVideoExportSupported } from '@/lib/video';
import { useStore } from '@/store';
import type { ExportFormat, ExportScale, VideoFps } from '@/types';
import styles from './Settings.module.scss';

interface ExportSectionProps {
  render: RenderView;
  status: ExportStatus;
  onDownload: () => void;
  onCopy: () => void;
}

const videoSupported = isVideoExportSupported();

const FORMAT_OPTIONS: ReadonlyArray<{ value: ExportFormat; label: string }> = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'mp4', label: videoSupported ? 'MP4 video' : 'MP4 (not supported here)' },
];

const SCALE_OPTIONS = [1, 2, 3, 4].map((scale) => ({ value: String(scale), label: `${scale}×` }));
const VIDEO_SCALE_OPTIONS = SCALE_OPTIONS.slice(0, 2);
const FPS_OPTIONS = [24, 30, 60].map((fps) => ({ value: String(fps), label: `${fps} fps` }));

const loopOf = (svg: string | null): number => {
  if (!svg) return 0;
  try {
    return prepareTimeline(svg).duration;
  } catch {
    return 0;
  }
};

const statusText = (status: ExportStatus): string | null =>
  status.kind === 'done' || status.kind === 'error'
    ? status.message
    : status.kind === 'working' && status.progress !== null
      ? `Encoding… ${Math.round(status.progress * 100)}%`
      : null;

export const ExportSection = memo(function ExportSection({ render, status, onDownload, onCopy }: ExportSectionProps) {
  const settings = useStore((s) => s.exportSettings);
  const setSettings = useStore((s) => s.setExportSettings);
  const sourceName = useStore((s) => s.sourceName);
  const transparent = useStore((s) => s.background.type === 'none');
  const { output } = render;
  const isVideo = settings.format === 'mp4';
  const isRaster = settings.format !== 'svg' && !isVideo;
  const loop = useMemo(() => (isVideo ? loopOf(output?.after ?? null) : 0), [isVideo, output?.after]);
  const working = status.kind === 'working';
  const videoBlocked = isVideo && (!videoSupported || loop === 0);
  const scale = isVideo ? Math.min(settings.scale, 2) : settings.scale;
  const effectiveScale = output ? safeScale(output.width, output.height, scale) : scale;
  const pixels = output ? `${Math.round(output.width * effectiveScale)}×${Math.round(output.height * effectiveScale)}px` : '';
  const text = statusText(status);

  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <Select
          label="Format"
          options={FORMAT_OPTIONS}
          value={settings.format}
          onChange={(format) => setSettings({ format: format as ExportFormat })}
        />
        {(isRaster || isVideo) && (
          <Select
            label="Scale"
            options={isVideo ? VIDEO_SCALE_OPTIONS : SCALE_OPTIONS}
            value={String(scale)}
            onChange={(value) => setSettings({ scale: Number(value) as ExportScale })}
          />
        )}
      </div>

      <Input
        label="File name"
        value={settings.filename}
        placeholder={sourceName}
        onChange={(event) => setSettings({ filename: event.target.value })}
        fullWidth
        spellCheck={false}
        autoComplete="off"
      />

      {settings.format === 'svg' && (
        <Toggle checked={settings.minify} onChange={(minify) => setSettings({ minify })} label="Minify markup" />
      )}

      {settings.format === 'jpeg' && (
        <Slider
          label="Quality"
          value={settings.quality}
          onChange={(quality) => setSettings({ quality })}
          min={0.5}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      )}

      {isVideo && videoSupported && (
        <>
          <Select
            label="Frame rate"
            options={FPS_OPTIONS}
            value={String(settings.fps)}
            onChange={(fps) => setSettings({ fps: Number(fps) as VideoFps })}
            fullWidth
          />
          <Slider
            label="Length"
            value={settings.duration ?? 0}
            onChange={(duration) => setSettings({ duration: duration === 0 ? null : duration })}
            min={0}
            max={30}
            step={0.5}
            formatValue={(v) => (v === 0 ? `Auto · ${loop.toFixed(2)}s loop` : `${v}s`)}
          />
        </>
      )}

      {(settings.format === 'jpeg' || isVideo) && transparent && (
        <ColorPicker label="Matte behind transparency" value={settings.matte} onChange={(matte) => setSettings({ matte })} fullWidth />
      )}

      {isVideo && !videoSupported && (
        <p className={styles.hint}>MP4 export uses WebCodecs. Try a recent Chrome, Edge, Safari or Firefox.</p>
      )}
      {isVideo && videoSupported && loop === 0 && (
        <p className={styles.hint}>
          Nothing moves yet. Turn on Animate for an effect or a Look, pick a background animation, or load an animated SVG.
        </p>
      )}

      {pixels && (isRaster || isVideo) && (
        <p className={styles.hint}>
          {pixels} · .{EXTENSION[settings.format]}
        </p>
      )}

      {working && status.progress !== null && (
        <div className={styles.progress} role="progressbar" aria-valuenow={Math.round(status.progress * 100)}>
          <div className={styles.progressFill} style={{ width: `${status.progress * 100}%` }} />
        </div>
      )}

      <div className={styles.buttons}>
        {working && status.cancel ? (
          <Button variant="secondary" icon="x" onClick={status.cancel} fullWidth>
            Cancel
          </Button>
        ) : (
          <Button
            variant="primary"
            icon={status.kind === 'done' && status.action === 'download' ? 'check' : isVideo ? 'film' : 'download'}
            onClick={onDownload}
            disabled={!output || working || videoBlocked}
            isLoading={working && status.action === 'download'}
            fullWidth
          >
            Download
          </Button>
        )}
        {!isVideo && (
          <Button
            variant="ghost"
            icon={status.kind === 'done' && status.action === 'copy' ? 'check' : 'copy'}
            onClick={onCopy}
            disabled={!output || working}
            fullWidth
          >
            {settings.format === 'svg' ? 'Copy SVG' : 'Copy PNG'}
          </Button>
        )}
      </div>

      {text && <p className={`${styles.status} ${status.kind === 'error' ? styles.statusError : ''}`}>{text}</p>}
    </div>
  );
});
