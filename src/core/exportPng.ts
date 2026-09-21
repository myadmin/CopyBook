// 导出图片：把预览区每个 svg.sheet 以指定 DPI（默认 300，A4 约 2480×3508px）光栅化为 PNG 下载。
//
// 原理：SVG 字符串 → Blob URL → <img> → canvas.drawImage → toBlob。
// 坑：<img> 渲染的 SVG 是独立文档，用不了页面里的 Web 字体（霞鹜文楷按 unicode-range 切成上百个
// woff2 分片）。因此先扫描 document.styleSheets，只挑「unicode-range 覆盖本页文字」的 @font-face
// 分片，fetch 成 base64 内联进导出的 SVG——通常一页只需嵌 1~3 个分片。
// 系统安装字体（楷体 KaiTi、隶书等）在 <img> 内可直接引用，无需内联。

import { importedFontCss } from './fonts';

export interface ExportStats {
  pages: number;
  zipped: boolean;     // 多页打包为 zip（避免连弹多个下载）
  fontFiles: number;   // 内联的字体分片数
  fontBytes: number;   // 内联字体总字节
}

// 页码范围解析：「1-3,5」「1~2、4」→ [1,2,3,5]；空 → 全部；越界页码丢弃
export function parsePageSpec(spec: string, total: number): number[] {
  const s = spec.trim();
  if (!s) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>();
  for (const part of s.split(/[,，、\s]+/)) {
    if (!part) continue;
    const range = part.match(/^(\d+)\s*[-~—]\s*(\d+)$/);
    const one = part.match(/^(\d+)$/);
    if (range) for (let i = +range[1]; i <= +range[2]; i++) set.add(i);
    else if (one) set.add(+one[1]);
  }
  return [...set].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
}

interface UnicodeRange { lo: number; hi: number }

// "U+4E00-9FFF, U+30xx, U+FF11" → 区间列表（支持区间、单码位、xx/? 通配）
function parseUnicodeRange(spec: string): UnicodeRange[] {
  const out: UnicodeRange[] = [];
  for (const token of spec.split(',')) {
    const m = token.trim().match(/^U\+([0-9A-Fa-f?x]+)(?:-([0-9A-Fa-f]+))?$/i);
    if (!m) continue;
    const [, loRaw, hiRaw] = m;
    if (/[x?]/i.test(loRaw)) {
      const lo = parseInt(loRaw.replace(/[x?]/gi, '0'), 16);
      const hi = parseInt(loRaw.replace(/[x?]/gi, 'F'), 16);
      out.push({ lo, hi });
    } else {
      const lo = parseInt(loRaw, 16);
      out.push({ lo, hi: hiRaw ? parseInt(hiRaw, 16) : lo });
    }
  }
  return out;
}

function covers(ranges: UnicodeRange[], text: string): boolean {
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (ranges.some(r => cp >= r.lo && cp <= r.hi)) return true;
  }
  return false;
}

const fontCache = new Map<string, Promise<string>>(); // url → base64

function fetchFontBase64(url: string): Promise<string> {
  let p = fontCache.get(url);
  if (!p) {
    p = fetch(url).then(r => {
      if (!r.ok) throw new Error(`字体获取失败 ${r.status}: ${url}`);
      return r.arrayBuffer();
    }).then(buf => {
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
      }
      return btoa(bin);
    });
    p.catch(() => fontCache.delete(url)); // 失败不缓存，允许重试
    fontCache.set(url, p);
  }
  return p;
}

function fontFormat(url: string): string {
  const ext = url.split('?')[0].split('.').pop()!.toLowerCase();
  return ext === 'woff2' ? 'woff2' : ext === 'woff' ? 'woff' : ext === 'otf' ? 'opentype' : 'truetype';
}

