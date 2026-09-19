// 左侧设置面板：字帖类型 / 内容 / 拼音 / 笔顺 / 版式 / 格子 / 字体 / 颜色 / 页面
import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { CopybookConfig, CopybookKind, GridType, StrokeMode } from '../core/types';
import {
  BRUSH_LAYOUT_LABELS, DEFAULT_CONFIG, FONT_OPTIONS, GRID_LABELS,
  KIND_LABELS, KIND_PRESETS, STROKE_MODE_LABELS,
} from '../core/types';
import { pinyinCandidates, pinyinMapForText, uniqueHanChars } from '../core/pinyin';
import { CONTENT_LIBRARY } from '../core/content';
import { loadTemplates, saveTemplates, type SavedTemplate } from '../core/templates';
import { clearImportedFont, IMPORTED_FAMILY, importFontFile, importedFontName, subscribeImported } from '../core/fonts';
import { speakChar } from '../core/speech';
import StrokePreview from './StrokePreview';

type SetCfg = (patch: Partial<CopybookConfig>) => void;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group">
      <summary>{title}</summary>
      <div className="group-body">{children}</div>
    </details>
  );
}

function Num({ label, value, min, max, step = 1, unit, onChange }:
  { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(clamp(v, min, max));
        }} />
      {unit && <span className="val">{unit}</span>}
    </label>
  );
}

