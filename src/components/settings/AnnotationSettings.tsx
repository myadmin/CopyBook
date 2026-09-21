// 设置面板 · 拼音注音与笔顺分步格
import { useMemo, useState } from 'react';
import type { CopybookConfig, StrokeMode } from '../../core/types';
import { STROKE_MODE_LABELS } from '../../core/types';
import { pinyinCandidates, pinyinMapForText, uniqueHanChars } from '../../core/pinyin';
import { annotationGate } from '../../core/derive';
import { speakChar } from '../../core/speech';
import { Check, Group, Range, type SetCfg } from '../fields';
import StrokePreview from '../StrokePreview';

export default function AnnotationSettings({ cfg, set }: { cfg: CopybookConfig; set: SetCfg }) {
  const [previewChar, setPreviewChar] = useState('');
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
  // 竖排/英语格/毛笔版式下拼音带与笔顺不适用（与 layout、渲染端的规则同源）
  const { blocked: featureBlocked, reason: blockedReason } = annotationGate(cfg);

  return (
    <>
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
            <div className="hint-line">点字听读音、看逐笔笔顺演示：</div>
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
    </>
  );
}
