// 拼音：基于 pinyin-pro（MIT）。按行转换以获得词组上下文自动断词，
// type:'array' 保证逐字对齐；非汉字原样返回、由 isHan 过滤。
import { pinyin } from 'pinyin-pro';

export type PinyinTone = 'symbol' | 'none';
export type PolyphoneMap = Record<string, string>; // 字 → 用户选定读音

export const isHan = (ch: string) => /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(ch);

// 文本中出现的汉字（按首次出现顺序去重）
export function uniqueHanChars(text: string): string[] {
  const seen = new Set<string>();
  for (const ch of text) if (isHan(ch) && !seen.has(ch)) seen.add(ch);
  return [...seen];
}

/** 逐字拼音表（首字优先：同字取文本中第一次出现的语境读音），并应用多音字覆盖 */
export function pinyinMapForText(
  text: string,
  overrides: PolyphoneMap,
  tone: PinyinTone,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    let arr: string[] = [];
    try {
      arr = pinyin(line, { type: 'array', toneType: tone });
    } catch {
      arr = [];
    }
    [...line].forEach((ch, i) => {
      if (!isHan(ch) || map[ch]) return;
      const py = arr[i] ?? '';
      if (py && py !== ch && /[a-zü]/i.test(py)) map[ch] = py;
    });
  }
  for (const [ch, py] of Object.entries(overrides)) if (py) map[ch] = py;
  return map;
}

/** 某字的全部读音候选（用于多音字选择 UI） */
export function pinyinCandidates(ch: string, tone: PinyinTone): string[] {
  try {
    const arr = pinyin(ch, { multiple: true, type: 'array', toneType: tone });
    return [...new Set(arr.filter((p) => p && /[a-zü]/i.test(p)))];
  } catch {
    return [];
  }
}
