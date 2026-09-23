import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { decodeSvg } from './export';
import { frameAt, type Timeline } from './timeline';

export interface VideoOptions {
  width: number;
  height: number;
  fps: number;
  duration: number;
  scale: number;
  matte: string;
  signal: AbortSignal;
  onProgress: (done: number, total: number) => void;
}

export const isVideoExportSupported = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.VideoEncoder === 'function' &&
  typeof window.VideoFrame === 'function' &&
  typeof OffscreenCanvas === 'function';

const AVC_CANDIDATES = ['avc1.42002a', 'avc1.4d0033', 'avc1.640034', 'avc1.64003c'] as const;

const even = (value: number): number => {
  const rounded = Math.max(2, Math.round(value));
  return rounded + (rounded % 2);
};

const bitrateFor = (width: number, height: number, fps: number): number =>
  Math.max(1_000_000, Math.round(width * height * fps * 0.2));

const supportedCodec = async (config: Omit<VideoEncoderConfig, 'codec'>): Promise<string | null> =>
  AVC_CANDIDATES.reduce<Promise<string | null>>(async (found, codec) => {
    const previous = await found;
    if (previous) return previous;
    try {
      const support = await VideoEncoder.isConfigSupported({ ...config, codec });
      return support.supported ? codec : null;
    } catch {
      return null;
    }
  }, Promise.resolve(null));

interface Plan {
  codec: string;
  width: number;
  height: number;
  bitrate: number;
}

const planEncode = async (options: VideoOptions): Promise<Plan> => {
  const scales = [...new Set([options.scale, 2, 1])].filter((s) => s <= options.scale).sort((a, b) => b - a);
  const plan = await scales.reduce<Promise<Plan | null>>(async (found, scale) => {
    const previous = await found;
    if (previous) return previous;
    const width = even(options.width * scale);
    const height = even(options.height * scale);
    const bitrate = bitrateFor(width, height, options.fps);
    const codec = await supportedCodec({ width, height, bitrate, framerate: options.fps });
    return codec ? { codec, width, height, bitrate } : null;
  }, Promise.resolve(null));
  if (!plan) throw new Error(`This browser's video encoder can't handle a ${even(options.width)}×${even(options.height)} frame.`);
  return plan;
};

const throwIfAborted = (signal: AbortSignal): void => {
  if (signal.aborted) throw new DOMException('Export cancelled', 'AbortError');
};

export const encodeMp4 = async (timeline: Timeline, options: VideoOptions): Promise<Blob> => {
  if (!isVideoExportSupported()) throw new Error('MP4 export needs WebCodecs, which this browser does not have.');
  const plan = await planEncode(options);
  const total = Math.max(1, Math.round(options.duration * options.fps));
  const microsPerFrame = 1_000_000 / options.fps;
  const canvas = new OffscreenCanvas(plan.width, plan.height);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Could not get a canvas to encode with.');

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: plan.width, height: plan.height, frameRate: options.fps },
    fastStart: 'in-memory',
  });
  const failure = new AbortController();
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => failure.abort(error),
  });
  encoder.configure({ codec: plan.codec, width: plan.width, height: plan.height, bitrate: plan.bitrate, framerate: options.fps });

  const encodeFrame = async (index: number): Promise<void> => {
    throwIfAborted(options.signal);
    if (failure.signal.aborted) throw failure.signal.reason;
    const image = await decodeSvg(frameAt(timeline, index / options.fps));
    context.fillStyle = options.matte;
    context.fillRect(0, 0, plan.width, plan.height);
    context.drawImage(image, 0, 0, plan.width, plan.height);
    const frame = new VideoFrame(canvas, { timestamp: Math.round(index * microsPerFrame), duration: Math.round(microsPerFrame) });
    encoder.encode(frame, { keyFrame: index % (options.fps * 2) === 0 });
    frame.close();
    options.onProgress(index + 1, total);
    if (encoder.encodeQueueSize > 8) await encoder.flush();
  };

  try {
    await Array.from({ length: total }, (_, index) => index).reduce<Promise<void>>(
      (previous, index) => previous.then(() => encodeFrame(index)),
      Promise.resolve(),
    );
    await encoder.flush();
    if (failure.signal.aborted) throw failure.signal.reason;
    muxer.finalize();
    return new Blob([target.buffer], { type: 'video/mp4' });
  } finally {
    if (encoder.state !== 'closed') encoder.close();
  }
};
