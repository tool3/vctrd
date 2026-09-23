import { useEffect, useState } from 'react';

export const useObjectUrl = (content: string | null, type = 'image/svg+xml'): string | null => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (content === null) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(new Blob([content], { type }));
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [content, type]);

  return url;
};
