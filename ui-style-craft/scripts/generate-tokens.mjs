#!/usr/bin/env node
/**
 * generate-tokens.mjs — 生成一套自洽的 design token。
 *
 * 零依赖（仅用 Node.js 标准库）。给定少量种子（强调色、明暗模式、密度、字阶比例），
 * 即可派生出完整的 token 集合，并导出为 JSON（单一真相源）、CSS 变量、TS 模块。
 *
 * 用法：
 *   node generate-tokens.mjs \
 *     --accent "#2563eb" --mode light --density normal \
 *     --ratio 1.125 --out json,css,ts --dir ./design-tokens
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexToHsl, hslToRgb, generateNeutralRamp, generateSemanticColors, contrastRatio } from '../lib/color.mjs';
import { modularScale, spacingScale, radiusScale } from '../lib/scale.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 从命令行读取 --key value 形式参数，缺失时回退到默认值。
function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

// 读取种子参数：强调色 / 明暗 / 密度 / 字阶比例 / 输出格式 / 输出目录。
const accent = arg('--accent', '#2563eb');
const mode = arg('--mode', 'light');
const density = arg('--density', 'normal');
const ratio = parseFloat(arg('--ratio', '1.125'));
const outFormats = arg('--out', 'json,css,ts').split(',').map((s) => s.trim()).filter(Boolean);
const dir = arg('--dir', path.resolve(__dirname, '..', 'design-tokens'));

// 解析强调色色相，非法则报错退出。
const hsl = hexToHsl(accent);
if (!hsl) { console.error(`Invalid --accent: ${accent}`); process.exit(2); }
const accentHue = hsl.h;

// 由强调色色相派生中性色阶，再派生语义色（含自动达标对比度）。
const neutral = generateNeutralRamp(accentHue, mode);
const semantic = generateSemanticColors(accent, mode, neutral, contrastRatio);

// 着色阴影：取强调色色相，压低饱和度与明度，再以低透明度叠加，避免默认黑阴影的廉价感。
const tint = hslToRgb(accentHue, 25, 18);
const tintRgba = (a) => `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${a})`;
const shadow = {
  sm: `0 1px 2px 0 ${tintRgba(0.05)}`,
  md: `0 4px 6px -1px ${tintRgba(0.07)}, 0 2px 4px -2px ${tintRgba(0.05)}`,
  lg: `0 10px 15px -3px ${tintRgba(0.08)}, 0 4px 6px -4px ${tintRgba(0.05)}`,
  xl: `0 20px 25px -5px ${tintRgba(0.10)}, 0 8px 10px -6px ${tintRgba(0.05)}`,
};

// 组装完整 token 对象：meta 记录种子，color 含中性/语义色，
// font 含字族/字阶/字重/行高/字距，space 间距，radius 圆角，shadow 着色阴影，motion 动效。
const tokens = {
  meta: { accent, mode, density, ratio, version: '1.0.0', generator: 'ui-style-craft' },
  color: { neutral, semantic },
  font: {
    family: { sans: 'Geist, Satoshi, system-ui, sans-serif', mono: 'Geist Mono, JetBrains Mono, monospace' },
    size: modularScale({ ratio }),
    weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    lineHeight: { tight: '1.15', normal: '1.5', relaxed: '1.625' },
    letterSpacing: { tighter: '-0.02em', normal: '0', wide: '0.025em' },
  },
  space: spacingScale({ density }),
  spaceAlias: {
    xs: '{space.1}', sm: '{space.2}', md: '{space.4}',
    lg: '{space.6}', xl: '{space.8}', '2xl': '{space.12}',
  },
  radius: radiusScale(),
  shadow,
  motion: {
    duration: { instant: '0ms', fast: '150ms', normal: '250ms', slow: '400ms' },
    easing: {
      standard: 'cubic-bezier(0.4,0,0.2,1)',
      emphasized: 'cubic-bezier(0.2,0,0,1)',
      decelerate: 'cubic-bezier(0,0,0.2,1)',
    },
  },
};

// 把 token 对象递归展平为 CSS 自定义属性（--a-b-c: ...），并把别名 {space.1} 改写成 var(--space-1)。
function toCss(tk) {
  const lines = [];
  const walk = (obj, prefix) => {
    for (const [k, v] of Object.entries(obj)) {
      const name = prefix ? `${prefix}-${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, name);
      else {
        let val = String(v).replace(/\{(\w+)\.(\w+)\}/g, (_, a, b) => `var(--${a}-${b})`);
        lines.push(`  --${name}: ${val};`);
      }
    }
  };
  walk(tk, '');
  return `:root {\n${lines.join('\n')}\n}\n`;
}

// 把 token 对象导出为带类型约束的 TS 常量。
function toTs(tk) {
  return `export const tokens = ${JSON.stringify(tk, null, 2)} as const;\n`;
}

// 创建输出目录，并按需写出对应格式文件。
fs.mkdirSync(dir, { recursive: true });
if (outFormats.includes('json')) fs.writeFileSync(path.join(dir, 'tokens.json'), JSON.stringify(tokens, null, 2));
if (outFormats.includes('css')) fs.writeFileSync(path.join(dir, 'tokens.css'), toCss(tokens));
if (outFormats.includes('ts')) fs.writeFileSync(path.join(dir, 'tokens.ts'), toTs(tokens));

console.log(`✓ Generated tokens (${mode}/${density}) → ${dir}`);
console.log(`  accent=${accent}  primary=${semantic.primary}  text-muted=${semantic['text-muted']}`);
