import { useEffect, useRef, useState } from 'react';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { xml } from '@codemirror/lang-xml';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder,
} from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';
import styles from './CodeEditor.module.scss';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholderText?: string;
}

const dropsFiles = (event: DragEvent): boolean => Array.from(event.dataTransfer?.types ?? []).includes('Files');

const createState = (doc: string, onChange: (value: string) => void, placeholderText: string): EditorState =>
  EditorState.create({
    doc,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(classHighlighter),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      xml(),
      placeholder(placeholderText),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap, ...foldKeymap, ...completionKeymap, indentWithTab]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChange(update.state.doc.toString());
      }),
      EditorView.domEventHandlers({
        drop: (event) => {
          if (!dropsFiles(event)) return false;
          event.preventDefault();
          return true;
        },
      }),
      EditorView.contentAttributes.of({ 'aria-label': 'SVG source', autocapitalize: 'off', autocorrect: 'off' }),
    ],
  });

export function CodeEditor({ value, onChange, placeholderText = 'Paste SVG markup here, or drop an .svg file…' }: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<EditorView | null>(null);

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;
    const created = new EditorView({ state: createState(value, onChange, placeholderText), parent });
    setView(created);
    return () => created.destroy();
  }, []);

  useEffect(() => {
    if (!view) return;
    const current = view.state.doc;
    if (current.length === value.length && current.toString() === value) return;
    view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [view, value]);

  return <div ref={hostRef} className={styles.host} />;
}
