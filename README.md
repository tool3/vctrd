<div align="center">

# vctrd

<img src="https://shellfied.vercel.app/s/SnIfI3L.svg" width="420" alt="crt preset">

### Post-processing effects for any SVG.

The web companion to [vctrfx](https://github.com/tool3/vctrfx): paste or upload any SVG, stack post-processing effects, frame it on a background, and export SVG, PNG, WebP, JPEG or MP4.

</div>

- **Same engine as the library.** Every effect and Look is `vctrfx` itself, running in a Web Worker. With no background, padding or frame applied, the exported SVG is exactly what `vctrfx(source, effects)` returns.
- **27 effects and 8 Looks.** Looks are expanded into editable effects, so every knob inside CRT, VHS, Riso and the rest can be tuned. Drag to reorder, including on touch screens.
- **Scenes.** One-tap presets that combine a background with a set of effects.
- **Backgrounds.** Solid, gradient, pattern (dots, grid, lines, noise, topographic), image, SMIL background animations, padding per side, corner radius, social aspect ratios, and artwork radius and shadow.
- **Before / after.** A draggable compare slider in the preview.
- **Motion.** SMIL and CSS animations in the source are kept. Effects can add their own motion, and MP4 export freezes each frame precisely (WebCodecs + mp4-muxer).
- **Offline.** An installable PWA.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
```

Stack: TypeScript, React 19, Vite, SCSS modules, zustand, CodeMirror 6.
