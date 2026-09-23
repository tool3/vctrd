export interface Sample {
  id: string;
  label: string;
  svg: string;
}

const scene = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="240" height="160">
  <title>Sunset</title>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b2a49"/>
      <stop offset="1" stop-color="#f25c54"/>
    </linearGradient>
  </defs>
  <rect width="240" height="160" rx="12" fill="url(#sky)"/>
  <circle cx="180" cy="46" r="26" fill="#ffd166"/>
  <path d="M0 130 L60 92 L110 130 L160 78 L240 130 L240 160 L0 160 Z" fill="#0b1526"/>
  <text x="16" y="34" font-family="ui-monospace, Menlo, monospace" font-size="18" fill="#f7f7f2">vctrd</text>
</svg>
`;

const card = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 170" width="280" height="170">
  <title>Terminal card</title>
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4cc9f0"/>
      <stop offset="1" stop-color="#f72585"/>
    </linearGradient>
  </defs>
  <rect width="280" height="170" rx="18" fill="#12141c"/>
  <circle cx="30" cy="28" r="6" fill="#ff5f57"/>
  <circle cx="50" cy="28" r="6" fill="#febc2e"/>
  <circle cx="70" cy="28" r="6" fill="#28c840"/>
  <text x="24" y="84" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="#8b93a7">$ vctrfx logo.svg --crt</text>
  <text x="24" y="112" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="url(#accent)">done: logo.crt.svg</text>
  <rect x="24" y="134" width="120" height="6" rx="3" fill="#2a2f3d"/>
  <rect x="24" y="134" width="78" height="6" rx="3" fill="url(#accent)"/>
</svg>
`;

const shapes = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="240" height="160">
  <title>Shapes</title>
  <circle cx="88" cy="80" r="38" fill="#f25c54"/>
  <rect x="130" y="46" width="68" height="68" rx="10" fill="#4cc9f0"/>
  <path d="M40 132 L120 132 L80 40 Z" fill="none" stroke="#ffd166" stroke-width="6" stroke-linejoin="round"/>
</svg>
`;

const tones = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="240" height="160">
  <title>Tones</title>
  <defs>
    <linearGradient id="ramp" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#141414"/>
    </linearGradient>
    <radialGradient id="ball" cx="0.34" cy="0.28" r="0.78">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.5" stop-color="#9aa0a6"/>
      <stop offset="1" stop-color="#26292d"/>
    </radialGradient>
  </defs>
  <rect width="240" height="160" fill="#f5f2ec"/>
  <circle cx="76" cy="70" r="46" fill="url(#ball)"/>
  <rect x="142" y="28" width="74" height="78" rx="6" fill="#8d99ae"/>
  <path d="M152 98 L179 46 L206 98 Z" fill="#3d405b"/>
  <rect x="24" y="128" width="192" height="18" rx="3" fill="url(#ramp)"/>
</svg>
`;

const motion = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="240" height="160">
  <title>Motion</title>
  <rect width="240" height="160" rx="12" fill="#0b1020"/>
  <circle cx="52" cy="112" r="16" fill="#f25c54">
    <animate attributeName="r" values="16;26;16" dur="2.4s" repeatCount="indefinite"/>
    <animate attributeName="fill" values="#f25c54;#ff8fab;#f25c54" dur="2.4s" repeatCount="indefinite"/>
  </circle>
  <g transform="translate(186 52)">
    <rect x="-18" y="-18" width="36" height="36" rx="4" fill="#ffd166">
      <animateTransform attributeName="transform" type="rotate" values="0;360" dur="4.8s" repeatCount="indefinite"/>
    </rect>
  </g>
  <rect x="0" y="16" width="44" height="18" rx="4" fill="#4cc9f0">
    <animateTransform attributeName="transform" type="translate" values="6 0;190 0;6 0" dur="4.8s" repeatCount="indefinite"/>
  </rect>
  <path d="M0 148 L48 120 L96 148 L144 112 L192 148 L240 124" fill="none" stroke="#2b3a67" stroke-width="5">
    <animate attributeName="stroke-dasharray" values="0 60;60 0;0 60" dur="2.4s" repeatCount="indefinite"/>
  </path>
</svg>
`;

const spinner = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <title>CSS spinner</title>
  <style>
    .dot { transform-origin: 100px 100px; animation: orbit 1.6s cubic-bezier(.6,.1,.3,.9) infinite; }
    .dot:nth-child(2) { animation-delay: -0.2s; opacity: .8 }
    .dot:nth-child(3) { animation-delay: -0.4s; opacity: .6 }
    .dot:nth-child(4) { animation-delay: -0.6s; opacity: .4 }
    @keyframes orbit { to { transform: rotate(360deg) } }
  </style>
  <g fill="#b388ff">
    <circle class="dot" cx="100" cy="40" r="14"/>
    <circle class="dot" cx="100" cy="40" r="12"/>
    <circle class="dot" cx="100" cy="40" r="10"/>
    <circle class="dot" cx="100" cy="40" r="8"/>
  </g>
</svg>
`;

export const SAMPLES: readonly Sample[] = [
  { id: 'sunset', label: 'Sunset', svg: scene },
  { id: 'card', label: 'Terminal card', svg: card },
  { id: 'shapes', label: 'Shapes (no backdrop)', svg: shapes },
  { id: 'tones', label: 'Tones', svg: tones },
  { id: 'motion', label: 'Motion (SMIL)', svg: motion },
  { id: 'spinner', label: 'Spinner (CSS)', svg: spinner },
];

export const DEFAULT_SOURCE = scene;
