import type jsPDF from "jspdf";

import { INVOICE_PDF_PALETTE, type Rgb } from "./invoicePdfTheme";

/**
 * The text layer of the invoice PDF, and the answer to the guide's Unicode
 * requirement.
 *
 * jsPDF's built-in Helvetica is WinAnsi-encoded: it can draw Latin-1 plus a
 * handful of typographic extras and nothing else, so a Bengali company name
 * would come out as tofu boxes — exactly the failure that got the backend
 * renderer rejected. Embedding a font that covers every script our customers
 * use would mean shipping megabytes of TTFs and still guessing wrong.
 *
 * Instead, any run the core font cannot encode is drawn by the BROWSER onto an
 * offscreen canvas — which does per-glyph fallback across every font the OS has
 * — and embedded as a 4× PNG. Latin text stays real vector text (selectable and
 * crisp); only the non-Latin strings become images. That keeps the export
 * script-agnostic with zero font assets and no network fetch.
 */

/**
 * Code points above U+00FF that WinAnsi (and therefore jsPDF's core fonts) can
 * still encode. The en dash matters most — it joins every line period.
 */
const WINANSI_EXTRAS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030,
  0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022,
  0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

/** True when the core font would mangle this string and the canvas must draw it. */
export const needsRaster = (text: string): boolean => {
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint > 0xff && !WINANSI_EXTRAS.has(codePoint)) return true;
  }
  return false;
};

/** True when ANY of the document's strings will need the canvas path. */
export const documentNeedsRaster = (texts: string[]): boolean =>
  texts.some(needsRaster);

/* ---------------- canvas raster ---------------- */

/** 4× keeps rasterised glyphs sharp at print resolution without bloating the file. */
const RASTER_SCALE = 4;

/**
 * Generic families first so Latin fragments of a mixed string stay consistent
 * with the vector text beside them; the browser resolves everything else by
 * per-glyph fallback across the whole system font set.
 */
const FONT_STACK =
  '"Helvetica Neue", Helvetica, Arial, "Noto Sans", "Noto Sans Bengali", "Nirmala UI", "Bangla MN", "Hind Siliguri", system-ui, sans-serif';

export interface TextStyle {
  size?: number;
  bold?: boolean;
  color?: Rgb;
  align?: "left" | "center" | "right";
}

interface RasterImage {
  dataUrl: string;
  /** In points, i.e. already divided back down by RASTER_SCALE. */
  width: number;
  height: number;
  /** Distance from the image's top edge to the text baseline, in points. */
  ascent: number;
  /**
   * Inset from the image's left edge to the text origin, in points. Subtracting
   * it lines rasterised text up with vector text drawn at the same x.
   */
  inset: number;
}

/**
 * Canvases wider than this are pathological (a single unwrapped string of
 * thousands of characters) and risk hitting the browser's surface limit, so the
 * text falls back to vector rather than taking the tab down with it.
 */
const MAX_RASTER_PX = 16384;

const cssFont = (size: number, bold: boolean, scale: number) =>
  `${bold ? 700 : 400} ${size * scale}px ${FONT_STACK}`;

let measureContext: CanvasRenderingContext2D | null | undefined;

const getMeasureContext = (): CanvasRenderingContext2D | null => {
  if (measureContext !== undefined) return measureContext;
  measureContext =
    typeof document === "undefined"
      ? null
      : document.createElement("canvas").getContext("2d");
  return measureContext;
};

/**
 * Whether the canvas path is actually available. False in a non-DOM context or
 * when 2d canvas is blocked — the caller then warns that non-Latin text will
 * not survive the export and points at "Print / Save as PDF" instead.
 */
export const canRasterize = (): boolean => getMeasureContext() !== null;

/** Rasters are reused across measure/draw and across pages — same string, same PNG. */
const rasterCache = new Map<string, RasterImage | null>();

const rasterize = (
  text: string,
  size: number,
  bold: boolean,
  color: Rgb,
): RasterImage | null => {
  const key = `${size}|${bold ? 1 : 0}|${color.join(",")}|${text}`;
  const cached = rasterCache.get(key);
  if (cached !== undefined) return cached;

  let result: RasterImage | null = null;
  try {
    if (typeof document === "undefined") throw new Error("no document");
    const canvas = document.createElement("canvas");
    const sizing = canvas.getContext("2d");
    if (!sizing) throw new Error("no 2d context");

    const font = cssFont(size, bold, RASTER_SCALE);
    sizing.font = font;
    const metrics = sizing.measureText(text);
    const ascent =
      metrics.actualBoundingBoxAscent || size * RASTER_SCALE * 0.8;
    const descent =
      metrics.actualBoundingBoxDescent || size * RASTER_SCALE * 0.28;
    // Padding absorbs glyphs whose ink overruns the advance width (many Indic
    // matras do) instead of clipping them at the canvas edge.
    const pad = Math.ceil(size * RASTER_SCALE * 0.3);

    const width = Math.max(1, Math.ceil(metrics.width) + pad * 2);
    const height = Math.max(1, Math.ceil(ascent + descent) + pad * 2);
    if (width > MAX_RASTER_PX || height > MAX_RASTER_PX) {
      throw new Error("raster too large");
    }
    canvas.width = width;
    canvas.height = height;

    // Resizing a canvas resets its context state — set the font again.
    const painting = canvas.getContext("2d");
    if (!painting) throw new Error("no 2d context");
    painting.font = font;
    painting.textBaseline = "alphabetic";
    painting.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    painting.fillText(text, pad, pad + ascent);

    result = {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width / RASTER_SCALE,
      height: canvas.height / RASTER_SCALE,
      ascent: (pad + ascent) / RASTER_SCALE,
      inset: pad / RASTER_SCALE,
    };
  } catch {
    // Canvas unavailable or tainted — fall back to vector text, which is
    // imperfect for non-Latin but never blank.
    result = null;
  }

  rasterCache.set(key, result);
  return result;
};

