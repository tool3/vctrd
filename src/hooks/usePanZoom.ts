import { useCallback, useEffect, useRef, useState } from 'react';

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface Point {
  x: number;
  y: number;
}

interface Pinch {
  distance: number;
  center: Point;
  base: Transform;
}

interface Options {
  minScale?: number;
  maxScale?: number;
  margin?: number;
}

const IDENTITY: Transform = { x: 0, y: 0, scale: 1 };

export const toCss = ({ x, y, scale }: Transform): string => `translate(${x}px, ${y}px) scale(${scale})`;

const distanceOf = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const zoomAround = (from: Transform, point: Point, scale: number): Transform => ({
  x: point.x - (scale / from.scale) * (point.x - from.x),
  y: point.y - (scale / from.scale) * (point.y - from.y),
  scale,
});

const isIgnored = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest('[data-pan-ignore]') !== null;

export function usePanZoom({ minScale = 0.1, maxScale = 8, margin = 48 }: Options = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const [isPanning, setIsPanning] = useState(false);
  const live = useRef<Transform>(IDENTITY);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<Pinch | null>(null);

  const clampScale = useCallback((scale: number) => Math.min(maxScale, Math.max(minScale, scale)), [minScale, maxScale]);

  const paint = useCallback((next: Transform) => {
    live.current = next;
    if (contentRef.current) contentRef.current.style.transform = toCss(next);
  }, []);

  const commit = useCallback(
    (next: Transform) => {
      paint(next);
      setTransform(next);
    },
    [paint],
  );

  const relative = useCallback((clientX: number, clientY: number): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    return rect ? { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 } : { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      if (isIgnored(event.target)) return;
      event.preventDefault();
      const current = live.current;
      if (event.ctrlKey || event.metaKey) {
        const scale = clampScale(current.scale * Math.exp(-event.deltaY * 0.01));
        commit(zoomAround(current, relative(event.clientX, event.clientY), scale));
        return;
      }
      commit({ ...current, x: current.x - event.deltaX, y: current.y - event.deltaY });
    };

    const onPointerDown = (event: PointerEvent) => {
      if (isIgnored(event.target) || (event.pointerType === 'mouse' && event.button !== 0)) return;
      container.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const [a, b] = [...pointers.current.values()];
      const center = a && b ? midpoint(a, b) : null;
      pinch.current =
        a && b && center ? { distance: distanceOf(a, b), center: relative(center.x, center.y), base: live.current } : null;
      setIsPanning(true);
    };

    const onPointerMove = (event: PointerEvent) => {
      const previous = pointers.current.get(event.pointerId);
      if (!previous) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const [a, b] = [...pointers.current.values()];
      const gesture = pinch.current;
      if (gesture && a && b) {
        const center = midpoint(a, b);
        const point = relative(center.x, center.y);
        const scale = clampScale(gesture.base.scale * (distanceOf(a, b) / gesture.distance));
        const zoomed = zoomAround(gesture.base, gesture.center, scale);
        paint({ ...zoomed, x: zoomed.x + point.x - gesture.center.x, y: zoomed.y + point.y - gesture.center.y });
        return;
      }
      const current = live.current;
      paint({ ...current, x: current.x + event.clientX - previous.x, y: current.y + event.clientY - previous.y });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!pointers.current.delete(event.pointerId)) return;
      pinch.current = null;
      if (pointers.current.size > 0) return;
      setIsPanning(false);
      commit(live.current);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
    };
  }, [clampScale, commit, paint, relative]);

  const zoomTo = useCallback(
    (scale: number) => commit(zoomAround(live.current, { x: 0, y: 0 }, clampScale(scale))),
    [clampScale, commit],
  );

  const fit = useCallback(
    (size: { width: number; height: number }) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || size.width <= 0 || size.height <= 0) return;
      const available = { width: Math.max(1, rect.width - margin * 2), height: Math.max(1, rect.height - margin * 2) };
      commit({ x: 0, y: 0, scale: clampScale(Math.min(available.width / size.width, available.height / size.height, 4)) });
    },
    [clampScale, commit, margin],
  );

  return {
    containerRef,
    contentRef,
    transform,
    isPanning,
    zoomTo,
    zoomIn: () => zoomTo(live.current.scale * 1.25),
    zoomOut: () => zoomTo(live.current.scale / 1.25),
    fit,
  };
}
