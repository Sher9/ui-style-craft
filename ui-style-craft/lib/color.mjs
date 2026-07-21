// lib/color.mjs — ui-style-craft 的颜色计算库（零依赖，ESM）
// 负责：十六进制与 HSL 互转、WCAG 相对亮度与对比度、中性色阶生成、语义色派生。

// 将数值 n 限制在 [min, max] 区间内，所有色值计算都依赖它做边界保护。
function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

// 十六进制颜色 → RGB 三元组。支持 #rgb / #rrggbb / #rrggbbaa（忽略 alpha）。
export function hexToRgb(hex) {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join(''); // 简写 #abc → #aabbcc
  if (h.length === 8) h = h.slice(0, 6); // 忽略 alpha，亮度计算只取 RGB
  if (h.length !== 6) return null; // 非法色值返回 null，调用方据此报错
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// RGB 三元组 → 十六进制字符串（自动夹取 0~255 并补零）。
export function rgbToHex([r, g, b]) {
  const c = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

// RGB → HSL。输入/输出均为常规范围：h∈[0,360)，s/l∈[0,100]。
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// HSL → RGB。h 先做取模归一化，s/l 夹取到合法百分比；s=0 时为纯灰。
export function hslToRgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// 十六进制 → HSL / HSL → 十六进制的便捷封装。
export function hexToHsl(hex) { const rgb = hexToRgb(hex); return rgb ? rgbToHsl(rgb[0], rgb[1], rgb[2]) : null; }
export function hslToHex(h, s, l) { return rgbToHex(hslToRgb(h, s, l)); }

// 相对亮度（WCAG 定义）。可接收十六进制字符串或 RGB 三元组。
// 先按 sRGB 线性化（≤0.03928 用线性段，否则用指数段），再按人眼权重叠加 RGB。
export function relativeLuminance(input) {
  const rgb = Array.isArray(input) ? input : hexToRgb(input);
  if (!rgb) return null;
  const a = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

// 对比度 = (较亮亮度 + 0.05) / (较暗亮度 + 0.05)，取值范围约 1:1 ~ 21:1。
// 结果 >= 4.5 即满足 WCAG AA 正文标准，>= 3 满足大字标准。
export function contrastRatio(a, b) {
  const l1 = relativeLuminance(a), l2 = relativeLuminance(b);
  if (l1 == null || l2 == null) return null;
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// 取色相饱和度（百分比），供反模式检查判断"过饱和色"。
export function saturation(hex) { const hsl = hexToHsl(hex); return hsl ? hsl.s : null; }

// 由强调色色相派生 11 级中性色阶（50~950）。
// 思路：固定低饱和度，让 L（明度）按感知均匀分布；亮色用浅底深字，暗色反之。
export function generateNeutralRamp(accentHue, mode = 'light') {
  const hue = ((accentHue % 360) + 360) % 360;
  const L_light = [98, 96, 93, 87, 74, 62, 50, 38, 27, 17, 9];
  const S_light = [22, 18, 16, 15, 16, 18, 18, 20, 24, 30, 16];
  const L_dark = [9, 12, 16, 21, 28, 36, 46, 57, 69, 82, 97];
  const S_dark = [14, 14, 15, 15, 16, 18, 20, 22, 24, 22, 12];
  const L = mode === 'dark' ? L_dark : L_light;
  const S = mode === 'dark' ? S_dark : S_light;
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const ramp = {};
  steps.forEach((key, i) => { ramp[key] = hslToHex(hue, S[i], L[i]); });
  return ramp;
}

// 由强调色派生语义色（背景/表面/边框/文本/主色等）。
// 关键点：text-secondary / text-muted 用 pick() 自动"逐档加深"，确保在各表面上都达到 WCAG AA（≥4.5:1）。
export function generateSemanticColors(accent, mode, neutral, cr = contrastRatio) {
  const primary = accent;
  // 主色前景：白字对比度够就用白，否则用近黑，保证按钮上的文字可读。
  const primaryFg = cr(accent, '#ffffff') >= 4.5 ? '#ffffff' : '#0a0a0b';
  let bg, surface, surface2, border, textPrimary;
  if (mode === 'dark') {
    bg = neutral[950]; surface = neutral[900]; surface2 = neutral[800]; border = neutral[800];
    textPrimary = neutral[50];
  } else {
    bg = neutral[50]; surface = '#ffffff'; surface2 = neutral[100]; border = neutral[200];
    textPrimary = neutral[900];
  }
  // 从候选色档中挑选第一个"在所有表面上都满足 AA"的颜色；都不行则退而取最深一档。
  const pick = (candidates, surfaces) =>
    candidates.find((c) => surfaces.every((s) => cr(c, s) >= 4.5)) || candidates[candidates.length - 1];
  const textSecondary = mode === 'dark'
    ? pick([neutral[300], neutral[400], neutral[500]], [bg, surface, surface2])
    : pick([neutral[600], neutral[700], neutral[800]], [bg, surface, surface2]);
  const textMuted = mode === 'dark'
    ? pick([neutral[400], neutral[300], neutral[200]], [bg, surface, surface2])
    : pick([neutral[500], neutral[600], neutral[700]], [bg, surface, surface2]);
  return {
    bg, surface, 'surface-2': surface2, border,
    'text-primary': textPrimary, 'text-secondary': textSecondary, 'text-muted': textMuted,
    primary, 'primary-fg': primaryFg,
    success: '#16a34a', warning: '#d97706', danger: '#dc2626', info: '#0891b2',
  };
}
