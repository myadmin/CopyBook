// 毛笔版式规划：竖幅条幅 / 斗方 / 对联。竖写从右至左，字号可按内容自适应。
import type { CopybookConfig } from './types';

export interface CalChar {
  ch: string;
  cx: number;
  cy: number;
}

export interface CalStrip {
  x: number;
  y: number;
  w: number;
  h: number;
  chars: CalChar[];
}

export interface CalPage {
  strips: CalStrip[];
  cell: number;
}

const HEADER_H = 8;

export interface CalPlan {
  pageW: number;
  pageH: number;
  ox: number; // 页眉标题起点
  oy: number;
  usedW: number;
  pages: CalPage[];
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function planCalligraphy(cfg: CopybookConfig): CalPlan {
  const pageW = cfg.landscape ? 297 : 210;
  const pageH = cfg.landscape ? 210 : 297;
  const headerH = cfg.showHeader ? HEADER_H : 0;
  const ox = cfg.marginX;
  const oy = round3(cfg.marginY + headerH);
  const availW = pageW - 2 * cfg.marginX;
  const availH = pageH - 2 * cfg.marginY - headerH;

  const charsOf = (s: string) => [...s].filter((c) => c.trim() !== '');
  const cell = Math.max(4, cfg.cellSize);

  let pages: CalPage[] = [];

  if (cfg.brushLayout === 'banner') {
    const chars = charsOf(cfg.text);
    const per = Math.max(1, Math.floor(availH / cell));
    const colX = round3((pageW - cell) / 2);
    for (let p = 0; p * per < chars.length; p++) {
      const slice = chars.slice(p * per, (p + 1) * per);
      pages.push({
        cell,
        strips: [{
          x: colX, y: oy, w: cell, h: slice.length * cell,
          chars: slice.map((ch, i) => ({ ch, cx: round3(colX + cell / 2), cy: round3(oy + i * cell + cell / 2) })),
        }],
      });
    }
  } else if (cfg.brushLayout === 'duilian') {
    const lines = cfg.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let a: string[];
    let b: string[];
    if (lines.length >= 2) {
      a = charsOf(lines[0]);
      b = charsOf(lines.slice(1).join(''));
    } else {
      const all = charsOf(cfg.text);
      a = all.slice(0, Math.ceil(all.length / 2));
      b = all.slice(Math.ceil(all.length / 2));
    }
    // 字号三重上限：用户设定、页高（超长联另行分页兜底）、页宽——
    // 双联总宽 2.9c，双边框再各外扩 2.6mm，保证大字号短联也不横向出页
    const maxW = Math.floor((availW - 5.2) / 2.9);
    const c = Math.max(4, Math.min(cfg.cellSize, maxW, Math.floor(availH / Math.max(1, a.length, b.length))));
    const gap = c * 0.9;
    const strip = (chars: string[], x: number): CalStrip => ({
      x: round3(x), y: oy, w: c, h: chars.length * c,
      chars: chars.map((ch, i) => ({ ch, cx: round3(x + c / 2), cy: round3(oy + i * c + c / 2) })),
    });
    const rightX = pageW / 2 + gap / 2;   // 上联居右
    const leftX = pageW / 2 - gap / 2 - c; // 下联居左
    // 超长联：上下联按页高同步切段，每段一页，保证不出页（4mm 字号下限不破）
    const per = Math.max(1, Math.floor(availH / c));
    for (let p = 0; p * per < Math.max(a.length, b.length); p++) {
      // 上下联字数不等时，后段先耗尽的一侧不画 0 字空框
      const segs = [strip(a.slice(p * per, (p + 1) * per), rightX), strip(b.slice(p * per, (p + 1) * per), leftX)]
        .filter((s) => s.chars.length > 0);
      pages.push({ cell: c, strips: segs });
    }
  } else if (cfg.brushLayout === 'doufang') {
    const chars = charsOf(cfg.text);
    // 单页容量：4mm 字号下限下页内最多可放的格数，超出则换页
    const colsMax = Math.max(1, Math.floor(availW / 4));
    const rowsMax = Math.max(1, Math.floor(availH / 4));
    const per = colsMax * rowsMax;
    for (let p = 0; p * per < chars.length; p++) {
      const chunk = chars.slice(p * per, (p + 1) * per);
      let cols = Math.max(1, Math.min(colsMax, Math.ceil(Math.sqrt(chunk.length))));
      let rows = Math.max(1, Math.ceil(chunk.length / cols));
      if (rows > rowsMax) { // 高越界则加宽列数再算一次
        cols = Math.max(1, Math.min(colsMax, Math.ceil(chunk.length / rowsMax)));
        rows = Math.max(1, Math.ceil(chunk.length / cols));
      }
      const c = Math.max(4, Math.min(cfg.cellSize, availW / cols, availH / rows));
      const blockW = cols * c;
      const blockH = rows * c;
      const bx = (pageW - blockW) / 2;
      const by = oy + (availH - blockH) / 2;
      const cal: CalChar[] = chunk.map((ch, i) => {
        const r = i % rows;
        const col = Math.floor(i / rows);
        return { ch, cx: round3(bx + blockW - (col + 0.5) * c), cy: round3(by + (r + 0.5) * c) };
      });
      pages.push({
        cell: c,
        strips: [{ x: round3(bx), y: round3(by), w: round3(blockW), h: round3(blockH), chars: cal }],
      });
    }
  }

  return { pageW, pageH, ox, oy, usedW: availW, pages };
}
