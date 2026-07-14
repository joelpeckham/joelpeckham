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
const INK = "#141210";
const PAPER = "#f1ebdd";
const RED = "#e1352a";
const BLUE = "#1f45d8";
const YELLOW = "#f7c000";
const GREY = "#6b6560";

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
 */
function textPath(font, text, x, y, fontSize, { fill = INK, letterSpacing = 0, kerning = true } = {}) {
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

  return `<path fill="${fill}" d="${parts.join("")}"/>`;
}

const jost = loadFont("fonts/Jost-Black.ttf");
const mono = loadFont("fonts/JetBrainsMono-Medium.ttf");

const label = "JOEL PECKHAM · FULL-STACK · AI · LARAMIE, WY";
const lines = [
  { text: "I MAKE", fill: INK },
  { text: "SOFTWARE", fill: INK },
  { text: "THAT HELPS", fill: INK },
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
  fill: GREY,
  letterSpacing: labelTracking,
});

const displayPaths = lines
  .map((line, i) =>
    textPath(jost, line.text, copyX, lineBaselines[i], displaySize, {
      fill: line.fill,
      letterSpacing: displayTracking,
    }),
  )
  .join("\n  ");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc">
  <title id="title">Joel Peckham — I make software that helps people.</title>
  <desc id="desc">Bauhaus-style profile banner. Text is outlined glyph paths (Jost Black, JetBrains Mono) — no runtime fonts required.</desc>

  <!-- paper ground + heavy ink rule -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
  <rect y="${HEIGHT - 3}" width="${WIDTH}" height="3" fill="${INK}"/>

  <!-- decorative shapes (homepage hero) -->
  <circle cx="1020" cy="-20" r="160" fill="${BLUE}"/>
  <path d="M780 520 A110 110 0 0 1 1000 520 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="3"/>
  <polygon points="720,210 768,294 672,294" fill="${RED}" transform="rotate(18 720 252)"/>

  <!-- outlined type -->
  ${labelPath}
  ${displayPaths}
</svg>
`;

const out = path.join(root, "assets/hero.svg");
fs.writeFileSync(out, svg);
console.log(`Wrote ${path.relative(root, out)} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)`);
