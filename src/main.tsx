import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@/styles/main.scss';
import { App } from './App';
import { applyAccent } from '@/lib/accent';
import { useStore } from '@/store';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

registerSW({ immediate: true });

applyAccent(useStore.getState().accent);
useStore.subscribe((state, previous) => {
  if (state.accent !== previous.accent) applyAccent(state.accent);
});

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
