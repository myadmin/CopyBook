// 我的模板：把整套配置（含练习文字）命名保存到 localStorage，一键套用。
// 与「当前配置」的自动存档（copybook.config.v1）分开存放，互不影响。
import type { CopybookConfig } from './types';
import { sanitize } from './persist';

const KEY = 'copybook.templates.v1';

export interface SavedTemplate {
  name: string;
  cfg: CopybookConfig;
}

export function loadTemplates(): SavedTemplate[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((t) => t && typeof t.name === 'string' && typeof t.cfg === 'object')
      .map((t) => ({ name: t.name as string, cfg: sanitize((t as SavedTemplate).cfg) }))
      .filter((t): t is SavedTemplate => t.cfg !== null);
  } catch {
    return [];
  }
}

export function saveTemplates(list: SavedTemplate[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 存储不可用时静默失败
  }
}
