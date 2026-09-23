import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Button, Select } from '@/components/common';
import { SAMPLES } from '@/constants/samples';
import { firstSvgFile, readSvgFile } from '@/lib/files';
import { formatBytes, reformat } from '@/lib/svg';
import { useStore } from '@/store';
import { CodeEditor } from './CodeEditor';
import styles from './Editor.module.scss';

const SAMPLE_OPTIONS = SAMPLES.map((sample) => ({ value: sample.id, label: sample.label }));

export function Editor() {
  const source = useStore((s) => s.source);
  const setSource = useStore((s) => s.setSource);
  const fileRef = useRef<HTMLInputElement>(null);
  const [formatError, setFormatError] = useState<string | null>(null);

  const currentSample = useMemo(() => SAMPLES.find((sample) => sample.svg === source)?.id ?? '', [source]);
  const size = useMemo(() => formatBytes(new Blob([source]).size), [source]);

  const loadSample = (id: string) => {
    const sample = SAMPLES.find((entry) => entry.id === id);
    if (sample) setSource(sample.svg, sample.id);
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = firstSvgFile(event.target.files);
    event.target.value = '';
    if (!file) return;
    const loaded = await readSvgFile(file);
    setSource(loaded.text, loaded.name);
  };

  const prettify = () => {
    try {
      setSource(reformat(source, 'pretty'));
      setFormatError(null);
    } catch (error) {
      setFormatError(error instanceof Error ? error.message : 'Could not format this SVG.');
    }
  };

  const edit = (next: string) => {
    setFormatError(null);
    setSource(next);
  };

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Select
            options={SAMPLE_OPTIONS}
            value={currentSample}
            onChange={loadSample}
            placeholder="Load sample…"
            aria-label="Load a sample SVG"
          />
          <Button variant="primary" icon="upload" size="sm" onClick={() => fileRef.current?.click()}>
            Upload
          </Button>
          <Button variant="ghost" icon="wand" size="sm" onClick={prettify} disabled={!source.trim()} aria-label="Format SVG">
            Format
          </Button>
          <Button variant="ghost" icon="trash" size="sm" onClick={() => edit('')} disabled={!source} aria-label="Clear editor">
            Clear
          </Button>
          <input ref={fileRef} type="file" accept=".svg,image/svg+xml" hidden onChange={upload} />
        </div>
        <div className={styles.toolbarRight}>
          {formatError ? <span className={styles.error}>{formatError}</span> : <span className={styles.meta}>{size}</span>}
        </div>
      </div>
      <CodeEditor value={source} onChange={edit} />
    </div>
  );
}