const measureRaster = (text: string, size: number, bold: boolean): number => {
  const ctx = getMeasureContext();
  if (!ctx) return text.length * size * 0.55;
  ctx.font = cssFont(size, bold, RASTER_SCALE);
  return ctx.measureText(text).width / RASTER_SCALE;
};

/* ---------------- drawing ---------------- */

const applyVectorFont = (doc: jsPDF, size: number, bold: boolean, color: Rgb) => {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
};

/** Width of `text` as it will actually be drawn, in points. */
export const textWidth = (
  doc: jsPDF,
  text: string,
  { size = 9, bold = false }: TextStyle = {},
): number => {
  if (needsRaster(text)) return measureRaster(text, size, bold);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  return doc.getTextWidth(text);
};

/**
 * Draws one line of text with `y` as its BASELINE, matching `doc.text`, so
 * callers do not have to know whether a string took the vector or raster path.
 */
export const drawText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  style: TextStyle = {},
) => {
  const {
    size = 9,
    bold = false,
    color = INVOICE_PDF_PALETTE.body,
    align = "left",
  } = style;

  if (!text) return;

  if (needsRaster(text)) {
    const image = rasterize(text, size, bold, color);
    if (image) {
      // The bitmap carries `inset` points of padding on each side; discounting
      // it puts the glyph origin (left) or the advance end (right) exactly where
      // `doc.text` would have put it, so raster and vector runs line up.
      const left =
        align === "right"
          ? x - (image.width - image.inset)
          : align === "center"
            ? x - image.width / 2
            : x - image.inset;
      doc.addImage(image.dataUrl, "PNG", left, y - image.ascent, image.width, image.height);
      return;
    }
  }

  applyVectorFont(doc, size, bold, color);
  doc.text(text, x, y, align === "left" ? undefined : { align });
};

/** Baseline-to-baseline distance for a given font size. */
export const lineHeight = (size: number) => size * 1.35;

/** Wraps to `maxWidth`, measuring with whichever engine will draw the text. */
export const wrapText = (
  doc: jsPDF,
  text: string,
  maxWidth: number,
  style: TextStyle = {},
): string[] => {
  const { size = 9, bold = false } = style;
  if (!text) return [];

  if (!needsRaster(text)) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const split = doc.splitTextToSize(text, maxWidth);
    return Array.isArray(split) ? split : [String(split)];
  }

  const lines: string[] = [];
  let current = "";

  const pushWord = (word: string) => {
    const candidate = current ? `${current} ${word}` : word;
    if (measureRaster(candidate, size, bold) <= maxWidth) {
      current = candidate;
      return;
    }
    if (current) {
      lines.push(current);
      current = "";
    }
    // A single word wider than the column (long CJK / Indic runs have no
    // spaces to break on) is split by grapheme instead of overflowing.
    if (measureRaster(word, size, bold) <= maxWidth) {
      current = word;
      return;
    }
    let chunk = "";
    for (const char of word) {
      if (chunk && measureRaster(chunk + char, size, bold) > maxWidth) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    current = chunk;
  };

  text.split(/\s+/).filter(Boolean).forEach(pushWord);
  if (current) lines.push(current);
  return lines.length ? lines : [text];
};

/** Draws pre-wrapped lines from a baseline and returns the next free baseline. */
export const drawLines = (
  doc: jsPDF,
  lines: string[],
  x: number,
  baselineY: number,
  style: TextStyle = {},
): number => {
  const step = lineHeight(style.size ?? 9);
  lines.forEach((line, index) => {
    drawText(doc, line, x, baselineY + index * step, style);
  });
  return baselineY + lines.length * step;
};

/** Single-line truncation with an ellipsis, measured on the real engine. */
export const truncateToWidth = (
  doc: jsPDF,
  text: string,
  maxWidth: number,
  style: TextStyle = {},
): string => {
  if (textWidth(doc, text, style) <= maxWidth) return text;
  const chars = Array.from(text);
  let clipped = chars;
  while (clipped.length > 1 && textWidth(doc, `${clipped.join("")}…`, style) > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped.join("")}…`;
};
