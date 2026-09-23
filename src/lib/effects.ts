import {
  CRT_DEFAULTS,
  CYBERPUNK_DEFAULTS,
  EFFECT_FACTORIES,
  FILM_DEFAULTS,
  NEON_DEFAULTS,
  NEWSPRINT_DEFAULTS,
  RISO_DEFAULTS,
  VHS_DEFAULTS,
  XEROX_DEFAULTS,
} from 'vctrfx';
import type { Effect, EffectName } from 'vctrfx';

export type ControlValue = number | boolean | string | null;

interface BaseControl {
  key: string;
  label: string;
  hint?: string;
}

export type Control =
  | (BaseControl & { type: 'number'; default: number; min: number; max: number; step: number; suffix?: string })
  | (BaseControl & { type: 'boolean'; default: boolean })
  | (BaseControl & { type: 'color'; default: string })
  | (BaseControl & { type: 'optionalColor'; default: string | null })
  | (BaseControl & { type: 'enum'; default: string; options: readonly string[] });

export type EffectGroup = 'Light' | 'Colour' | 'Texture' | 'Distort';

export interface EffectDescriptor {
  id: EffectName;
  label: string;
  group: EffectGroup;
  description: string;
  controls: readonly Control[];
}

const num = (
  key: string,
  label: string,
  d: number,
  min: number,
  max: number,
  step: number,
  extra: { suffix?: string; hint?: string } = {},
): Control => ({ type: 'number', key, label, default: d, min, max, step, ...extra });

const bool = (key: string, label: string, d: boolean, hint?: string): Control => ({
  type: 'boolean',
  key,
  label,
  default: d,
  hint,
});

const color = (key: string, label: string, d: string): Control => ({ type: 'color', key, label, default: d });

const optionalColor = (key: string, label: string, d: string | null, hint?: string): Control => ({
  type: 'optionalColor',
  key,
  label,
  default: d,
  hint,
});

const choice = (key: string, label: string, d: string, options: readonly string[]): Control => ({
  type: 'enum',
  key,
  label,
  default: d,
  options,
});

const amount = (d: number, max = 2): Control => num('amount', 'Amount', d, 0, max, 0.05);

const motion = (speedDefault: number, speedMax: number): Control[] => [
  bool('animate', 'Animate', false, 'Adds its own animation to the SVG.'),
  num('speed', 'Speed', speedDefault, 0.1, speedMax, 0.1),
];

const overlayClip = choice('clip', 'Clip', 'shape', ['shape', 'viewport']);

