#!/usr/bin/env node
/**
 * Outline text into SVG paths via opentype.js.
 *
 * Fonts are loaded from ./fonts (OFL). Output has no runtime font dependency —
 * every letter is a <path>, so GitHub <img> rendering stays crisp.
 *
 *   node scripts/build-hero.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const WIDTH = 1100;
const HEIGHT = 520;
const RED = "#e1352a";
const BLUE = "#1f45d8";
const YELLOW = "#f7c000";

function loadFont(rel) {
  const buf = fs.readFileSync(path.join(root, rel));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/**
 * Outline a string glyph-by-glyph.
 *
 * Prefer this over font.getPath() — some OFL fonts (e.g. JetBrains Mono) trip
 * opentype.js on unsupported GSUB lookup formats. Manual layout stays stable
 * and still applies kerning via the font's kern table when present.
 *
 * Themeable fills use `className` (CSS + prefers-color-scheme). Accents use `fill`.
 */
function textPath(
  font,
  text,
  x,
  y,
  fontSize,
  { fill, className, letterSpacing = 0, kerning = true } = {},
) {
  const scale = (1 / font.unitsPerEm) * fontSize;
  let cursor = x;
  const parts = [];
  const chars = [...text];

  for (let i = 0; i < chars.length; i++) {
    const glyph = font.charToGlyph(chars[i]);
    // Pass a number (or { flipY: false }). Object form defaults flipY:true and
    // double-flips glyph.getPath() coords — producing NaN on flat stems.
    const d = glyph.getPath(cursor, y, fontSize).toPathData(2);
    if (d) parts.push(d);

    let advance = glyph.advanceWidth * scale;
    if (kerning && i < chars.length - 1) {
      const next = font.charToGlyph(chars[i + 1]);
      advance += font.getKerningValue(glyph, next) * scale;
    }
    cursor += advance + letterSpacing * fontSize;
  }

  const attrs = [
    className ? `class="${className}"` : null,
    fill ? `fill="${fill}"` : null,
    `d="${parts.join("")}"`,
  ]
    .filter(Boolean)
    .join(" ");

  return `<path ${attrs}/>`;
}

const jost = loadFont("fonts/Jost-Black.ttf");
const mono = loadFont("fonts/JetBrainsMono-Medium.ttf");

const label = "JOEL PECKHAM · FULL-STACK · AI · LARAMIE, WY";
const lines = [
  { text: "I MAKE", className: "ink" },
  { text: "SOFTWARE", className: "ink" },
  { text: "THAT HELPS", className: "ink" },
  { text: "PEOPLE.", fill: RED },
];

const copyX = 56;
const labelY = 78;
const labelSize = 13;
// CSS letter-spacing: 0.18em
const labelTracking = 0.18;

const displaySize = 92;
// CSS letter-spacing: -0.02em
const displayTracking = -0.02;
const lineBaselines = [178, 268, 358, 448];

const labelPath = textPath(mono, label, copyX, labelY, labelSize, {
  className: "muted",
  letterSpacing: labelTracking,
});

const displayPaths = lines
  .map((line, i) =>
    textPath(jost, line.text, copyX, lineBaselines[i], displaySize, {
      ...line,
      letterSpacing: displayTracking,
    }),
  )
  .join("\n  ");

// prefers-color-scheme works for SVGs loaded as <img> on GitHub.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc">
  <title id="title">Joel Peckham — I make software that helps people.</title>
  <desc id="desc">Bauhaus-style profile banner. Text is outlined glyph paths (Jost Black, JetBrains Mono) — no runtime fonts required. Colors follow light/dark via prefers-color-scheme.</desc>
  <style>
    .bg { fill: #ffffff; }
    .ink { fill: #141210; }
    .muted { fill: #6b6560; }
    @media (prefers-color-scheme: dark) {
      .bg { fill: #0d1117; }
      .ink { fill: #f0f6fc; }
      .muted { fill: #8b949e; }
    }
  </style>

  <!-- ground + heavy rule (themeable) -->
  <rect class="bg" width="${WIDTH}" height="${HEIGHT}"/>
  <rect class="ink" y="${HEIGHT - 3}" width="${WIDTH}" height="3"/>

  <!-- decorative shapes (homepage hero) — Bauhaus accents stay fixed -->
  <circle cx="1020" cy="-20" r="160" fill="${BLUE}"/>
  <path d="M780 520 A110 110 0 0 1 1000 520 Z" fill="${YELLOW}"/>
  <polygon points="720,210 768,294 672,294" fill="${RED}" transform="rotate(18 720 252)"/>

  <!-- outlined type -->
  ${labelPath}
  ${displayPaths}
</svg>
`;

const out = path.join(root, "assets/hero.svg");
fs.writeFileSync(out, svg);
console.log(`Wrote ${path.relative(root, out)} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)`);
