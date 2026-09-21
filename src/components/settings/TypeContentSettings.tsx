// 设置面板 · 字帖类型与练习内容
import type { CopybookConfig, CopybookKind } from '../../core/types';
import { KIND_LABELS, KIND_PRESETS } from '../../core/types';
import { Group, Num, type SetCfg } from '../fields';

export default function TypeContentSettings({ cfg, set }: { cfg: CopybookConfig; set: SetCfg }) {
  return (
    <>
      <Group title="字帖类型">
        <div className="kind-tabs">
          {(Object.keys(KIND_LABELS) as CopybookKind[]).map(k => (
            <button key={k} className={cfg.kind === k ? 'active' : ''}
              onClick={() => set({ kind: k, ...KIND_PRESETS[k] })}>
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>
      </Group>

      <Group title="内容">
        <textarea rows={4} value={cfg.text} placeholder="输入要练习的字，换行表示另起一行"
          onChange={e => set({ text: e.target.value })} />
        <div className="row">
          <Num label="描红" value={cfg.traceCount} min={0} max={9} onChange={v => set({ traceCount: v })} />
          <Num label="空白" value={cfg.blankCount} min={0} max={9} onChange={v => set({ blankCount: v })} />
        </div>
        <button onClick={() => set({
          kind: 'pencil', ...KIND_PRESETS.pencil,
          traceCount: cfg.traceCount, blankCount: cfg.blankCount, // 描红/空白数量跟随上方设置，不被模板拍回固定值
          showPinyin: true, strokeMode: 'first', strokeShowNumber: true,
          grid: 'tian', cellSize: 14,
        })}>生字行模板：拼音＋笔顺＋描红×{cfg.traceCount}＋空白×{cfg.blankCount}（数量在上方修改）</button>
        <div className="row">
          <button onClick={() => set({
            kind: 'pencil', ...KIND_PRESETS.pencil,
            showPinyin: true, showPinyinOnBlank: true, pinyinPlain: false,
            traceCount: 0, blankCount: 8, strokeMode: 'off', grid: 'tian', cellSize: 14,
          })}>听写帖：全空白格＋拼音提示</button>
          <button onClick={() => set({
            kind: 'pen', ...KIND_PRESETS.pen,
            grid: 'english', cellSize: 12, showPinyin: false, strokeMode: 'off',
            traceCount: 1, blankCount: 2,
          })}>英语四线格描红</button>
        </div>
      </Group>
    </>
  );
}
