import type { ExportFormat, RasterFormat } from '@/types';

const MIME: Record<RasterFormat, string> = {
  png: 'image/png',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
};

export const EXTENSION: Record<ExportFormat, string> = {
  svg: 'svg',
  png: 'png',
  webp: 'webp',
  jpeg: 'jpg',
  mp4: 'mp4',
};

const MAX_CANVAS_AREA = 16_777_216;

export interface RasterOptions {
  width: number;
  height: number;
  scale: number;
  format: RasterFormat;
  quality: number;
  matte: string | null;
}

export const svgBlob = (svg: string): Blob => new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });

export const decodeSvg = async (svg: string): Promise<HTMLImageElement> => {
  const url = URL.createObjectURL(svgBlob(svg));
  try {
    const image = new Image();
    image.decoding = 'sync';
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const safeScale = (width: number, height: number, scale: number): number =>
  Math.max(0.1, Math.min(scale, Math.sqrt(MAX_CANVAS_AREA / Math.max(1, width * height))));

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The browser could not encode this image.'))), type, quality),
  );

export const rasterize = async (svg: string, options: RasterOptions): Promise<Blob> => {
  const image = await decodeSvg(svg);
  const scale = safeScale(options.width, options.height, options.scale);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(options.width * scale));
  canvas.height = Math.max(1, Math.round(options.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get a canvas to draw on.');
  if (options.matte) {
    context.fillStyle = options.matte;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return toBlob(canvas, MIME[options.format], options.quality);
};

const isTouchDevice = (): boolean => window.matchMedia('(pointer: coarse)').matches;

const shareFile = async (blob: Blob, filename: string): Promise<boolean> => {
  const file = new File([blob], filename, { type: blob.type });
  if (!isTouchDevice() || !navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file] });
    return true;
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError';
  }
};

const downloadLink = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = Object.assign(document.createElement('a'), { href: url, download: filename, rel: 'noopener' });
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

export const saveBlob = async (blob: Blob, filename: string): Promise<void> => {
  if (await shareFile(blob, filename)) return;
  downloadLink(blob, filename);
};

export const copyBlob = (type: string, blob: Promise<Blob>): Promise<void> => {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    return Promise.reject(new Error('This browser cannot copy to the clipboard from here.'));
  }
  return navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
};

export const fileNameFor = (base: string, format: ExportFormat): string =>
  `${base.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'vctrd'}.${EXTENSION[format]}`;
