// 笔顺数据：hanzi-writer-data（Makemeahanzi，约 9500 字，OFL/自研数据）
// 加载顺序：dev 中间件 / build 拷贝的 dist/hanzi-data → jsDelivr CDN 兜底；内存缓存去重
// 数据坐标：1024×1024 框，y 轴向上（渲染进 SVG 时需翻转）

export interface StrokeData {
  strokes: string[];              // 每笔的轮廓 path（填充形）
  medians: [number, number][][];  // 每笔的中线点列（编号定位 / 动画用）
}

const cache = new Map<string, StrokeData | null>();
const inflight = new Map<string, Promise<StrokeData | null>>();

const LOCAL_URL = (ch: string) => `hanzi-data/${encodeURIComponent(ch)}.json`;
const CDN_URL = (ch: string) =>
  `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(ch)}.json`;

async function tryFetch(url: string): Promise<StrokeData | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    if (j && Array.isArray(j.strokes) && Array.isArray(j.medians) && j.strokes.length > 0) {
      return { strokes: j.strokes, medians: j.medians } as StrokeData;
    }
    return null;
  } catch {
    return null;
  }
}

export function loadStrokeData(ch: string): Promise<StrokeData | null> {
  if (cache.has(ch)) return Promise.resolve(cache.get(ch) ?? null);
  let p = inflight.get(ch);
  if (!p) {
    p = (async () => {
      const data = (await tryFetch(LOCAL_URL(ch))) ?? (await tryFetch(CDN_URL(ch)));
      cache.set(ch, data);
      inflight.delete(ch);
      return data;
    })();
    inflight.set(ch, p);
  }
  return p;
}

export function getCachedStrokeData(ch: string): StrokeData | null | undefined {
  return cache.get(ch);
}
