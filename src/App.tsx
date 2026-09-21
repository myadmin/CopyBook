import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import SettingsPanel from './components/SettingsPanel';
import GridSheet from './components/GridSheet';
import CalligraphySheet from './components/CalligraphySheet';
import PageNav from './components/PageNav';
import { DEFAULT_CONFIG, type CopybookConfig } from './core/types';
import { isCalLayout, isRuled, isVertical } from './core/derive';
import { loadConfig, saveConfig, loadPageSpecHistory, pushPageSpecHistory } from './core/persist';
import { decodeShare, shareUrl } from './core/share';
import { restoreImportedFont } from './core/fonts';
import { exportSheetsAsPng } from './core/exportPng';
import { buildCells, computeGeometry, paginate } from './core/layout';
import { planCalligraphy } from './core/calligraphy';
import { pinyinMapForText, uniqueHanChars } from './core/pinyin';
import { loadStrokeData, type StrokeData } from './core/strokes';

// 文本中所有汉字的笔画数据：加载一次、内存缓存；无数据的字自动降级（跳过笔顺格）
function useStrokeData(text: string, enabled: boolean) {
  const [data, setData] = useState<Record<string, StrokeData | null>>({});
  const chars = useMemo(() => (enabled ? uniqueHanChars(text) : []), [text, enabled]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const pending = chars.filter((c) => !(c in data));
    if (!pending.length) return;
    Promise.all(pending.map(async (ch) => [ch, await loadStrokeData(ch)] as const))
      .then((pairs) => {
        if (alive) setData((prev) => Object.assign({}, prev, Object.fromEntries(pairs)));
      });
    return () => { alive = false; };
  }, [chars, enabled, data]);

  const ready = !enabled || chars.every((c) => c in data);
  return { data, ready };
}

