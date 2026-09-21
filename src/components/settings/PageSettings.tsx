// 设置面板 · 页面尺寸与打印设置
import type { CopybookConfig } from '../../core/types';
import { Check, Group, Num, type SetCfg } from '../fields';

export default function PageSettings({ cfg, set }: { cfg: CopybookConfig; set: SetCfg }) {
  return (
    <Group title="页面与打印">
      <div className="row">
        <Num label="左右边距" value={cfg.marginX} min={0} max={40} unit="mm" onChange={v => set({ marginX: v })} />
        <Num label="上下边距" value={cfg.marginY} min={0} max={40} unit="mm" onChange={v => set({ marginY: v })} />
      </div>
      <Check label="横向（横放 A4）" checked={cfg.landscape} onChange={v => set({ landscape: v })} />
      <label className="field">
        <span>每行格数</span>
        <input type="number" value={cfg.colsOverride ?? ''} min={1} max={30} placeholder="自动"
          onChange={e => {
            const v = e.target.value;
            set({ colsOverride: v === '' ? null : Math.min(30, Math.max(1, Math.floor(parseFloat(v) || 1))) });
          }} />
      </label>
      <Check label="页眉（标题 + 姓名日期栏）" checked={cfg.showHeader} onChange={v => set({ showHeader: v })} />
      {cfg.showHeader && (
        <label className="field">
          <span>标题</span>
          <input type="text" value={cfg.headerTitle} onChange={e => set({ headerTitle: e.target.value })} />
        </label>
      )}
      <Check label="页码" checked={cfg.showPageNum} onChange={v => set({ showPageNum: v })} />
    </Group>
  );
}
