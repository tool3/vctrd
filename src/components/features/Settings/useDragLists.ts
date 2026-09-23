import { useState, type PointerEvent } from 'react';

interface DragState {
  list: string;
  from: number;
  over: number;
}

export interface DragLists {
  handleProps: (
    list: string,
    index: number,
  ) => {
    onPointerDown: (event: PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  };
  rowProps: (list: string, index: number) => { 'data-drag-list': string; 'data-drag-index': number };
  isDragging: (list: string, index: number) => boolean;
  isOver: (list: string, index: number) => boolean;
}

const indexUnder = (list: string, x: number, y: number): number | null => {
  const row = document.elementFromPoint(x, y)?.closest<HTMLElement>(`[data-drag-list="${CSS.escape(list)}"]`);
  const index = Number(row?.dataset.dragIndex);
  return row && Number.isInteger(index) ? index : null;
};

export const useDragLists = (onReorder: (list: string, from: number, to: number) => void): DragLists => {
  const [state, setState] = useState<DragState | null>(null);

  const finish = () => {
    if (state && state.from !== state.over) onReorder(state.list, state.from, state.over);
    setState(null);
  };

  return {
    handleProps: (list, index) => ({
      onPointerDown: (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        setState({ list, from: index, over: index });
      },
      onPointerMove: (event) => {
        if (!state || state.list !== list) return;
        const over = indexUnder(list, event.clientX, event.clientY);
        if (over !== null && over !== state.over) setState({ ...state, over });
      },
      onPointerUp: finish,
      onPointerCancel: () => setState(null),
    }),
    rowProps: (list, index) => ({ 'data-drag-list': list, 'data-drag-index': index }),
    isDragging: (list, index) => state?.list === list && state.from === index,
    isOver: (list, index) => state?.list === list && state.over === index && state.from !== index,
  };
};