export default function App() {
  // 分享链接（hash）优先于本地存档；hash 只是启动种子，之后一有改动即清除。
  // 解码是异步的（压缩链接需 DecompressionStream），期间用户已编辑则丢弃链接配置、尊重用户。
  const hashSeed = useRef(/[#&]c=/.test(location.hash));
  const [cfg, setCfg] = useState<CopybookConfig>(loadConfig);
  useEffect(() => {
    if (!hashSeed.current) return;
    decodeShare(location.hash).then(c => {
      if (c && hashSeed.current) setCfg(c);
    });
  }, []);
  useEffect(() => { restoreImportedFont().catch(() => {}); }, []); // 上次导入的本机字体自动恢复
  const [zoom, setZoom] = useState(0.85);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [psHistory] = useState(loadPageSpecHistory); // 最近 5 次页码写法，datalist 下拉可复用
  const [pageSpec, setPageSpec] = useState(() => loadPageSpecHistory()[0] ?? ''); // 选页导出：「1-2,4」，空 = 全部
  const msgTimer = useRef<number>();

  // 键入时每次按键都同步 stringify + 写 localStorage 太重，停顿后再落盘
  useEffect(() => {
    const t = window.setTimeout(() => saveConfig(cfg), 400);
    return () => window.clearTimeout(t);
  }, [cfg]);

  const set = useCallback((patch: Partial<CopybookConfig>) => {
    if (hashSeed.current) { // 用户在链接配置基础上继续编辑：地址栏退回干净 URL
      hashSeed.current = false;
      history.replaceState(null, '', location.href.split('#')[0]);
    }
    setCfg(c => ({ ...c, ...patch }));
  }, []);

  const flash = useCallback((msg: string) => {
    window.clearTimeout(msgTimer.current);
    setExportMsg(msg);
    msgTimer.current = window.setTimeout(() => setExportMsg(''), 8000);
  }, []);

  const onShare = useCallback(async () => {
    const url = await shareUrl(cfg);
    try {
      await navigator.clipboard.writeText(url);
      flash('分享链接已复制到剪贴板（含全部配置与练习文字）');
    } catch {
      location.hash = url.slice(url.indexOf('#')); // 剪贴板不可用：退回写入地址栏手动复制
      flash('已把配置写入地址栏，请手动复制完整链接');
    }
  }, [cfg, flash]);

  const onExport = useCallback(async () => {
    setExporting(true);
    setExportMsg('');
    window.clearTimeout(msgTimer.current); // 别让用户上一条提示的定时器清掉新消息
    try {
      const s = await exportSheetsAsPng(300, pageSpec, cfg.headerTitle);
      pushPageSpecHistory(pageSpec); // 导出成功才记入历史（空 = 全部，不记）
      const mb = (s.fontBytes / 1024 / 1024).toFixed(1);
      setExportMsg(`已导出 ${s.pages} 页${s.zipped ? ' PNG 并打包 zip' : ' PNG'}（300dpi，内联字体 ${s.fontFiles} 片 / ${mb}MB）`);
    } catch (e) {
      setExportMsg(`导出失败：${(e as Error).message}`);
    } finally {
      setExporting(false);
      msgTimer.current = window.setTimeout(() => setExportMsg(''), 8000);
    }
  }, [pageSpec, cfg.headerTitle]);

  const wordMode = cfg.grid === 'english'; // 英语四线格：按单词分格
  const calLayout = isCalLayout(cfg);      // 毛笔传统版式
  const vertical = isVertical(cfg);
  // 拼音带与笔顺的生效条件与面板提示一致（见 derive.ts 的 annotationGate）
  const ruled = isRuled(cfg); // 横线行款格/英语四线格不支持笔顺分步格
  const strokeEnabled = cfg.strokeMode !== 'off' && !wordMode && !vertical && !calLayout && !ruled;

  // 正文与预览解耦：输入框立即响应，拼音/笔顺/分页这些重活延后到空闲帧（不必为每个中间态算一遍）
  const previewText = useDeferredValue(cfg.text);

  const stroke = useStrokeData(previewText, strokeEnabled);
  const calPlan = useMemo(() => (calLayout ? planCalligraphy(cfg) : null), [cfg, calLayout]);

  const pinyin = useMemo(
    () => pinyinMapForText(previewText, cfg.polyphones, cfg.pinyinPlain ? 'none' : 'symbol'),
    [previewText, cfg.polyphones, cfg.pinyinPlain],
  );

  const geom = useMemo(() => computeGeometry(cfg), [cfg]);
  const cells = useMemo(
    () => buildCells(previewText, cfg.traceCount, cfg.blankCount, {
      mode: strokeEnabled ? cfg.strokeMode : 'off',
      counts: Object.fromEntries(
        Object.entries(stroke.data).map(([ch, d]) => [ch, d ? d.strokes.length : null]),
      ),
    }, wordMode),
    [previewText, cfg.traceCount, cfg.blankCount, strokeEnabled, cfg.strokeMode, stroke.data, wordMode],
  );
  const pages = useMemo(() => paginate(cells, geom.cols, geom.rows, vertical), [cells, geom, vertical]);

  const calPages = calPlan ? calPlan.pages : [];

  return (
    <div className="app">
      <style>{`@page { size: A4 ${cfg.landscape ? 'landscape' : 'portrait'}; margin: 0; }`}</style>

      <header className="toolbar">
        <h1>字帖生成器</h1>
        <span className="hint">打印时请选择「实际大小 / 100%」，边距选「无」</span>
        <div className="spacer" />
        <div className="zoom">
          <button onClick={() => setZoom(z => Math.max(0.3, Math.round((z - 0.1) * 10) / 10))}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10))}>+</button>
        </div>
        {exportMsg && <span className="export-msg">{exportMsg}</span>}
        <input className="page-spec" value={pageSpec} list="page-spec-history"
          placeholder={`页码如 1-2 或 1,3（共 ${pages.length || calPages.length} 页，空=全部）`}
          title="选页导出 PNG：支持 1-3、5 这类范围与单个页码，多页自动打包 zip；记住最近 5 次写法"
          onChange={e => setPageSpec(e.target.value)} />
        <datalist id="page-spec-history">
          {psHistory.map(s => <option key={s} value={s} />)}
        </datalist>
        <button onClick={onShare} title="把当前整套配置（含练习文字）生成链接复制到剪贴板，换设备/浏览器打开即还原">分享链接</button>
        <button className="primary" onClick={() => window.print()}>打印 / 导出 PDF</button>
        <button onClick={onExport} disabled={exporting}>{exporting ? '导出中…' : '导出图片 PNG'}</button>
        <button onClick={() => {
          hashSeed.current = false;
          history.replaceState(null, '', location.href.split('#')[0]); // 重置同时摆脱分享链接种子
          setPageSpec('');
          setCfg(DEFAULT_CONFIG);
        }}>重置</button>
      </header>

      <div className="main">
        <SettingsPanel cfg={cfg} set={set} />
        <div className="preview-area">
          {calLayout && calPages.length === 0 ? (
            <div className="empty">在左侧输入文字，字帖会在这里实时预览</div>
          ) : calLayout ? (
            <div className="sheets" style={{ transform: `scale(${zoom})` }}>
              {calPages.map((_, i) => (
                <div className="sheet-wrap" key={i}>
                  <CalligraphySheet plan={calPlan!} cfg={cfg} pageNo={i + 1} totalPages={calPages.length} />
                  <div className="page-label">第 {i + 1} / {calPages.length} 页</div>
                </div>
              ))}
            </div>
          ) : !stroke.ready ? (
            <div className="empty">正在加载笔顺数据…</div>
          ) : cfg.text.trim().length === 0 ? (
            <div className="empty">在左侧输入文字，字帖会在这里实时预览</div>
          ) : (
            <div className="sheets" style={{ transform: `scale(${zoom})` }}>
              {pages.map((p, i) => (
                <div className="sheet-wrap" key={i}>
                  <GridSheet cells={p} geom={geom} cfg={cfg} pageNo={i + 1} totalPages={pages.length}
                    pinyin={pinyin} strokeData={stroke.data} />
                  <div className="page-label">第 {i + 1} / {pages.length} 页</div>
                </div>
              ))}
            </div>
          )}
          <PageNav sig={calLayout ? calPages : pages} count={calLayout ? calPages.length : pages.length} />
        </div>
      </div>
    </div>
  );
}