export const EFFECTS: readonly EffectDescriptor[] = [
  {
    id: 'bloom',
    label: 'Bloom',
    group: 'Light',
    description: 'Bright areas bleed light into their surroundings.',
    controls: [
      num('radius', 'Radius', 8, 0, 40, 0.5),
      num('threshold', 'Threshold', 0.55, 0, 1, 0.01),
      num('intensity', 'Intensity', 1.1, 0, 3, 0.05),
    ],
  },
  {
    id: 'glow',
    label: 'Glow',
    group: 'Light',
    description: 'A coloured halo around the artwork.',
    controls: [
      color('color', 'Colour', '#ffffff'),
      num('radius', 'Radius', 6, 0, 40, 0.5),
      num('spread', 'Spread', 0, 0, 20, 0.5),
      num('intensity', 'Intensity', 1, 0, 3, 0.05),
    ],
  },
  {
    id: 'shadow',
    label: 'Drop shadow',
    group: 'Light',
    description: 'Offset shadow cast behind the artwork.',
    controls: [
      num('x', 'Offset X', 3, -40, 40, 1),
      num('y', 'Offset Y', 4, -40, 40, 1),
      num('blur', 'Blur', 4, 0, 40, 0.5),
      color('color', 'Colour', '#000000'),
      num('opacity', 'Opacity', 0.4, 0, 1, 0.01),
    ],
  },
  {
    id: 'vignette',
    label: 'Vignette',
    group: 'Light',
    description: 'Darkens the edges toward the corners.',
    controls: [
      num('amount', 'Amount', 0.65, 0, 1, 0.01),
      num('radius', 'Radius', 0.6, 0, 1.5, 0.01),
      num('softness', 'Softness', 0.7, 0, 1, 0.01),
      color('color', 'Colour', '#000000'),
      overlayClip,
    ],
  },
  {
    id: 'blur',
    label: 'Blur',
    group: 'Light',
    description: 'Gaussian blur, optionally on one axis only.',
    controls: [num('radius', 'Radius', 3, 0, 40, 0.5), choice('axis', 'Axis', 'both', ['both', 'horizontal', 'vertical'])],
  },
  {
    id: 'sharpen',
    label: 'Sharpen',
    group: 'Light',
    description: 'Convolution sharpen. Small amounts go a long way.',
    controls: [amount(1, 4)],
  },
  {
    id: 'emboss',
    label: 'Emboss',
    group: 'Light',
    description: 'Fakes relief with a directional light.',
    controls: [
      num('depth', 'Depth', 1, 0, 5, 0.1),
      num('angle', 'Angle', 135, 0, 360, 1, { suffix: '°' }),
      bool('desaturate', 'Desaturate', true),
    ],
  },
  { id: 'grayscale', label: 'Grayscale', group: 'Colour', description: 'Drains the colour out.', controls: [amount(1, 1)] },
  { id: 'saturate', label: 'Saturate', group: 'Colour', description: 'Pushes or pulls colour intensity.', controls: [amount(1.4, 4)] },
  { id: 'brightness', label: 'Brightness', group: 'Colour', description: 'Scales every channel.', controls: [amount(1.15, 3)] },
  { id: 'contrast', label: 'Contrast', group: 'Colour', description: 'Expands or compresses tonal range.', controls: [amount(1.25, 3)] },
  { id: 'sepia', label: 'Sepia', group: 'Colour', description: 'Warm monochrome wash.', controls: [amount(1, 1)] },
  { id: 'invert', label: 'Invert', group: 'Colour', description: 'Flips every channel.', controls: [amount(1, 1)] },
  { id: 'fade', label: 'Fade', group: 'Colour', description: 'Lifts the blacks for a washed look.', controls: [amount(0.7, 1)] },
  {
    id: 'hueRotate',
    label: 'Hue rotate',
    group: 'Colour',
    description: 'Spins the whole palette around the colour wheel.',
    controls: [num('angle', 'Angle', 90, 0, 360, 1, { suffix: '°' })],
  },
  {
    id: 'tint',
    label: 'Tint',
    group: 'Colour',
    description: 'Washes a single colour over everything.',
    controls: [color('color', 'Colour', '#ff2d55'), amount(0.45, 1)],
  },
  {
    id: 'duotone',
    label: 'Duotone',
    group: 'Colour',
    description: 'Maps luminance onto two colours.',
    controls: [
      color('shadow', 'Shadow', '#12263a'),
      color('highlight', 'Highlight', '#f4d35e'),
      num('mix', 'Mix', 1, 0, 1, 0.01),
    ],
  },
  {
    id: 'posterize',
    label: 'Posterize',
    group: 'Colour',
    description: 'Quantises each channel into bands.',
    controls: [num('steps', 'Steps', 5, 2, 16, 1), bool('includeAlpha', 'Include alpha', false)],
  },
  {
    id: 'threshold',
    label: 'Threshold',
    group: 'Colour',
    description: 'Hard cut to two colours at a luminance level.',
    controls: [num('level', 'Level', 0.5, 0, 1, 0.01), color('dark', 'Dark', '#000000'), color('light', 'Light', '#ffffff')],
  },
  {
    id: 'scanlines',
    label: 'Scanlines',
    group: 'Texture',
    description: 'Horizontal raster lines, like a CRT.',
    controls: [
      num('gap', 'Gap', 4, 1, 40, 0.5),
      num('thickness', 'Thickness', 1.5, 0.1, 20, 0.1),
      num('opacity', 'Opacity', 0.28, 0, 1, 0.01),
      color('color', 'Colour', '#000000'),
      num('angle', 'Angle', 0, 0, 360, 1, { suffix: '°' }),
      choice('blend', 'Blend', 'multiply', ['multiply', 'overlay', 'screen', 'normal']),
      overlayClip,
      ...motion(6, 60),
    ],
  },
  {
    id: 'grain',
    label: 'Grain',
    group: 'Texture',
    description: 'Film grain over the whole frame.',
    controls: [
      num('amount', 'Amount', 0.32, 0, 1, 0.01),
      num('size', 'Size', 0.8, 0.1, 5, 0.05),
      bool('monochrome', 'Monochrome', true),
      choice('blend', 'Blend', 'overlay', ['overlay', 'multiply', 'screen', 'soft-light', 'normal']),
      ...motion(12, 60),
    ],
  },
  {
    id: 'halftone',
    label: 'Halftone',
    group: 'Texture',
    description: 'Print-style dot screen.',
    controls: [
      num('size', 'Dot size', 6, 1, 40, 0.5),
      num('angle', 'Angle', 45, 0, 360, 1, { suffix: '°' }),
      num('levels', 'Levels', 4, 2, 16, 1),
      color('color', 'Ink', '#111111'),
      optionalColor('background', 'Paper', '#ffffff', 'Empty leaves the paper transparent.'),
      bool('keepSource', 'Keep source', false),
      overlayClip,
    ],
  },
  {
    id: 'pixelate',
    label: 'Pixelate',
    group: 'Texture',
    description: 'Quantises to square blocks.',
    controls: [num('size', 'Block size', 8, 1, 64, 1)],
  },
  {
    id: 'outline',
    label: 'Outline',
    group: 'Texture',
    description: 'Traces a stroke around the artwork.',
    controls: [
      num('width', 'Width', 2, 0, 20, 0.5),
      color('color', 'Colour', '#000000'),
      choice('position', 'Position', 'outside', ['outside', 'inside']),
    ],
  },
  {
    id: 'chromaticAberration',
    label: 'Chromatic aberration',
    group: 'Distort',
    description: 'Splits the RGB channels apart.',
    controls: [num('offset', 'Offset', 2, 0, 20, 0.1), num('angle', 'Angle', 0, 0, 360, 1, { suffix: '°' })],
  },
  {
    id: 'glitch',
    label: 'Glitch',
    group: 'Distort',
    description: 'Slices the image and shifts them sideways.',
    controls: [
      num('intensity', 'Intensity', 0.5, 0, 1, 0.01),
      num('slices', 'Slices', 7, 1, 40, 1),
      bool('colorShift', 'Colour shift', true),
      ...motion(1, 20),
    ],
  },
  {
    id: 'wave',
    label: 'Wave',
    group: 'Distort',
    description: 'Ripples the artwork with turbulence.',
    controls: [
      num('amplitude', 'Amplitude', 12, 0, 80, 0.5),
      num('frequency', 'Frequency', 0.02, 0.001, 0.2, 0.001),
      num('octaves', 'Octaves', 2, 1, 6, 1),
      ...motion(0.15, 5),
    ],
  },
];

