import { safeRender } from '@/lib/pipeline';
import type { RenderRequest } from '@/types';

self.addEventListener('message', (event: MessageEvent<RenderRequest>) => {
  event.ports[0]?.postMessage(safeRender(event.data));
});
