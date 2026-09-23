const stroke = (d: string): string =>
  `<path d="${d}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

export const icons = {
  download: stroke('M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3'),
  upload: stroke('M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12'),
  copy: `<rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2" fill="none"/>`,
  check: stroke('M20 6L9 17l-5-5'),
  x: stroke('M18 6L6 18M6 6l12 12'),
  trash: stroke('M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2'),
  chevronDown: stroke('M6 9l6 6 6-6'),
  github: stroke(
    'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  ),
  zoomIn: `<circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" fill="none"/>${stroke('M21 21l-4.35-4.35M11 8v6M8 11h6')}`,
  zoomOut: `<circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" fill="none"/>${stroke('M21 21l-4.35-4.35M8 11h6')}`,
  fitView: stroke('M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M16 21h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3'),
  compare: `<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>${stroke('M12 3v18')}<path d="M12 3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7z" fill="currentColor" opacity="0.35"/>`,
  circle: `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>`,
  arrowRight: stroke('M5 12h14M12 5l7 7-7 7'),
  arrowDown: stroke('M12 5v14M19 12l-7 7-7-7'),
  arrowDownRight: stroke('M7 7l10 10M17 7v10H7'),
  arrowDownLeft: stroke('M17 7L7 17M7 7v10h10'),
  wand: stroke('M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5'),
  dice: `<rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>`,
  palette: `<circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12" r="0.5" fill="currentColor"/>${stroke(
    'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z',
  )}`,
  image: `<rect width="18" height="18" x="3" y="3" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="2" fill="none"/>${stroke('m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21')}`,
  sparkles: stroke(
    'M9.94 5.94 12 2l2.06 3.94L18 8l-3.94 2.06L12 14l-2.06-3.94L6 8ZM18.5 15.5 19.5 18l2.5 1-2.5 1-1 2.5-1-2.5L15 19l2.5-1ZM5 14l.75 1.75L7.5 16.5l-1.75.75L5 19l-.75-1.75L2.5 16.5l1.75-.75Z',
  ),
  frame: stroke('M22 6H2M22 18H2M6 2v20M18 2v20'),
  padding: stroke('M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6m1-9 4 10 1.7-4.3L22 16Z'),
  film: `<rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>${stroke('M7 3v18M17 3v18M2 8h5M2 13h5M2 18h5M17 8h5M17 13h5M17 18h5')}`,
  file: stroke('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6'),
  reset: stroke('M1 4v6h6M3.51 15a9 9 0 102.13-9.36L1 10'),
} as const;

export type IconName = keyof typeof icons;
