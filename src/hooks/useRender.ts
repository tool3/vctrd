import { useEffect, useState } from 'react';
import { renderInWorker } from '@/lib/renderClient';
import { useRenderRequest } from '@/store';
import type { RenderOutput, RenderRequest, RenderResult } from '@/types';

interface RenderState {
  request: RenderRequest | null;
  result: RenderResult | null;
  lastGood: (RenderOutput & { ms: number }) | null;
  busy: boolean;
}

export interface RenderView {
  output: (RenderOutput & { ms: number }) | null;
  error: string | null;
  busy: boolean;
  empty: boolean;
}

const INITIAL: RenderState = { request: null, result: null, lastGood: null, busy: false };

export const useRender = (): RenderView => {
  const request = useRenderRequest();
  const [state, setState] = useState<RenderState>(INITIAL);
  const empty = request.source.trim().length === 0;

  useEffect(() => {
    if (state.busy || state.request === request || empty) return;
    setState((current) => ({ ...current, busy: true }));
    renderInWorker(request).then((result) =>
      setState((current) => ({
        request,
        result,
        lastGood: result.ok ? result : current.lastGood,
        busy: false,
      })),
    );
  }, [request, state.busy, state.request, empty]);

  return {
    output: empty ? null : state.lastGood,
    error: !empty && state.result && !state.result.ok ? state.result.error : null,
    busy: state.busy || (!empty && state.request !== request),
    empty,
  };
};
