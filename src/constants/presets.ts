import type { EffectName } from 'vctrfx';
import type { ControlValue } from '@/lib/effects';
import { createGradient } from '@/lib/gradient';
import type { BackgroundConfig, ShadowConfig } from '@/types';

export interface ScenePreset {
  id: string;
  name: string;
  description: string;
  previewBg: string;
  previewFg: string;
  background: Partial<BackgroundConfig>;
  padding: number;
  radius?: number;
  shadow?: Partial<ShadowConfig>;
  looks: ReadonlyArray<{ id: string; animate?: boolean }>;
  effects?: ReadonlyArray<{ id: EffectName; params: Record<string, ControlValue> }>;
}

export const SCENE_PRESETS: readonly ScenePreset[] = [
  {
    id: 'clean',
    name: 'Clean',
    description: 'Just the artwork. No background, no effects.',
    previewBg: 'repeating-conic-gradient(#1c1c1c 0% 25%, #121212 0% 50%) 50% / 12px 12px',
    previewFg: '#e7e5e4',
    background: { type: 'none' },
    padding: 0,
    looks: [],
  },
  {
    id: 'phosphor',
    name: 'Phosphor',
    description: 'Green-screen CRT with rolling scanlines.',
    previewBg: 'radial-gradient(circle at 50% 40%, #12351f, #030803)',
    previewFg: '#39ff88',
    background: { type: 'gradient', gradient: createGradient(['#0d2415', '#020502'], 'radial') },
    padding: 56,
    looks: [{ id: 'crt', animate: true }],
    effects: [{ id: 'tint', params: { color: '#39ff88', amount: 0.35 } }],
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    description: 'Neon glow on a hot gradient.',
    previewBg: 'linear-gradient(135deg, #FF1B6B, #45CAFF)',
    previewFg: '#ffffff',
    background: { type: 'gradient', gradient: createGradient(['#FF1B6B', '#45CAFF'], 'linear', 135) },
    padding: 64,
    shadow: { enabled: true, blur: 32, offsetY: 16, opacity: 0.35 },
    looks: [{ id: 'neon' }],
  },
  {
    id: 'vhs-night',
    name: 'VHS Night',
    description: 'Tape wobble over a dark grid.',
    previewBg: 'linear-gradient(#0b0b12, #16162a)',
    previewFg: '#ff5fa2',
    background: {
      type: 'pattern',
      patternType: 'grid',
      patternBaseType: 'solid',
      color: '#0b0b12',
      patternColor: 'rgba(255,255,255,0.07)',
      patternSize: 28,
      patternThickness: 1,
    },
    padding: 56,
    looks: [{ id: 'vhs', animate: true }],
  },
  {
    id: 'cyber',
    name: 'Cyber',
    description: 'Sliced, shifted, bloomed, scanned.',
    previewBg: 'linear-gradient(135deg, #0f0c29, #302b63 60%, #24243e)',
    previewFg: '#00f0ff',
    background: { type: 'gradient', gradient: createGradient(['#0f0c29', '#302b63', '#24243e'], 'linear', 180) },
    padding: 56,
    looks: [{ id: 'cyberpunk', animate: true }],
  },
  {
    id: 'film-still',
    name: 'Film Still',
    description: 'Halation and grain on a soft charcoal card.',
    previewBg: 'linear-gradient(135deg, #1e1e1e, #3b3b3b)',
    previewFg: '#f2e8d5',
    background: { type: 'gradient', gradient: createGradient(['#1e1e1e', '#3b3b3b'], 'linear', 135) },
    padding: 64,
    radius: 10,
    shadow: { enabled: true, blur: 40, offsetY: 20, opacity: 0.55 },
    looks: [{ id: 'film' }],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Drifting pastel light and a warm bloom.',
    previewBg: 'radial-gradient(circle at 30% 30%, #3a4a8c, #08080f 70%)',
    previewFg: '#d4a0f5',
    background: { type: 'solid', color: '#07070c', animation: 'aurora' },
    padding: 72,
    looks: [],
    effects: [
      { id: 'bloom', params: { radius: 10, threshold: 0.45, intensity: 1.2 } },
      { id: 'grain', params: { amount: 0.18 } },
    ],
  },
  {
    id: 'newsprint',
    name: 'Newsprint',
    description: 'Coarse halftone on off-white stock.',
    previewBg: '#f2ede2',
    previewFg: '#1c1c1c',
    background: { type: 'solid', color: '#f2ede2' },
    padding: 48,
    looks: [{ id: 'newsprint' }],
  },
  {
    id: 'riso',
    name: 'Riso Poster',
    description: 'Two-ink risograph on cream paper.',
    previewBg: 'linear-gradient(135deg, #f7f1e3 55%, #ff5a5f)',
    previewFg: '#2b3a67',
    background: {
      type: 'pattern',
      patternType: 'noise',
      patternBaseType: 'solid',
      color: '#f7f1e3',
      patternColor: 'rgba(43,58,103,0.35)',
      patternSize: 6,
      patternOpacity: 0.5,
    },
    padding: 56,
    looks: [{ id: 'riso' }],
  },
  {
    id: 'photocopy',
    name: 'Photocopy',
    description: 'Blown-out xerox on toner-dusted paper.',
    previewBg: '#f6f4ef',
    previewFg: '#101010',
    background: {
      type: 'pattern',
      patternType: 'noise',
      patternBaseType: 'solid',
      color: '#f6f4ef',
      patternColor: 'rgba(0,0,0,0.5)',
      patternSize: 3,
      patternOpacity: 0.25,
    },
    padding: 48,
    looks: [{ id: 'xerox' }],
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Two-tone line art on drafting paper.',
    previewBg: '#0d3b66',
    previewFg: '#e0f2ff',
    background: {
      type: 'pattern',
      patternType: 'grid',
      patternBaseType: 'solid',
      color: '#0d3b66',
      patternColor: 'rgba(224,242,255,0.18)',
      patternSize: 20,
      patternThickness: 1,
    },
    padding: 56,
    looks: [],
    effects: [{ id: 'threshold', params: { level: 0.5, dark: '#0d3b66', light: '#e0f2ff' } }],
  },
  {
    id: 'pop',
    name: 'Halftone Pop',
    description: 'Comic-book dots on a loud yellow.',
    previewBg: 'radial-gradient(#1b1b1b 20%, transparent 22%) 0 0 / 8px 8px, #ffd23f',
    previewFg: '#1b1b1b',
    background: { type: 'solid', color: '#ffd23f' },
    padding: 48,
    looks: [],
    effects: [{ id: 'halftone', params: { size: 5, levels: 5, color: '#1b1b1b', background: null, keepSource: true } }],
  },
];

export const findScenePreset = (id: string): ScenePreset | undefined => SCENE_PRESETS.find((preset) => preset.id === id);