export const EFFECT_GROUPS: readonly EffectGroup[] = ['Light', 'Colour', 'Texture', 'Distort'];

const BY_ID: ReadonlyMap<string, EffectDescriptor> = new Map(EFFECTS.map((e) => [e.id, e]));

export const findEffect = (id: string): EffectDescriptor | undefined => BY_ID.get(id);

export const isAnimatable = (id: string): boolean =>
  findEffect(id)?.controls.some((control) => control.key === 'animate') ?? false;

export interface LookDescriptor {
  id: string;
  label: string;
  description: string;
  recipe: ReadonlyArray<{ id: EffectName; params: Record<string, ControlValue> }>;
}

type PresetDefaults = Readonly<Partial<Record<EffectName, Readonly<Record<string, ControlValue>>>>>;

const recipeOf = (defaults: PresetDefaults): LookDescriptor['recipe'] =>
  Object.entries(defaults).map(([id, params]) => ({ id: id as EffectName, params: { ...params } }));

export const LOOKS: readonly LookDescriptor[] = [
  { id: 'crt', label: 'CRT', description: 'Scanlines, bloom and a curved-glass vignette.', recipe: recipeOf(CRT_DEFAULTS) },
  { id: 'vhs', label: 'VHS', description: 'Tape wobble, colour bleed and tracking noise.', recipe: recipeOf(VHS_DEFAULTS) },
  { id: 'cyberpunk', label: 'Cyberpunk', description: 'Neon bloom over a hard glitch.', recipe: recipeOf(CYBERPUNK_DEFAULTS) },
  { id: 'film', label: 'Film', description: 'Grain, halation and a gentle vignette.', recipe: recipeOf(FILM_DEFAULTS) },
  { id: 'newsprint', label: 'Newsprint', description: 'Coarse halftone on off-white stock.', recipe: recipeOf(NEWSPRINT_DEFAULTS) },
  { id: 'xerox', label: 'Xerox', description: 'Blown-out photocopy contrast.', recipe: recipeOf(XEROX_DEFAULTS) },
  { id: 'riso', label: 'Riso', description: 'Two-ink risograph misprint.', recipe: recipeOf(RISO_DEFAULTS) },
  { id: 'neon', label: 'Neon', description: 'Tube glow traced around every edge.', recipe: recipeOf(NEON_DEFAULTS) },
];

