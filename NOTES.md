# Profile README — outlined SVG hero

This repo powers the GitHub profile README at [github.com/joelpeckham](https://github.com/joelpeckham).

## Why outlines (not live text / not PNG)

GitHub serves README images as `<img>`. External fonts in SVG usually **do not load**, so live `<text>` falls back to something ugly. Raster screenshots fix fonts but are soft, heavy, and a pain to edit.

**Outlined SVG** bakes Jost / JetBrains Mono into `<path>` data at build time. Crisp at any size, no font dependency, easy to regenerate.

## Workflow options (text → SVG outlines)

| Approach | Pros | Cons |
|---|---|---|
| **opentype.js (this repo)** | Scriptable, OFL fonts, CI-friendly, exact glyph curves | Need a tiny build script; some fonts trip GSUB — we outline glyph-by-glyph |
| **Inkscape CLI** (`inkscape --export-text-to-path`) | One-shot from an SVG that still has `<text>` | Extra app install; less control over tracking/kerning in automation |
| **Illustrator / Affinity “Create Outlines”** | Best for one-off design polish | Manual; not reproducible |
| **fonttools / `ttx`** | Deep OpenType control | Overkill for a banner |
| **`text-to-svg` npm** | Thin wrapper over opentype | Same engine; less flexible than calling opentype directly |

We use **opentype.js**: load the TTFs, place each glyph with kerning + letter-spacing, emit path data.

## Regenerating the hero

```bash
npm install
npm run build:hero   # → assets/hero.svg
```

Edit copy / layout in `scripts/build-hero.mjs`. Fonts live in `fonts/` (OFL — see licenses there).

### Gotcha we hit

`path.toPathData({ decimalPlaces: 2 })` defaults `flipY: true`. Glyph paths from `glyph.getPath()` are already SVG-Y. That double-flip produced `NaN` on flat stems (I, E, …). Pass a number (`toPathData(2)`) or `{ flipY: false }`.
