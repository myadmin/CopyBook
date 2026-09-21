// 设置面板 · 字体（含本地字体导入）与范字颜色
import { useState, useSyncExternalStore } from 'react';
import type { CopybookConfig } from '../../core/types';
import { DEFAULT_CONFIG, FONT_OPTIONS } from '../../core/types';
import { clearImportedFont, IMPORTED_FAMILY, importFontFile, importedFontName, subscribeImported } from '../../core/fonts';
import { Check, Color, Group, Num, Range, type SetCfg } from '../fields';

export default function FontColorSettings({ cfg, set }: { cfg: CopybookConfig; set: SetCfg }) {
  const [fontMsg, setFontMsg] = useState(''); // 本地字体导入结果提示
  const impName = useSyncExternalStore(subscribeImported, importedFontName); // 导入/恢复/移除时自动刷新

  return (
    <>
      <Group title="字体">
        <label className="field">
          <span>字体</span>
          <select value={cfg.fontFamily} onChange={e => set({ fontFamily: e.target.value })}>
            {!FONT_OPTIONS.some(o => o.value === cfg.fontFamily) && (
              <option value={cfg.fontFamily}>导入的字体</option> // 导入字体会替换 select 值，保持显示
            )}
            {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>导入本地字体</span>
          <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={async e => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              await importFontFile(f);
              set({ fontFamily: `'${IMPORTED_FAMILY}', serif` });
              setFontMsg(`已导入「${f.name}」并套用（PNG 导出也会内嵌；已存本机，下次打开自动恢复）`);
            } catch (err) {
              setFontMsg(`导入失败：${(err as Error).message}`);
            }
          }} />
        </label>
        {impName && (
          <div className="row" style={{ alignItems: 'center' }}>
            <span className="hint-line" style={{ flex: 1 }}>当前已导入：{impName}</span>
            <button className="mini" title="从本页与本机记忆中移除（字体文件本身不会被删除）"
              onClick={() => {
                clearImportedFont();
                if (cfg.fontFamily.includes(IMPORTED_FAMILY)) set({ fontFamily: DEFAULT_CONFIG.fontFamily });
                setFontMsg('已移除导入字体');
              }}>移除</button>
          </div>
        )}
        {fontMsg && <div className="hint-line">{fontMsg}</div>}
        <label className="field">
          <span>自定义字体名</span>
          <input type="text" value={cfg.customFont} placeholder="本地字体名"
            title="调用系统已安装的字体，如：方正颜宋、华文隶书"
            onChange={e => set({ customFont: e.target.value })} />
        </label>
        <Range label="字形大小" value={cfg.charScale} min={0.4} max={1} step={0.02}
          onChange={v => set({ charScale: v })} />
        <Num label="上下微调" value={cfg.charOffsetY} min={-3} max={3} step={0.1} unit="mm"
          onChange={v => set({ charOffsetY: v })} />
        <Check label="加粗" checked={cfg.bold} onChange={v => set({ bold: v })} />
      </Group>

      <Group title="范字颜色">
        <Color label="颜色" value={cfg.charColor} onChange={v => set({ charColor: v })} />
        <Range label="浓度" value={cfg.charOpacity} min={0.05} max={1} step={0.05}
          onChange={v => set({ charOpacity: v })} />
        <Check label="双钩范字（空心字）" checked={cfg.charOutline} onChange={v => set({ charOutline: v })} />
        <div className="row">
          <button onClick={() => set({
            useGridBg: true, gridBg: '#2a231c', gridColor: '#b7985e',
            charColor: '#f3e3b8', charOpacity: 0.92,
          })}>碑帖配色</button>
          <button onClick={() => set({
            useGridBg: true, gridBg: '#fbf6ea', gridColor: '#8a9a7b',
            charColor: '#3a3a3a', charOpacity: 0.9,
          })}>宣纸配色</button>
          <button onClick={() => set({
            useGridBg: DEFAULT_CONFIG.useGridBg, gridBg: DEFAULT_CONFIG.gridBg,
            gridColor: DEFAULT_CONFIG.gridColor, charColor: DEFAULT_CONFIG.charColor,
            charOpacity: DEFAULT_CONFIG.charOpacity,
          })}>默认</button>
        </div>
      </Group>
    </>
  );
}
