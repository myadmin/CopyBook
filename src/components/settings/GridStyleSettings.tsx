// 设置面板 · 版式（横竖排 / 毛笔版式）与格子样式
import type { CopybookConfig, GridType } from '../../core/types';
import { BRUSH_LAYOUT_LABELS, GRID_LABELS } from '../../core/types';
import { isCalLayout } from '../../core/derive';
import { Check, Color, Group, Range, type SetCfg } from '../fields';

export default function GridStyleSettings({ cfg, set }: { cfg: CopybookConfig; set: SetCfg }) {
  const calLayout = isCalLayout(cfg);

  return (
    <>
      <Group title="版式">
        {cfg.kind === 'brush' && (
          <label className="field">
            <span>毛笔版式</span>
            <select value={cfg.brushLayout} title="条幅/斗方/对联为传统竖式版式，选择后自动切换为竖版纸"
              onChange={e => {
                const v = e.target.value as CopybookConfig['brushLayout'];
                set(v === 'grid' ? { brushLayout: v } : { brushLayout: v, landscape: false });
              }}>
              {(Object.keys(BRUSH_LAYOUT_LABELS) as CopybookConfig['brushLayout'][]).map(m => (
                <option key={m} value={m}>{BRUSH_LAYOUT_LABELS[m]}</option>
              ))}
            </select>
          </label>
        )}
        {(!calLayout) && (
          <Check label="竖排（自上而下、自右向左）" checked={cfg.writing === 'v'}
            onChange={v => set({ writing: v ? 'v' : 'h' })} />
        )}
        {calLayout && (
          <div className="hint-line">
            毛笔版式为竖写，字号随内容自适应，格线淡化，仅输出字幅；不适用拼音与笔顺（已自动切换为竖版纸）
          </div>
        )}
      </Group>

      <Group title="格子">
        <label className="field">
          <span>类型</span>
          <select value={cfg.grid} onChange={e => set({ grid: e.target.value as GridType })}>
            {(Object.keys(GRID_LABELS) as GridType[]).map(g => (
              <option key={g} value={g}>{GRID_LABELS[g]}</option>
            ))}
          </select>
        </label>
        <Range label="边长" value={cfg.cellSize} min={6} max={90} step={1} unit="mm"
          onChange={v => set({ cellSize: v })} />
        <div className="row">
          <Color label="线色" value={cfg.gridColor} onChange={v => set({ gridColor: v })} />
        </div>
        <Range label="线粗" value={cfg.gridLineWidth} min={0.1} max={1} step={0.05} unit="mm"
          onChange={v => set({ gridLineWidth: v })} />
        <Check label="双线外框" checked={cfg.doubleBorder} onChange={v => set({ doubleBorder: v })} />
        <Check label="格心点" checked={cfg.showCenterDot} onChange={v => set({ showCenterDot: v })} />
        <div className="row">
          <Check label="底色" checked={cfg.useGridBg} onChange={v => set({ useGridBg: v })} />
          {cfg.useGridBg && (
            <Color label="" value={cfg.gridBg} onChange={v => set({ gridBg: v })} />
          )}
        </div>
      </Group>
    </>
  );
}
