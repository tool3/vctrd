import { useState } from 'react';
import { copyBlob, fileNameFor, rasterize, saveBlob, svgBlob } from '@/lib/export';
import { renderInWorker } from '@/lib/renderClient';
import { reformat } from '@/lib/svg';
import { prepareTimeline } from '@/lib/timeline';
import { encodeMp4 } from '@/lib/video';
import { readRenderRequest, useStore } from '@/store';
import type { ExportSettings, RasterFormat, RenderOutput } from '@/types';

export type ExportStatus =
  | { kind: 'idle' }
  | { kind: 'working'; action: 'download' | 'copy'; progress: number | null; cancel: (() => void) | null }
  | { kind: 'done'; action: 'download' | 'copy'; message: string }
  | { kind: 'error'; message: string };

const freshRender = async (): Promise<RenderOutput> => {
  const result = await renderInWorker(readRenderRequest());
  if (!result.ok) throw new Error(result.error);
  return result;
};

const needsMatte = (format: ExportSettings['format']): boolean => format === 'jpeg' || format === 'mp4';

const matteFor = (settings: ExportSettings): string | null => {
  const { background } = useStore.getState();
  return needsMatte(settings.format) && background.type === 'none' ? settings.matte : null;
};

const rasterOf = (output: RenderOutput, settings: ExportSettings, format: RasterFormat): Promise<Blob> =>
  rasterize(output.after, {
    width: output.width,
    height: output.height,
    scale: settings.scale,
    format,
    quality: settings.quality,
    matte: matteFor(settings),
  });

const svgOf = (output: RenderOutput, settings: ExportSettings): string =>
  settings.minify ? reformat(output.after, 'minify') : output.after;

const describe = (error: unknown): string =>
  error instanceof DOMException && error.name === 'AbortError'
    ? 'Cancelled.'
    : error instanceof Error
      ? error.message
      : 'Export failed.';

export function useExport() {
  const [status, setStatus] = useState<ExportStatus>({ kind: 'idle' });

  const finish = (action: 'download' | 'copy', message: string) => {
    setStatus({ kind: 'done', action, message });
    setTimeout(() => setStatus((current) => (current.kind === 'done' ? { kind: 'idle' } : current)), 2400);
  };

  const fail = (error: unknown) => setStatus({ kind: 'error', message: describe(error) });

  const exportVideo = async (output: RenderOutput, settings: ExportSettings, filename: string) => {
    const controller = new AbortController();
    setStatus({ kind: 'working', action: 'download', progress: 0, cancel: () => controller.abort() });
    const timeline = prepareTimeline(output.after);
    if (!timeline.animated) throw new Error('Nothing in this SVG moves, so there is no video to make.');
    const blob = await encodeMp4(timeline, {
      width: output.width,
      height: output.height,
      fps: settings.fps,
      duration: settings.duration ?? timeline.duration,
      scale: Math.min(settings.scale, 2),
      matte: matteFor(settings) ?? '#000000',
      signal: controller.signal,
      onProgress: (done, total) =>
        setStatus((current) => (current.kind === 'working' ? { ...current, progress: done / total } : current)),
    });
    await saveBlob(blob, filename);
  };

  const download = async () => {
    const { exportSettings: settings, sourceName } = useStore.getState();
    const filename = fileNameFor(settings.filename || sourceName, settings.format);
    setStatus({ kind: 'working', action: 'download', progress: null, cancel: null });
    try {
      const output = await freshRender();
      if (settings.format === 'mp4') await exportVideo(output, settings, filename);
      else if (settings.format === 'svg') await saveBlob(svgBlob(svgOf(output, settings)), filename);
      else await saveBlob(await rasterOf(output, settings, settings.format), filename);
      finish('download', `Saved ${filename}`);
    } catch (error) {
      fail(error);
    }
  };

  const copy = async () => {
    const { exportSettings: settings } = useStore.getState();
    const asText = settings.format === 'svg';
    const output = freshRender();
    const blob = asText
      ? output.then((result) => new Blob([svgOf(result, settings)], { type: 'text/plain' }))
      : output.then((result) => rasterOf(result, { ...settings, format: 'png' }, 'png'));
    setStatus({ kind: 'working', action: 'copy', progress: null, cancel: null });
    try {
      await copyBlob(asText ? 'text/plain' : 'image/png', blob);
      finish('copy', asText ? 'SVG markup copied' : 'PNG copied');
    } catch (error) {
      fail(error);
    }
  };

  return { status, download, copy };
}