// 收集覆盖 chars 的 @font-face 分片并内联为 base64 CSS
async function collectFontCss(chars: string): Promise<{ css: string; files: number; bytes: number }> {
  const parts: string[] = [];
  let files = 0, bytes = 0;
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try { rules = sheet.cssRules; } catch { continue; } // 跨域样式表读不了，跳过
    for (const rule of Array.from(rules ?? [])) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const rangeSpec = rule.style.getPropertyValue('unicode-range');
      if (!rangeSpec || !covers(parseUnicodeRange(rangeSpec), chars)) continue;
      const urlMatch = rule.style.getPropertyValue('src').match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/);
      if (!urlMatch) continue;
      const fam = rule.style.getPropertyValue('font-family').replace(/['"]/g, '').trim();
      if (!fam) continue;
      const url = new URL(urlMatch[2], sheet.href ?? location.href).href;
      try {
        const b64 = await fetchFontBase64(url);
        bytes += Math.ceil(b64.length * 3 / 4);
        files++;
        const weight = rule.style.getPropertyValue('font-weight') || 'normal';
        const style = rule.style.getPropertyValue('font-style') || 'normal';
        parts.push(
          `@font-face{font-family:'${fam}';font-style:${style};font-weight:${weight};` +
          `src:url(data:font/${fontFormat(url)};base64,${b64}) format('${fontFormat(url)}');` +
          `unicode-range:${rangeSpec}}`,
        );
      } catch {
        // 单个分片失败不阻断导出（该段文字会回退到系统字体）
      }
    }
  }
  return { css: parts.join('\n'), files, bytes };
}

function svgToPngBlob(svg: SVGSVGElement, dpi: number, embedCss: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const vb = (svg.getAttribute('viewBox') ?? '0 0 210 297').trim().split(/\s+/).map(Number);
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(Math.round(vb[2] * dpi / 25.4)));
    clone.setAttribute('height', String(Math.round(vb[3] * dpi / 25.4)));
    if (embedCss) {
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.textContent = embedCss;
      clone.insertBefore(style, clone.firstChild);
    }
    const str = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([str], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas 导出 PNG 失败')), 'image/png');
      } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG 光栅化失败')); };
    img.src = url;
  });
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// 下载文件名主干：「标题_日期」，标题滤掉文件系统非法字符；空/全非法退回「字帖」
function fileStem(title: string): string {
  const t = (title || '').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || '字帖';
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${t}_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 主入口：导出预览区页面（pageSpec 空 = 全部；「1-2,4」= 选页）；单页直接下载，多页打 zip
export async function exportSheetsAsPng(dpi = 300, pageSpec = '', title = ''): Promise<ExportStats> {
  const svgs = Array.from(document.querySelectorAll<SVGSVGElement>('svg.sheet'));
  if (!svgs.length) throw new Error('没有可导出的页面');
  const pages = parsePageSpec(pageSpec, svgs.length);
  if (!pages.length) throw new Error(`页码「${pageSpec}」不在 1-${svgs.length} 范围内`);
  const picked = pages.map(n => svgs[n - 1]);
  const allText = picked.map(s => s.textContent ?? '').join('');
  const { css, files, bytes } = await collectFontCss(allText);
  const impCss = importedFontCss(picked[0].getAttribute('style')); // 导入的本地字体同样要内联
  const finalCss = [impCss, css].filter(Boolean).join('\n');
  const blobs: Blob[] = [];
  for (const svg of picked) blobs.push(await svgToPngBlob(svg, dpi, finalCss));
  const zipped = blobs.length > 1;
  const stem = fileStem(title);
  if (zipped) {
    const { default: JSZip } = await import('jszip'); // 只有多页导出才用得上，动态引入避免进首屏包
    const zip = new JSZip();
    blobs.forEach((b, i) => zip.file(`${stem}_第${pages[i]}页.png`, b));
    download(await zip.generateAsync({ type: 'blob' }), `${stem}_${pages.length}页.zip`);
  } else {
    download(blobs[0], `${stem}_第${pages[0]}页.png`);
  }
  return { pages: pages.length, zipped, fontFiles: files, fontBytes: bytes };
}