function Range({ label, value, min, max, step, unit = '', onChange }:
  { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="range" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value))} />
      <span className="val">{value}{unit}</span>
    </label>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} />
      <span className="val">{value}</span>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default function SettingsPanel({ cfg, set }: { cfg: CopybookConfig; set: SetCfg }) {
  const [previewChar, setPreviewChar] = useState('');
  const [libCat, setLibCat] = useState(0);
  const [libItem, setLibItem] = useState(0);
  const [tplName, setTplName] = useState('');
  const [tplList, setTplList] = useState<SavedTemplate[]>(() => loadTemplates());
  const [fontMsg, setFontMsg] = useState(''); // 本地字体导入结果提示
  const impName = useSyncExternalStore(subscribeImported, importedFontName); // 导入/恢复/移除时自动刷新

  const saveTpl = () => {
    const name = tplName.trim() || `模板 ${tplList.length + 1}`;
    const next = [...tplList.filter(t => t.name !== name), { name, cfg }]; // 同名即覆盖更新
    saveTemplates(next);
    setTplList(next);
    setTplName('');
  };
  const delTpl = (name: string) => {
    const next = tplList.filter(t => t.name !== name);
    saveTemplates(next);
    setTplList(next);
  };

  const tone = cfg.pinyinPlain ? 'none' : 'symbol';
  const hanChars = useMemo(() => uniqueHanChars(cfg.text), [cfg.text]);
  const pyMap = useMemo(
    () => pinyinMapForText(cfg.text, cfg.polyphones, tone),
    [cfg.text, cfg.polyphones, tone],
  );
  // 文本中有多个读音的字 → 展示读音选择
  const polyChars = useMemo(
    () => hanChars.filter((ch) => pinyinCandidates(ch, tone).length > 1),
    [hanChars, tone],
  );

  const calLayout = cfg.kind === 'brush' && cfg.brushLayout !== 'grid';
  // 拼音带与笔顺在竖排/英语格/毛笔版式下不适用（与 layout 的强制规则保持一致）
  const featureBlocked =
    cfg.grid === 'hengxian' || cfg.grid === 'english' || cfg.writing === 'v' || calLayout;
  const blockedReason =
    cfg.grid === 'hengxian' ? '横线行款格' :
    cfg.grid === 'english' ? '英语四线格' :
    cfg.writing === 'v' ? '竖排版式' : '毛笔版式';

  return (
    <div className="settings">
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

      <Group title="内容库">
        {(() => {
          const cat = CONTENT_LIBRARY[libCat];
          const itemIdx = Math.min(libItem, cat.items.length - 1);
          const item = cat.items[itemIdx];
          return (
            <>
              <label className="field">
                <span>分类</span>
                <select value={libCat} onChange={e => { setLibCat(Number(e.target.value)); setLibItem(0); }}>
                  {CONTENT_LIBRARY.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>篇目</span>
                <select value={itemIdx} onChange={e => {
                  const i = Number(e.target.value);
                  setLibItem(i);
                  // 选择即替换练习文字；拼音/英语篇目自动切换到英语四线格，选回中文篇目时切回田字格
                  set(cat.grid ? { text: cat.items[i].text, grid: cat.grid, writing: 'h', showPinyin: false }
                    : cfg.grid === 'english' ? { text: cat.items[i].text, grid: 'tian', cellSize: 14 }
                      : { text: cat.items[i].text });
                }}>
                  {cat.items.map((it, i) => <option key={it.name} value={i}>{it.name}</option>)}
                </select>
              </label>
              <button className="mini" onClick={() => set({
                text: (cfg.text.trim() ? cfg.text.replace(/\n+$/, '') + '\n' : '') + item.text,
              })}>把「{item.name.split(' · ')[0]}」追加到现有文字之后</button>
              <div className="hint-line">选择篇目即替换上方练习文字（拼音/英语篇目自动切换四线格）；内容均为公版古诗词、常用字表、蒙学经典与基础词表。</div>
            </>
          );
        })()}
      </Group>

      <Group title="我的模板">
        <div className="row">
          <input className="tpl-name" value={tplName} placeholder="模板名称（重名即更新）"
            onChange={e => setTplName(e.target.value)} />
          <button className="mini" onClick={saveTpl}>保存当前设置</button>
        </div>
        {tplList.length === 0 ? (
          <div className="hint-line">把调好的设置（含练习文字）命名保存，之后可一键套用。当前设置本身也会自动记住。</div>
        ) : (
          <div className="tpl-list">
            {tplList.map(t => (
              <div className="tpl-item" key={t.name}>
                <div className="tpl-info">
                  <b>{t.name}</b>
                  <span className="tpl-sub">
                    {GRID_LABELS[t.cfg.grid]} · {t.cfg.cellSize}mm · 描红×{t.cfg.traceCount} 空白×{t.cfg.blankCount}
                    {t.cfg.text.trim() ? ` · ${[...t.cfg.text.replace(/\s/g, '')].length} 字` : ' · 无文字'}
                  </span>
                </div>
                <button className="mini" onClick={() => set(t.cfg)}>套用</button>
                <button className="mini" onClick={() => delTpl(t.name)}>删除</button>
              </div>
            ))}
          </div>
        )}
      </Group>

      <Group title="拼音">
        <Check label="拼音注音（格上方四线三格）" checked={cfg.showPinyin} onChange={v => set({ showPinyin: v })} />
        {cfg.showPinyin && featureBlocked && (
          <div className="hint-line">{blockedReason}不支持拼音带</div>
        )}
        {cfg.showPinyin && !featureBlocked && (
          <>
            <div className="row">
              <Check label="不标声调" checked={cfg.pinyinPlain} onChange={v => set({ pinyinPlain: v })} />
              <Check label="空白格也注音" checked={cfg.showPinyinOnBlank} onChange={v => set({ showPinyinOnBlank: v })} />
            </div>
            <Range label="拼音大小" value={cfg.pinyinScale} min={0.14} max={0.32} step={0.01}
              onChange={v => set({ pinyinScale: v })} />
            {polyChars.length > 0 && (
              <div className="poly-box">
                <div className="hint-line">多音字（按词自动选音，可手动改）：</div>
                <div className="poly-list">
                  {polyChars.map(ch => {
                    const cands = pinyinCandidates(ch, tone);
                    const cur = pyMap[ch] ?? cands[0];
                    const opts = cands.includes(cur) ? cands : [cur, ...cands];
                    return (
                      <span className="poly-item" key={ch}>
                        <b>{ch}</b>
                        <select value={cur}
                          onChange={e => set({ polyphones: { ...cfg.polyphones, [ch]: e.target.value } })}>
                          {opts.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {cfg.polyphones[ch] && (
                          <button className="mini" title="恢复自动读音" onClick={() => {
                            const next = { ...cfg.polyphones };
                            delete next[ch];
                            set({ polyphones: next });
                          }}>↺</button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </Group>

      <Group title="笔顺">
        <label className="field">
          <span>笔顺分步格</span>
          <select value={cfg.strokeMode} onChange={e => set({ strokeMode: e.target.value as StrokeMode })}>
            {(Object.keys(STROKE_MODE_LABELS) as StrokeMode[]).map(m => (
              <option key={m} value={m}>{STROKE_MODE_LABELS[m]}</option>
            ))}
          </select>
        </label>
        {cfg.strokeMode !== 'off' && (featureBlocked ? (
          <div className="hint-line">{blockedReason}不支持笔顺分步格</div>
        ) : (
          <>
            <Check label="标注笔画编号" checked={cfg.strokeShowNumber} onChange={v => set({ strokeShowNumber: v })} />
            {cfg.strokeShowNumber && (
              <Check label="仅首格显示编号" checked={cfg.strokeNumberFirstOnly}
                onChange={v => set({ strokeNumberFirstOnly: v })} />
            )}
            <div className="hint-line">每格累进显示笔画，新笔高亮；数据存本地，离线可用</div>
          </>
        ))}
        {hanChars.length > 0 && (
          <div className="stroke-preview-box">
            <div className="hint-line">点字观看笔顺动画并听读音：</div>
            <div className="char-chips">
              {hanChars.map(ch => (
                <button key={ch} className={previewChar === ch ? 'chip active' : 'chip'}
                  onClick={() => {
                    if (previewChar === ch) setPreviewChar('');
                    else { setPreviewChar(ch); speakChar(ch); }
                  }}>{ch}</button>
              ))}
            </div>
            {previewChar && <StrokePreview char={previewChar} />}
          </div>
        )}
      </Group>

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
    </div>
  );
}
