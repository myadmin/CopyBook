// 颜色亮度：深底（碑帖）判断，供 GridSheet / CalligraphySheet 共用
export const luma = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 1;
  const v = parseInt(m[1], 16);
  return (0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255)) / 255;
};

export const isDarkBg = (useBg: boolean, bg: string) => useBg && luma(bg) < 0.45;
