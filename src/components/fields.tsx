// 设置面板的原子表单控件：被各分节组件复用
import type { ReactNode } from 'react';
import type { CopybookConfig } from '../core/types';

export type SetCfg = (patch: Partial<CopybookConfig>) => void;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** 可折叠分组（默认展开），标题 + 内容 */
export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group">
      <summary>{title}</summary>
      <div className="group-body">{children}</div>
    </details>
  );
}

/** 数字输入（越界自动收敛到 min/max） */
export function Num({ label, value, min, max, step = 1, unit, onChange }:
  { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(clamp(v, min, max));
        }} />
      {unit && <span className="val">{unit}</span>}
    </label>
  );
}

/** 滑杆，右侧实时显示当前值 */
export function Range({ label, value, min, max, step, unit = '', onChange }:
  { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="range" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value))} />
      <span className="val">{value}{unit}</span>
    </label>
  );
}

/** 取色器，右侧显示十六进制值 */
export function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} />
      <span className="val">{value}</span>
    </label>
  );
}

/** 复选开关 */
export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
