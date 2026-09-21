// A4 排版与分页算法，全部以 mm 为单位（SVG viewBox 1 单位 = 1mm）
import type { CopybookConfig, StrokeMode } from './types';
import { isRuled, isVertical } from './derive';

export interface Geometry {
  pageW: number;
  pageH: number;
  ox: number; // 格子区左上角
  oy: number;
  cols: number;
  rows: number;
  cell: number;
  band: number; // 拼音带高度 mm（0 = 无拼音格）
  rowH: number; // 行高 = cell + band
}

export interface Cell {
  ch: string;                    // 本格显示的范字（空白格为空）
  ref: string;                   // 所属原字，用于查拼音
  mode: 'trace' | 'blank' | 'break' | 'stroke';
  n?: number;                    // mode === 'stroke' 时为第几笔（1 起）
  g?: number;                    // 分组号：同一字/词的描红+空白+笔顺格共享（听写帖拼音只标组首空格）
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

const HEADER_H = 8;    // 页眉预留高度 mm
const BAND_RATIO = 0.45; // 拼音带高度 / 格边长

export function computeGeometry(cfg: CopybookConfig): Geometry {
  const pageW = cfg.landscape ? 297 : 210;
  const pageH = cfg.landscape ? 210 : 297;
  const headerH = cfg.showHeader ? HEADER_H : 0;
  const availW = pageW - 2 * cfg.marginX;
  const availH = pageH - 2 * cfg.marginY - headerH;

  const cell = Math.max(2, cfg.cellSize);
  const ruled = isRuled(cfg);
  const vertical = isVertical(cfg);
  const band = cfg.showPinyin && !ruled && !vertical ? round3(cell * BAND_RATIO) : 0;
  const rowH = round3(cell + band);
  // 手动列数只允许改小、不允许超出页宽能放下的列数，否则格子会印到纸外
  const autoCols = Math.max(1, Math.floor(availW / cell));
  const cols = cfg.colsOverride != null ? Math.max(1, Math.min(cfg.colsOverride, autoCols)) : autoCols;
  const rows = Math.max(1, Math.floor(availH / rowH));

  return {
    pageW,
    pageH,
    ox: round3((pageW - cols * cell) / 2),
    oy: round3(cfg.marginY + headerH),
    cols,
    rows,
    cell,
    band,
    rowH,
  };
}

export interface StrokeLayoutOptions {
  mode: StrokeMode;
  counts: Record<string, number | null>; // 字 → 笔画数（无数据为 null）
}

const noStroke: StrokeLayoutOptions = { mode: 'off', counts: {} };

export function buildCells(
  text: string,
  traceCount: number,
  blankCount: number,
  stroke: StrokeLayoutOptions = noStroke,
  wordMode = false,
): Cell[] {
  const out: Cell[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/);
  let gid = 0; // 每字/词的描红+空白（+笔顺）格算一组
  lines.forEach((line, li) => {
    if (wordMode) {
      for (const token of line.split(/\s+/)) {
        if (!token) continue;
        const g = ++gid;
        for (let i = 0; i < Math.max(0, traceCount); i++) out.push({ ch: token, ref: token, mode: 'trace', g });
        for (let i = 0; i < Math.max(0, blankCount); i++) out.push({ ch: '', ref: token, mode: 'blank', g });
      }
    } else {
      for (const ch of [...line]) {
        if (ch.trim() === '') continue;
        const first = !seen.has(ch);
        seen.add(ch);
        const g = ++gid;
        if (stroke.mode !== 'off' && (stroke.mode === 'repeat' || first)) {
          const n = stroke.counts[ch];
          for (let i = 1; i <= (n ?? 0); i++) out.push({ ch, ref: ch, mode: 'stroke', n: i, g });
        }
        for (let i = 0; i < Math.max(0, traceCount); i++) out.push({ ch, ref: ch, mode: 'trace', g });
        for (let i = 0; i < Math.max(0, blankCount); i++) out.push({ ch: '', ref: ch, mode: 'blank', g });
      }
    }
    if (li < lines.length - 1) out.push({ ch: '\n', ref: '', mode: 'break' });
  });
  return out;
}

export function paginate(cells: Cell[], cols: number, rows: number, vertical = false): Cell[][] {
  const perPage = cols * rows;
  const pages: Cell[][] = [];
  let cur: Cell[] = [];

  const flushFullPages = () => {
    while (cur.length >= perPage) {
      pages.push(cur.slice(0, perPage));
      cur = cur.slice(perPage);
    }
  };

  // 换行 = 结束当前「行」：横排补满列，竖排补满列高（另起一列）
  const group = vertical ? rows : cols;
  const pad: Cell = { ch: '', ref: '', mode: 'blank' };

  for (const cell of cells) {
    if (cell.mode === 'break') {
      const remain = group - (cur.length % group);
      if (remain < group) for (let i = 0; i < remain; i++) cur.push(pad);
    } else {
      cur.push(cell);
    }
    flushFullPages();
  }
  if (cur.length > 0) {
    while (cur.length < perPage) cur.push(pad);
    pages.push(cur);
  }
  return pages;
}