export const findLook = (id: string): LookDescriptor | undefined => LOOKS.find((look) => look.id === id);

export interface EffectConfig {
  uid: string;
  id: EffectName;
  enabled: boolean;
  params: Record<string, ControlValue>;
  group?: { uid: string; id: string; label: string };
  baseline?: Record<string, ControlValue>;
}

export const newEffectUid = (id: string): string => `${id}-${crypto.randomUUID().slice(0, 8)}`;

export const isTuned = (entry: EffectConfig): boolean => {
  const baseline = entry.baseline ?? {};
  const keys = new Set([...Object.keys(entry.params), ...Object.keys(baseline)]);
  return [...keys].some((key) => !Object.is(entry.params[key], baseline[key]));
};

export const createEffect = (id: EffectName): EffectConfig => ({ uid: newEffectUid(id), id, enabled: true, params: {} });

export const expandLook = (look: LookDescriptor, overrides: Record<string, ControlValue> = {}): EffectConfig[] => {
  const groupUid = newEffectUid(`look-${look.id}`);
  return look.recipe.map((step) => ({
    uid: newEffectUid(step.id),
    id: step.id,
    enabled: true,
    params: { ...step.params, ...(isAnimatable(step.id) ? overrides : {}) },
    group: { uid: groupUid, id: look.id, label: look.label },
    baseline: { ...step.params },
  }));
};

export type StackRun =
  | { kind: 'effect'; entry: EffectConfig; index: number }
  | { kind: 'group'; uid: string; id: string; label: string; entries: EffectConfig[]; start: number };

const appendToRuns = (runs: readonly StackRun[], entry: EffectConfig, index: number): StackRun[] => {
  const last = runs.at(-1);
  if (!entry.group) return [...runs, { kind: 'effect', entry, index }];
  if (last?.kind === 'group' && last.uid === entry.group.uid) {
    return [...runs.slice(0, -1), { ...last, entries: [...last.entries, entry] }];
  }
  return [
    ...runs,
    { kind: 'group', uid: entry.group.uid, id: entry.group.id, label: entry.group.label, entries: [entry], start: index },
  ];
};

export const groupStack = (stack: readonly EffectConfig[]): StackRun[] =>
  stack.reduce<StackRun[]>((runs, entry, index) => appendToRuns(runs, entry, index), []);

