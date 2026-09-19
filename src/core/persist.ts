import { DEFAULT_CONFIG, GRID_SPECS, type CopybookConfig } from './types';

const KEY = 'copybook.config.v1';

// 与 DEFAULT_CONFIG 浅合并：旧版本存档缺少的字段自动补默认值；
// 未知字段（未来版本遗留）因类型上不在 DEFAULT 中而自然被忽略。
export function sanitize(raw: unknown): CopybookConfig | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const cfg: CopybookConfig = { ...DEFAULT_CONFIG, ...(raw as Partial<CopybookConfig>) };
  // 关键字段兜底：枚举值失效（版本演进改名）时回退默认，避免渲染分支拿到 undefined
  if (!(cfg.grid in GRID_SPECS)) cfg.grid = DEFAULT_CONFIG.grid;
  if (!['pencil', 'pen', 'brush'].includes(cfg.kind)) cfg.kind = DEFAULT_CONFIG.kind;
  if (!['off', 'first', 'repeat'].includes(cfg.strokeMode)) cfg.strokeMode = DEFAULT_CONFIG.strokeMode;
  if (cfg.cellSize < 4 || cfg.cellSize > 120 || !Number.isFinite(cfg.cellSize)) cfg.cellSize = DEFAULT_CONFIG.cellSize;
  if (typeof cfg.polyphones !== 'object' || cfg.polyphones === null) cfg.polyphones = {};
  return cfg;
}

export function loadConfig(): CopybookConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    return sanitize(JSON.parse(raw)) ?? DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG; // 隐私模式 / JSON 损坏等，静默回退
  }
}

export function saveConfig(cfg: CopybookConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    // 存储不可用时放弃持久化，不影响使用
  }
}

// 选页导出的页码历史：记住最近 5 次用过的写法（如「1-3,5」），下次自动带出
const PS_KEY = 'copybook.pagespec.v1';

export function loadPageSpecHistory(): string[] {
  try {
    const arr = JSON.parse(localStorage.getItem(PS_KEY) ?? '[]');
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function pushPageSpecHistory(spec: string) {
  const s = spec.trim();
  if (!s) return;
  try {
    const list = [s, ...loadPageSpecHistory().filter((x) => x !== s)].slice(0, 5);
    localStorage.setItem(PS_KEY, JSON.stringify(list));
  } catch {
    // 存不进就算了，不影响导出
  }
}
