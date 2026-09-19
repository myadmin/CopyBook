// 笔画名称：cnchar-order（MIT），动态 import——仅点开笔顺预览时才拉取这段代码与数据
// cnchar 数据带可选叫法的复合笔画写作「横撇|横钩」，朗读取「|」前第一种
type StrokeNames = string[];

let enginePromise: Promise<((ch: string) => StrokeNames | null) | null> | null = null;

function loadEngine() {
  enginePromise ??= (async () => {
    try {
      const [cncharM, orderM] = await Promise.all([import('cnchar'), import('cnchar-order')]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cnchar: any = (cncharM as any).default ?? cncharM;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order: any = (orderM as any).default ?? orderM;
      cnchar.use(order);
      return (ch: string): StrokeNames | null => {
        const r = cnchar.stroke(ch, 'order', 'name');
        const arr = Array.isArray(r) && Array.isArray(r[0]) ? r[0] : null;
        if (arr && arr.length > 0 && arr.every((s: unknown) => typeof s === 'string' && s)) {
          return arr.map((s: string) => s.split('|')[0]);
        }
        return null;
      };
    } catch {
      return null; // 加载失败（如离线且缓存未含该 chunk）时退回仅读字音
    }
  })();
  return enginePromise;
}

const cache = new Map<string, StrokeNames | null>();

/** 返回某字的逐笔名称（「不」→ 横/撇/竖/点）；无数据或加载失败返回 null */
export async function loadStrokeNames(ch: string): Promise<StrokeNames | null> {
  if (cache.has(ch)) return cache.get(ch) ?? null;
  const engine = await loadEngine();
  let names: StrokeNames | null = null;
  if (engine) {
    try { names = engine(ch); } catch { names = null; }
  }
  cache.set(ch, names);
  return names;
}