export const defaultParams = (descriptor: EffectDescriptor): Record<string, ControlValue> =>
  Object.fromEntries(descriptor.controls.map((c) => [c.key, c.default]));

export const resolveParams = (
  descriptor: EffectDescriptor,
  params: Record<string, ControlValue>,
): Record<string, ControlValue> => ({ ...defaultParams(descriptor), ...params });

export const buildEffects = (stack: readonly EffectConfig[]): Effect[] =>
  stack
    .filter((entry) => entry.enabled)
    .flatMap((entry) => {
      const descriptor = BY_ID.get(entry.id);
      return descriptor ? [EFFECT_FACTORIES[descriptor.id](resolveParams(descriptor, entry.params))] : [];
    });

export const stackAnimates = (stack: readonly EffectConfig[]): boolean =>
  stack.some((entry) => entry.enabled && entry.params.animate === true);

const flattenRuns = (runs: readonly StackRun[]): EffectConfig[] =>
  runs.flatMap((run) => (run.kind === 'group' ? run.entries : [run.entry]));

const move = <T,>(items: readonly T[], from: number, to: number): T[] => {
  const item = items[from];
  if (item === undefined || from === to) return [...items];
  const clamped = Math.max(0, Math.min(items.length - 1, to));
  const without = items.filter((_, i) => i !== from);
  return [...without.slice(0, clamped), item, ...without.slice(clamped)];
};

export const reorderRuns = (stack: readonly EffectConfig[], from: number, to: number): EffectConfig[] =>
  flattenRuns(move(groupStack(stack), from, to));

export const reorderInGroup = (
  stack: readonly EffectConfig[],
  groupUid: string,
  from: number,
  to: number,
): EffectConfig[] =>
  flattenRuns(
    groupStack(stack).map((run) =>
      run.kind === 'group' && run.uid === groupUid ? { ...run, entries: move(run.entries, from, to) } : run,
    ),
  );

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeValue = (control: Control, value: unknown): ControlValue | undefined => {
  switch (control.type) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
        ? Math.min(control.max, Math.max(control.min, value))
        : undefined;
    case 'boolean':
      return typeof value === 'boolean' ? value : undefined;
    case 'color':
      return typeof value === 'string' && HEX_COLOR.test(value) ? value : undefined;
    case 'optionalColor':
      return value === null || (typeof value === 'string' && HEX_COLOR.test(value)) ? value : undefined;
    case 'enum':
      return typeof value === 'string' && control.options.includes(value) ? value : undefined;
  }
};

const sanitizeParams = (descriptor: EffectDescriptor, value: unknown): Record<string, ControlValue> =>
  isRecord(value)
    ? Object.fromEntries(
        descriptor.controls.flatMap((control) => {
          const sanitized = sanitizeValue(control, value[control.key]);
          return sanitized === undefined ? [] : [[control.key, sanitized] as const];
        }),
      )
    : {};

const sanitizeGroup = (value: unknown): EffectConfig['group'] =>
  isRecord(value) && typeof value.uid === 'string' && typeof value.id === 'string' && typeof value.label === 'string'
    ? { uid: value.uid, id: value.id, label: value.label }
    : undefined;

const sanitizeEntry = (value: unknown): EffectConfig[] => {
  if (!isRecord(value) || typeof value.id !== 'string') return [];
  const descriptor = BY_ID.get(value.id);
  if (!descriptor) return [];
  const group = sanitizeGroup(value.group);
  return [
    {
      uid: typeof value.uid === 'string' ? value.uid : newEffectUid(descriptor.id),
      id: descriptor.id,
      enabled: value.enabled !== false,
      params: sanitizeParams(descriptor, value.params),
      ...(group ? { group } : {}),
      ...(isRecord(value.baseline) ? { baseline: sanitizeParams(descriptor, value.baseline) } : {}),
    },
  ];
};

export const sanitizeEffectStack = (value: unknown): EffectConfig[] =>
  Array.isArray(value) ? value.slice(0, 64).flatMap(sanitizeEntry) : [];
