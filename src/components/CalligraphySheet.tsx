// 毛笔版式页渲染：条幅 / 斗方 / 对联（竖写从右至左），与 GridSheet 同一 mm 坐标系
import type { CalPlan } from '../core/calligraphy';
import type { CopybookConfig } from '../core/types';
import { GRID_SPECS } from '../core/types';
import { isDarkBg } from '../core/color';

const f = (n: number) => Math.round(n * 1000) / 1000;

export default function CalligraphySheet({
  plan, cfg, pageNo, totalPages,
}: {
  plan: CalPlan;
  cfg: CopybookConfig;
  pageNo: number;
  totalPages: number;
}) {
  const { pageW, pageH, ox, oy, usedW, pages } = plan;
  const page = pages[pageNo - 1];
  const lw = cfg.gridLineWidth;
  const cell = page.cell;
  const spec = GRID_SPECS[cfg.grid];
  const dashLen = f(Math.max(0.7, cell * 0.05));
  const darkBg = isDarkBg(cfg.useGridBg, cfg.gridBg); // 碑帖深底：页眉/页码换亮墨色

  const fontFamily = cfg.customFont.trim()
    ? `'${cfg.customFont.trim()}', ${cfg.fontFamily}`
    : cfg.fontFamily;
  const ink = cfg.charOutline
    ? { fill: 'none', stroke: cfg.charColor, strokeWidth: f(Math.max(0.15, cell * 0.012)) }
    : { fill: cfg.charColor, fillOpacity: cfg.charOpacity };

  // 单元格淡格线（边框 + 当前格子类型的辅助线）
  const guideDash: string[] = [];
  page.strips.forEach((s) => {
    s.chars.forEach((ch) => {
      const x0 = ch.cx - cell / 2, y0 = ch.cy - cell / 2;
      const x1 = ch.cx + cell / 2, y1 = ch.cy + cell / 2;
      guideDash.push(`M${f(x0)},${f(y0)}H${f(x1)}V${f(y1)}H${f(x0)}Z`);
      if (spec.cross !== 'none' || cfg.grid === 'tian') {
        guideDash.push(`M${f(ch.cx)},${f(y0)}V${f(y1)}M${f(x0)},${f(ch.cy)}H${f(x1)}`);
      }
      if (spec.diagonals !== 'none') {
        guideDash.push(`M${f(x0)},${f(y0)}L${f(x1)},${f(y1)}M${f(x1)},${f(y0)}L${f(x0)},${f(y1)}`);
      }
    });
  });

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

      {page.strips.map((s, i) => (
        <g key={i}>
          {cfg.doubleBorder && (
            <rect x={f(s.x - 2.6)} y={f(s.y - 2.6)} width={f(s.w + 5.2)} height={f(s.h + 5.2)}
              fill="none" stroke={cfg.gridColor} strokeWidth={f(lw * 0.8)} />
          )}
          <rect x={f(s.x - 1)} y={f(s.y - 1)} width={f(s.w + 2)} height={f(s.h + 2)}
            fill="none" stroke={cfg.gridColor} strokeWidth={f(lw * 1.5)} />
        </g>
      ))}

      {guideDash.length > 0 && (
        <path d={guideDash.join('')} stroke={cfg.gridColor} strokeWidth={f(lw * 0.55)}
          strokeOpacity={0.45} fill="none" strokeDasharray={`${dashLen} ${dashLen}`} />
      )}

      {page.strips.map((s, i) => (
        <g key={`t${i}`}>
          {s.chars.map((ch, j) => (
            <text key={j} x={f(ch.cx)} y={f(ch.cy + cfg.charOffsetY)} textAnchor="middle"
              dominantBaseline="central" fontSize={f(cell * cfg.charScale)}
              fontWeight={cfg.bold ? 700 : 400} {...ink}>{ch.ch}</text>
          ))}
        </g>
      ))}

      {cfg.showPageNum && totalPages > 1 && (
        <text x={f(pageW / 2)} y={f(pageH - 3)} textAnchor="middle" fontSize={3.2} fill={darkBg ? '#b9b2a5' : '#999'}>
          第 {pageNo} / {totalPages} 页
        </text>
      )}
    </svg>
  );
}
