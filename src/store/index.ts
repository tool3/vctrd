import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import {
  DEFAULT_ARTWORK,
  DEFAULT_BACKGROUND,
  DEFAULT_EXPORT,
  DEFAULT_PADDING,
  DEFAULT_PIPELINE,
} from '@/constants/defaults';
import { findScenePreset } from '@/constants/presets';
import { DEFAULT_SOURCE } from '@/constants/samples';
import { DEFAULT_ACCENT } from '@/lib/accent';
import { createGradient } from '@/lib/gradient';
import { expandLook, findLook, newEffectUid, sanitizeEffectStack, type EffectConfig } from '@/lib/effects';
import type {
  ArtworkConfig,
  BackgroundConfig,
  ExportSettings,
  PaddingTuple,
  PipelineSettings,
  ContentBox,
  RenderRequest,
  ShadowConfig,
} from '@/types';

export interface DocumentState {
  source: string;
  sourceName: string;
}

export interface SettingsState {
  effects: EffectConfig[];
  pipeline: PipelineSettings;
  background: BackgroundConfig;
  padding: PaddingTuple;
  artwork: ArtworkConfig;
  exportSettings: ExportSettings;
  activePreset: string | null;
}

export interface AppearanceState {
  accent: string;
}

export interface UiState {
  measured: { source: string; box: ContentBox | null } | null;
  compareMode: boolean;
  comparePosition: number;
}

export interface Actions {
  setSource: (source: string, name?: string) => void;
  setEffects: (effects: EffectConfig[]) => void;
  setPipeline: (patch: Partial<PipelineSettings>) => void;
  setBackground: (patch: Partial<BackgroundConfig>) => void;
  setPadding: (padding: PaddingTuple) => void;
  setArtwork: (patch: Partial<Omit<ArtworkConfig, 'shadow'>>) => void;
  setShadow: (patch: Partial<ShadowConfig>) => void;
  setExportSettings: (patch: Partial<ExportSettings>) => void;
  applyPreset: (id: string) => void;
  setAccent: (accent: string) => void;
  setMeasured: (measured: { source: string; box: ContentBox | null }) => void;
  setCompareMode: (enabled: boolean) => void;
  setComparePosition: (position: number) => void;
  resetSettings: () => void;
}

export type AppStore = DocumentState & SettingsState & AppearanceState & UiState & Actions;

const DEFAULT_SETTINGS: SettingsState = {
  effects: [],
  pipeline: DEFAULT_PIPELINE,
  background: { ...DEFAULT_BACKGROUND, type: 'gradient', gradient: createGradient(['#30C5D2', '#471069'], 'linear', 135) },
  padding: DEFAULT_PADDING,
  artwork: DEFAULT_ARTWORK,
  exportSettings: DEFAULT_EXPORT,
  activePreset: null,
};

const initialEffects = (): EffectConfig[] => {
  const crt = findLook('crt');
  return crt ? expandLook(crt) : [];
};

const isGradient = (value: unknown): value is BackgroundConfig['gradient'] =>
  typeof value === 'object' && value !== null && Array.isArray((value as BackgroundConfig['gradient']).stops);

const restoreBackground = (current: BackgroundConfig, saved: Partial<BackgroundConfig> | undefined): BackgroundConfig => {
  const known = Object.fromEntries(Object.entries(saved ?? {}).filter(([key]) => key in current));
  return { ...current, ...known, gradient: isGradient(saved?.gradient) ? saved.gradient : current.gradient };
};

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      return;
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      return;
    }
  },
};

const presetState = (id: string, current: SettingsState): Partial<SettingsState> => {
  const preset = findScenePreset(id);
  if (!preset) return {};
  const looks = preset.looks.flatMap((entry) => {
    const look = findLook(entry.id);
    return look ? expandLook(look, entry.animate === undefined ? {} : { animate: entry.animate }) : [];
  });
  const singles = (preset.effects ?? []).map(
    (effect): EffectConfig => ({ uid: newEffectUid(effect.id), id: effect.id, enabled: true, params: { ...effect.params } }),
  );
  return {
    activePreset: preset.id,
    background: { ...DEFAULT_BACKGROUND, ...preset.background },
    padding: [preset.padding, preset.padding, preset.padding, preset.padding],
    artwork: {
      ...current.artwork,
      radius: preset.radius ?? 0,
      shadow: { ...DEFAULT_ARTWORK.shadow, ...preset.shadow, enabled: preset.shadow?.enabled ?? false },
    },
    effects: [...looks, ...singles],
  };
};

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      source: DEFAULT_SOURCE,
      sourceName: 'vctrd',
      ...DEFAULT_SETTINGS,
      effects: initialEffects(),
      accent: DEFAULT_ACCENT,
      measured: null,
      compareMode: false,
      comparePosition: 50,

      setSource: (source, name) => set((state) => ({ source, sourceName: name ?? state.sourceName })),
      setEffects: (effects) => set({ effects, activePreset: null }),
      setPipeline: (patch) => set((state) => ({ pipeline: { ...state.pipeline, ...patch } })),
      setBackground: (patch) => set((state) => ({ background: { ...state.background, ...patch }, activePreset: null })),
      setPadding: (padding) => set({ padding }),
      setArtwork: (patch) => set((state) => ({ artwork: { ...state.artwork, ...patch } })),
      setShadow: (patch) => set((state) => ({ artwork: { ...state.artwork, shadow: { ...state.artwork.shadow, ...patch } } })),
      setExportSettings: (patch) => set((state) => ({ exportSettings: { ...state.exportSettings, ...patch } })),
      applyPreset: (id) => set((state) => presetState(id, state)),
      setAccent: (accent) => set({ accent }),
      setMeasured: (measured) => set({ measured }),
      setCompareMode: (compareMode) => set({ compareMode }),
      setComparePosition: (comparePosition) => set({ comparePosition }),
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'vctrd',
      version: 2,
      migrate: (persisted) => persisted as AppStore,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        source: state.source,
        sourceName: state.sourceName,
        effects: state.effects,
        pipeline: state.pipeline,
        background: state.background,
        padding: state.padding,
        artwork: state.artwork,
        exportSettings: state.exportSettings,
        activePreset: state.activePreset,
        accent: state.accent,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppStore>;
        return {
          ...current,
          ...saved,
          effects: saved.effects === undefined ? current.effects : sanitizeEffectStack(saved.effects),
          pipeline: { ...current.pipeline, ...saved.pipeline },
          background: restoreBackground(current.background, saved.background),
          artwork: {
            ...current.artwork,
            ...saved.artwork,
            shadow: { ...current.artwork.shadow, ...saved.artwork?.shadow },
          },
          exportSettings: { ...current.exportSettings, ...saved.exportSettings },
        };
      },
    },
  ),
);

const cropFor = (state: AppStore): ContentBox | null =>
  state.artwork.trim && state.measured?.source === state.source ? state.measured.box : null;

const requestOf = (state: AppStore): RenderRequest => ({
  source: state.source,
  effects: state.effects,
  pipeline: state.pipeline,
  background: state.background,
  padding: state.padding,
  artwork: state.artwork,
  crop: cropFor(state),
});

export const useRenderRequest = (): RenderRequest => useStore(useShallow(requestOf));

export const readRenderRequest = (): RenderRequest => requestOf(useStore.getState());
