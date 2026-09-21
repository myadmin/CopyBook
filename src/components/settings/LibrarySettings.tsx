// 设置面板 · 内容库与我的模板
import { useState } from 'react';
import type { CopybookConfig } from '../../core/types';
import { GRID_LABELS } from '../../core/types';
import { CONTENT_LIBRARY } from '../../core/content';
import { loadTemplates, saveTemplates, type SavedTemplate } from '../../core/templates';
import { Group, type SetCfg } from '../fields';

export default function LibrarySettings({ cfg, set }: { cfg: CopybookConfig; set: SetCfg }) {
  const [libCat, setLibCat] = useState(0);
  const [libItem, setLibItem] = useState(0);
  const [tplName, setTplName] = useState('');
  const [tplList, setTplList] = useState<SavedTemplate[]>(() => loadTemplates());

  const cat = CONTENT_LIBRARY[libCat];
  const itemIdx = Math.min(libItem, cat.items.length - 1);
  const item = cat.items[itemIdx];

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

  return (
    <>
      <Group title="内容库">
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
    </>
  );
}
