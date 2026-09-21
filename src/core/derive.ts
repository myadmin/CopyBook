// 由配置派生的版面规则：排版 / 渲染 / 设置面板多处依赖，集中一处避免规则漂移
import { GRID_SPECS, type CopybookConfig } from './types';

/** 毛笔传统版式（条幅 / 斗方 / 对联）：竖写、格线淡化、仅输出字幅 */
export const isCalLayout = (cfg: CopybookConfig) => cfg.kind === 'brush' && cfg.brushLayout !== 'grid';

/** 竖排（自上而下、自右向左）：仅自由格阵列下生效 */
export const isVertical = (cfg: CopybookConfig) => cfg.writing === 'v' && cfg.brushLayout === 'grid';

/** 横线行款格 / 英语四线格：无外框格，不支持拼音带与笔顺分步格 */
export const isRuled = (cfg: CopybookConfig) => GRID_SPECS[cfg.grid].ruled;

/** 拼音带与笔顺分步格是否被当前版式禁用，及禁用原因（用于面板提示） */
export function annotationGate(cfg: CopybookConfig): { blocked: boolean; reason: string } {
  if (cfg.grid === 'hengxian') return { blocked: true, reason: '横线行款格' };
  if (cfg.grid === 'english') return { blocked: true, reason: '英语四线格' };
  if (cfg.writing === 'v') return { blocked: true, reason: '竖排版式' };
  if (isCalLayout(cfg)) return { blocked: true, reason: '毛笔版式' };
  return { blocked: false, reason: '' };
}
