import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Editor } from '@/components/features/Editor/Editor';
import { Preview } from '@/components/features/Preview/Preview';
import { Header } from '@/components/layout/Header/Header';
import { Toolbar } from '@/components/layout/Toolbar/Toolbar';
import { useContentBox } from '@/hooks/useContentBox';
import { useRender } from '@/hooks/useRender';
import { firstSvgFile, hasFiles, readSvgFile } from '@/lib/files';
import { useStore } from '@/store';
import styles from './App.module.scss';

export function App() {
  useContentBox();
  const render = useRender();
  const setSource = useStore((s) => s.setSource);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (files: FileList | null | undefined) => {
    const file = firstSvgFile(files);
    if (!file) return;
    const loaded = await readSvgFile(file);
    setSource(loaded.text, loaded.name);
  };

  const onDragOver = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    setDragging(true);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    load(event.dataTransfer.files);
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    load(event.target.files);
    event.target.value = '';
  };

  return (
    <div className={styles.app} onDragOver={onDragOver} onDrop={onDrop}>
      <Header />
      <main className={styles.main}>
        <div className={styles.editorPane}>
          <Editor />
        </div>
        <div className={styles.previewPane}>
          <Preview render={render} onUpload={() => fileRef.current?.click()} />
        </div>
      </main>
      <Toolbar render={render} />
      <input ref={fileRef} type="file" accept=".svg,image/svg+xml" hidden onChange={onPick} />
      {dragging && (
        <div className={styles.dropOverlay} onDragLeave={() => setDragging(false)}>
          <div className={styles.dropCard}>Drop an SVG to load it</div>
        </div>
      )}
    </div>
  );
}
