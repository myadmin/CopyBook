// 本地字体文件导入（仅本机使用，不上传不分发）：
// FontFace 注册供预览；数据副本供 PNG 导出内联（<img> 渲染的 SVG 用不了 document.fonts）。
// 文件数据存入 IndexedDB（浏览器本地存储），刷新/重开后自动恢复；隐私模式或配额不足时退化为仅本次会话。

export const IMPORTED_FAMILY = 'ImportedCopybookFont';

const MAX_BYTES = 20 * 1024 * 1024; // 挡住误选的巨型文件；手写字体一般 < 15MB

interface ImportedFont { buf: ArrayBuffer; mime: string; fileName: string }

let imported: ImportedFont | null = null;
let b64cache: string | null = null;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(cb => cb());
/** 订阅导入状态变化（导入/恢复/移除时触发），返回退订函数 */
export const subscribeImported = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};
export const importedFontName = () => imported?.fileName ?? null;

const mimeOf = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ext === 'woff2' ? 'font/woff2' : ext === 'woff' ? 'font/woff' : ext === 'otf' ? 'font/otf' : 'font/ttf';
};

// ---------- IndexedDB：单库单仓单键（'current'），结构化克隆直接存 ArrayBuffer ----------

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const rq = indexedDB.open('copybook.font', 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore('font');
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => reject(rq.error);
  });
}

/** 写入/删除持久副本；失败静默（只影响下次启动的自动恢复，不打断当前使用） */
async function dbWrite(rec: ImportedFont | null): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('font', 'readwrite');
      if (rec) tx.objectStore('font').put({ ...rec, savedAt: Date.now() }, 'current');
      else tx.objectStore('font').delete('current');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch { /* ignore */ }
}

async function dbRead(): Promise<ImportedFont | null> {
  try {
    const db = await openDb();
    const rec = await new Promise<ImportedFont | null>((resolve, reject) => {
      const rq = db.transaction('font').objectStore('font').get('current');
      rq.onsuccess = () => resolve(rq.result ?? null);
      rq.onerror = () => reject(rq.error);
    });
    db.close();
    return rec && rec.buf instanceof ArrayBuffer && rec.buf.byteLength ? rec : null;
  } catch {
    return null;
  }
}

// ---------- 注册/恢复/移除 ----------

/** 校验数据并接管为当前导入字体（坏数据在 face.load 抛错，调用方负责清理） */
async function adopt(rec: ImportedFont): Promise<void> {
  const face = new FontFace(IMPORTED_FAMILY, rec.buf);
  await face.load();
  for (const f of Array.from(document.fonts)) if (f.family === IMPORTED_FAMILY) document.fonts.delete(f);
  document.fonts.add(face);
  imported = rec;
  b64cache = null;
  notify();
}

/** 读取并注册字体文件（成功后持久化）；fontFamily 应设为 `'${IMPORTED_FAMILY}', serif` 之类 */
export async function importFontFile(file: File): Promise<void> {
  const buf = await file.arrayBuffer();
  if (!buf.byteLength) throw new Error('文件为空');
  if (buf.byteLength > MAX_BYTES) throw new Error(`文件超过 ${MAX_BYTES / 1024 / 1024}MB 上限`);
  await adopt({ buf, mime: mimeOf(file.name), fileName: file.name });
  void dbWrite(imported);
}

/** 启动时从 IndexedDB 恢复上次导入的字体；返回恢复出的文件名（无/失败为 null） */
export async function restoreImportedFont(): Promise<string | null> {
  const rec = await dbRead();
  if (!rec) return null;
  try {
    await adopt(rec);
    return rec.fileName;
  } catch {
    void dbWrite(null); // 存的数据已损坏，清掉避免每次启动都失败
    return null;
  }
}

/** 移除导入字体（含持久副本）；已选中的 fontFamily 由调用方自行回退 */
export function clearImportedFont(): void {
  for (const f of Array.from(document.fonts)) if (f.family === IMPORTED_FAMILY) document.fonts.delete(f);
  imported = null;
  b64cache = null;
  notify();
  void dbWrite(null);
}

/** 若导出 SVG 的字体栈用到了导入字体，返回需要内联的 @font-face CSS */
export function importedFontCss(fontStack: string | null): string {
  if (!imported || !fontStack || !fontStack.includes(IMPORTED_FAMILY)) return '';
  if (!b64cache) {
    const bytes = new Uint8Array(imported.buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    b64cache = btoa(bin);
  }
  return `@font-face{font-family:'${IMPORTED_FAMILY}';font-style:normal;font-weight:normal;`
    + `src:url(data:${imported.mime};base64,${b64cache})}`;
}
