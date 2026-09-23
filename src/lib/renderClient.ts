import type { RenderRequest, RenderResult } from '@/types';

const worker = new Worker(new URL('../workers/render.worker.ts', import.meta.url), { type: 'module' });

export const renderInWorker = (request: RenderRequest): Promise<RenderResult> =>
  new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.addEventListener(
      'message',
      (event: MessageEvent<RenderResult>) => {
        resolve(event.data);
        channel.port1.close();
      },
      { once: true },
    );
    channel.port1.start();
    worker.postMessage(request, [channel.port2]);
  });
