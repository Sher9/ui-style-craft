// lib/scale.mjs — 字阶 / 间距 / 圆角生成器（零依赖，ESM）

// 模块化字阶（modular scale）：以 base（rem）为基准，按固定 ratio 等比生成各档字号。
// 例：ratio=1.125 即"小五度"比例，相邻档位视觉增量一致、层级清晰。返回 rem 字符串。
export function modularScale({ base = 1, ratio = 1.125, steps = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'] } = {}) {
  const out = {};
  const baseIdx = steps.indexOf('base');
  steps.forEach((name, i) => {
    const exp = i - baseIdx;
    const v = base * Math.pow(ratio, exp);
    const s = (Math.round(v * 1000) / 1000).toString();
    out[name] = s + 'rem';
  });
  return out;
}

// 间距阶梯：以 4px 为基本网格，再用 density 调节整体疏密（紧凑/常规/宽松）。
// 四舍五入后强制回到网格上，避免产生离标魔法数字（如 13px）。
export function spacingScale({ base = 4, density = 'normal', keys = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20] } = {}) {
  const factor = { compact: 0.75, normal: 1, comfortable: 1.5 }[density] || 1;
  const out = {};
  keys.forEach((k) => {
    if (k === 0) { out[k] = '0'; return; }
    let px = Math.round((k * base * factor) / 4) * 4;
    if (px < 4) px = 4;
    out[k] = px + 'px';
  });
  return out;
}

// 圆角阶梯：从直角到全圆角，覆盖常见交互元素形状需求。
export function radiusScale() {
  return { none: '0', sm: '4px', md: '8px', lg: '12px', xl: '16px', '2xl': '24px', full: '9999px' };
}
