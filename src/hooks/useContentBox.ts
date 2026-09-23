import { useEffect } from 'react';
import { measureContentBox } from '@/lib/trim';
import { useStore } from '@/store';

const DELAY_MS = 250;

export const useContentBox = (): void => {
  const source = useStore((s) => s.source);
  const trim = useStore((s) => s.artwork.trim);
  const measuredFor = useStore((s) => s.measured?.source);
  const setMeasured = useStore((s) => s.setMeasured);

  useEffect(() => {
    if (!trim || measuredFor === source || !source.trim()) return;
    const timer = setTimeout(() => {
      measureContentBox(source)
        .catch(() => null)
        .then((box) => {
          if (useStore.getState().source === source) setMeasured({ source, box });
        });
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [source, trim, measuredFor, setMeasured]);
};
