// 单张 A4 字帖页的 SVG 渲染：viewBox 1 单位 = 1mm，打印即为物理尺寸
import type { ReactNode } from 'react';
import type { Cell } from '../core/layout';
import type { CopybookConfig } from '../core/types';
import { GRID_SPECS } from '../core/types';
import type { Geometry } from '../core/layout';
import type { StrokeData } from '../core/strokes';
import { luma } from '../core/color';

const f = (n: number) => Math.round(n * 1000) / 1000;

export default function GridSheet({
  cells, geom, cfg, pageNo, totalPages, pinyin, strokeData,
}: {
  cells: Cell[];
  geom: Geometry;
  cfg: CopybookConfig;
  pageNo: number;
  totalPages: number;
  pinyin: Record<string, string>;
  strokeData: Record<string, StrokeData | null>;
}) {
  const { pageW, pageH, ox, oy, cols, rows, cell, band, rowH } = geom;
  const spec = GRID_SPECS[cfg.grid];
  const lw = cfg.gridLineWidth;
  const dashLen = f(Math.max(0.7, cell * 0.05));
  const usedW = cols * cell;
  const vertical = cfg.writing === 'v' && cfg.brushLayout === 'grid';
  // 碑帖等深色底：拼音、页眉、页码改用浅色，保证可读（浅底维持原色）
  const darkBg = cfg.useGridBg && luma(cfg.gridBg) < 0.45;
  const mutedInk = darkBg ? '#e6d9b8' : '#333';
  const faintInk = darkBg ? '#b9b2a5' : '#999';

  // 外框/表格线：拼音开启时每行 = 拼音带 + 字格，横线只画在字格上下沿
  const tableSegs: string[] = [];
  if (spec.ruled) {
    for (let j = 0; j <= rows; j++) {
      const y = f(oy + j * rowH);
      tableSegs.push(`M${f(ox)},${y}H${f(ox + usedW)}`);
    }
  } else {
    for (let j = 0; j < rows; j++) {
      const gy0 = oy + j * rowH + band;
      const gy1 = gy0 + cell;
      tableSegs.push(`M${f(ox)},${f(gy0)}H${f(ox + usedW)}`);
      if (j === rows - 1) tableSegs.push(`M${f(ox)},${f(gy1)}H${f(ox + usedW)}`);
      for (let i = 0; i <= cols; i++) {
        const x = f(ox + i * cell);
        tableSegs.push(`M${x},${f(gy0)}V${f(gy1)}`);
      }
    }
  }

  // 拼音四线三格
  const bandSegs: string[] = [];
  if (band > 0) {
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < 4; i++) {
        const y = f(oy + j * rowH + (band * (i + 0.5)) / 4);
        bandSegs.push(`M${f(ox)},${y}H${f(ox + usedW)}`);
      }
    }
  }

  // 每格内部辅助线组 + 定位点 + 范字 + 拼音 + 笔顺分步
  const solidSegs: string[] = [];
  const dashedSegs: string[] = [];
  const dots: [number, number][] = [];
  const dotR = Math.max(0.35, cell * 0.022);
  const texts: ReactNode[] = [];
  const strokeLayers: ReactNode[] = [];

  // 英语四线三格：第二条虚线 + 第三条基线（实线），首尾线由表格横线充当
  if (spec.fourline) {
    for (let j = 0; j < rows; j++) {
      const yA = f(oy + j * rowH + cell / 3);
      const yB = f(oy + j * rowH + (2 * cell) / 3);
      dashedSegs.push(`M${f(ox)},${yA}H${f(ox + usedW)}`);
      solidSegs.push(`M${f(ox)},${yB}H${f(ox + usedW)}`);
    }
  }

  cells.forEach((c, k) => {
    // 竖排：列优先、自右向左；横排：行优先
    const col = vertical ? Math.floor(k / rows) : k % cols;
    const r = vertical ? k % rows : Math.floor(k / cols);
    const x0 = vertical ? ox + (cols - 1 - col) * cell : ox + col * cell;
    const y0 = oy + r * rowH + band;
    const x1 = x0 + cell;
    const y1 = y0 + cell;
    const cx = x0 + cell / 2;
    const cy = y0 + cell / 2;

    if (spec.cross !== 'none') {
      const seg = `M${f(cx)},${f(y0)}V${f(y1)}M${f(x0)},${f(cy)}H${f(x1)}`;
      (spec.cross === 'dash' ? dashedSegs : solidSegs).push(seg);
    }
    if (spec.diagonals !== 'none') {
      const seg = `M${f(x0)},${f(y0)}L${f(x1)},${f(y1)}M${f(x1)},${f(y0)}L${f(x0)},${f(y1)}`;
      (spec.diagonals === 'dash' ? dashedSegs : solidSegs).push(seg);
    }
    if (spec.ninePalace !== 'none') {
      const x13 = x0 + cell / 3, x23 = x0 + (2 * cell) / 3;
      const y13 = y0 + cell / 3, y23 = y0 + (2 * cell) / 3;
      const seg = `M${f(x13)},${f(y0)}V${f(y1)}M${f(x23)},${f(y0)}V${f(y1)}M${f(x0)},${f(y13)}H${f(x1)}M${f(x0)},${f(y23)}H${f(x1)}`;
      (spec.ninePalace === 'dash' ? dashedSegs : solidSegs).push(seg);
    }
    if (spec.innerSquare !== null) {
      const i = (cell * (1 - spec.innerSquare)) / 2;
      solidSegs.push(`M${f(x0 + i)},${f(y0 + i)}H${f(x1 - i)}V${f(y1 - i)}H${f(x0 + i)}Z`);
    }
    if (spec.lines357) {
      dashedSegs.push(
        `M${f(cx)},${f(y0)}V${f(y1)}M${f(x0)},${f(y0 + cell * 0.3)}H${f(x1)}M${f(x0)},${f(y0 + cell * 0.7)}H${f(x1)}`,
      );
    }
    if (spec.dots === 'center' || spec.dots === 'both') dots.push([cx, cy]);
    if (spec.dots === 'corners' || spec.dots === 'both') {
      const p = Math.max(0.8, cell * 0.05);
      dots.push([x0 + p, y0 + p], [x1 - p, y0 + p], [x1 - p, y1 - p], [x0 + p, y1 - p]);
    }
    if (cfg.showCenterDot && spec.dots === 'none') dots.push([cx, cy]);

    if (c.mode === 'trace' && c.ch) {
      const ink = cfg.charOutline
        ? { fill: 'none', stroke: cfg.charColor, strokeWidth: f(Math.max(0.12, cell * 0.012)) }
        : { fill: cfg.charColor, fillOpacity: cfg.charOpacity };
      if (spec.fourline) {
        const len = [...c.ch].length;
        // 长词自动缩字号，但不低于 2mm（约 5.7pt，保证可读写）；极端超长词允许居中轻微越格
        const fs = f(Math.max(2, Math.min(cell * cfg.charScale * 0.72, (cell * 0.94) / (0.55 * len))));
        texts.push(
          <text key={k} x={f(cx)} y={f(y0 + (2 * cell) / 3 + cfg.charOffsetY)} textAnchor="middle"
            dominantBaseline="alphabetic" fontSize={fs} fontWeight={cfg.bold ? 700 : 400}
            {...ink}>{c.ch}</text>,
        );
      } else {
        const fs = f(cell * cfg.charScale);
        const ty = spec.ruled ? y1 - cell * 0.15 + cfg.charOffsetY : cy + cfg.charOffsetY;
        texts.push(
          <text key={k} x={f(cx)} y={f(ty)} textAnchor="middle"
            dominantBaseline={spec.ruled ? 'alphabetic' : 'central'}
            fontSize={fs} fontWeight={cfg.bold ? 700 : 400} {...ink}>{c.ch}</text>,
        );
      }
    }

    // 空白格的拼音只标在每组第一格（听写帖一组空格标一次拼音）；描红格保持原有逐格标注
    const blankGroupStart = c.mode === 'blank' && cfg.showPinyinOnBlank && c.ref && cells[k - 1]?.g !== c.g;
    if (band > 0 && (c.mode === 'trace' || blankGroupStart)) {
      const py = pinyin[c.ref];
      if (py) {
        // 深底（碑帖）上拼音易被暗背景吞掉：加大 + 加粗 + 不透明
        texts.push(
          <text key={`p${k}`} x={f(cx)} y={f(oy + r * rowH + band * 0.56)} textAnchor="middle"
            dominantBaseline="central" fontSize={f(cell * cfg.pinyinScale * (darkBg ? 1.12 : 1))}
            fontWeight={darkBg ? 600 : undefined} fill={mutedInk}
            fillOpacity={darkBg ? 1 : 0.9}>{py}</text>,
        );
      }
    }

    if (c.mode === 'stroke' && c.ch) {
      const data = strokeData[c.ch];
      const nTotal = data ? data.strokes.length : 0;
      const kth = Math.min(c.n ?? 1, nTotal);
      if (data && kth > 0) {
        const pad = cell * 0.07;
        const s = (cell - 2 * pad) / 1024;
        const gx = x0 + pad;
        const gy = y1 - pad; // 数据 y 轴向上 → 以格底为原点翻转
        const showNum = cfg.strokeShowNumber && (!cfg.strokeNumberFirstOnly || kth === 1);
        let label: ReactNode = null;
        if (showNum) {
          // 编号做成右上角白底圆徽，避免压住笔画
          const bx = x1 - cell * 0.16;
          const by = y0 + cell * 0.16;
          label = (
            <g>
              <circle cx={f(bx)} cy={f(by)} r={f(cell * 0.115)} fill="#fff" fillOpacity={0.92}
                stroke={cfg.charColor} strokeWidth={f(lw * 0.6)} />
              <text x={f(bx)} y={f(by)} textAnchor="middle" dominantBaseline="central"
                fontSize={f(cell * 0.14)} fontWeight={700}
                fill={luma(cfg.charColor) > 0.6 ? '#4a4a4a' : cfg.charColor}
                style={{ fontFamily: 'system-ui, sans-serif' }}>{kth}</text>
            </g>
          );
        }
        strokeLayers.push(
          <g key={`s${k}`}>
            <g transform={`translate(${f(gx)} ${f(gy)}) scale(${f(s)} ${f(-s)})`}>
              {data.strokes.slice(0, kth - 1).map((d, i) => (
                // 已写笔画：浅底用浅灰、深底用暗灰，都与「当前笔」(charColor) 拉开层次
                <path key={i} d={d} fill={darkBg ? '#6e675c' : '#c3c8d0'} />
              ))}
              <path d={data.strokes[kth - 1]} fill={cfg.charColor} fillOpacity={0.85} />
            </g>
            {label}
          </g>,
        );
      }
    }
  });

  const fontFamily = cfg.customFont.trim()
    ? `'${cfg.customFont.trim()}', ${cfg.fontFamily}`
    : cfg.fontFamily;

  return (
    <svg className="sheet" width={`${pageW}mm`} height={`${pageH}mm`}
      viewBox={`0 0 ${pageW} ${pageH}`} style={{ fontFamily }}>
      {cfg.useGridBg && <rect x={0} y={0} width={pageW} height={pageH} fill={cfg.gridBg} />}

      {cfg.showHeader && (
        <g>
          <text x={f(ox)} y={f(oy - 2.6)} fontSize={4.6} fontWeight={600} fill={darkBg ? '#d8cdb6' : '#555'}>{cfg.headerTitle}</text>
          <text x={f(ox + usedW)} y={f(oy - 2.6)} fontSize={4} fill={darkBg ? '#d8cdb6' : '#555'} textAnchor="end">
            姓名：＿＿＿＿＿　日期：＿＿＿＿＿
          </text>
        </g>
      )}

      <path d={tableSegs.join('')} stroke={cfg.gridColor} strokeWidth={lw} fill="none" strokeLinecap="square" />
      {bandSegs.length > 0 && (
        <path d={bandSegs.join('')} stroke={cfg.gridColor} strokeWidth={f(lw * 0.55)}
          strokeOpacity={0.75} fill="none" />
      )}
      {cfg.doubleBorder && !spec.ruled && (
        <rect x={f(ox - 1.2)} y={f(oy - 1.2)} width={f(usedW + 2.4)} height={f(rows * rowH + 2.4)}
          fill="none" stroke={cfg.gridColor} strokeWidth={lw} />
      )}
      {solidSegs.length > 0 && (
        <path d={solidSegs.join('')} stroke={cfg.gridColor} strokeWidth={f(lw * 0.75)} fill="none" />
      )}
      {dashedSegs.length > 0 && (
        <path d={dashedSegs.join('')} stroke={cfg.gridColor} strokeWidth={f(lw * 0.75)} fill="none"
          strokeDasharray={`${dashLen} ${dashLen}`} />
      )}
      {dots.map(([dx, dy], i) => (
        <circle key={i} cx={f(dx)} cy={f(dy)} r={f(dotR)} fill={cfg.gridColor} />
      ))}
      {texts}
      {strokeLayers}
      {cfg.showPageNum && totalPages > 1 && (
        <text x={f(pageW / 2)} y={f(pageH - 3)} textAnchor="middle" fontSize={3.2} fill={faintInk}>
          第 {pageNo} / {totalPages} 页
        </text>
      )}
    </svg>
  );
}
