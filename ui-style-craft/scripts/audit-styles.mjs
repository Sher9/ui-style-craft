#!/usr/bin/env node
/**
 * audit-styles.mjs — “AI 味” / 离标样式体检器。
 *
 * 扫描项目样式源文件（CSS/SCSS/TSX/JSX/Vue），识别典型的
 * LLM 生成 UI 反模式与离标魔法值。零依赖（仅 Node.js 标准库；
 * 可选 --tokens 做"尺度感知"的容差判断）。
 */
// 用法：
//   node audit-styles.mjs --src "./src/**/*.{css,scss,tsx,jsx,vue}" [--tokens tokens.json]

import fs from 'node:fs';
import path from 'node:path';
import { saturation } from '../lib/color.mjs';

// 从命令行读取 --key value 参数，缺失时回退默认值。
function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
// src：扫描路径（支持 glob 形式的 {ext} 与 ** 递归）；tokens：可选的 token 文件。
const src = arg('--src', '.');
const tokensPath = arg('--tokens', null);

// 若传了 token，则把其中合法的间距/字号取出来作为容差基准；否则用内置默认阶梯。
let spaceVals = [];
let fontVals = [];
if (tokensPath && fs.existsSync(tokensPath)) {
  const tk = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  spaceVals = Object.values(tk.space || {}).map((v) => parseFloat(v)).filter((n) => !isNaN(n) && n > 0);
  fontVals = Object.values((tk.font && tk.font.size) || {}).map((v) => parseFloat(v) * 16).filter((n) => !isNaN(n));
}
if (spaceVals.length === 0) spaceVals = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80];
if (fontVals.length === 0) fontVals = [12, 14, 16, 18, 20, 24, 30, 36, 48];

// ---- 文件收集（支持 ./src/**/*.{css,scss,...} 形式的 glob）----
function collectFiles(pattern) {
  const exts = new Set();
  const m = pattern.match(/\{([^}]+)\}/);
  if (m) m[1].split(',').forEach((e) => exts.add('.' + e.trim()));
  let root = '.';
  if (pattern.includes('**')) root = pattern.split('**')[0];
  else if (fs.existsSync(pattern) && fs.statSync(pattern).isDirectory()) root = pattern;
  // 从 glob 模式里剥离 {ext} 与 **，得到真正的扫描根目录。
  root = root.replace(/\{[^}]+\}$/, '').replace(/\*$/, '').replace(/\/+$/, '');
  if (!root) root = '.';
  // 未指定扩展名时用这套常见样式/组件文件做兜底。
  const fallback = ['.css', '.scss', '.less', '.tsx', '.jsx', '.vue', '.html'];
  const results = [];
  // 自写递归遍历目录（零依赖，兼容低版本 Node，无需 fs.globSync）。
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else {
        const ext = path.extname(e.name);
        if ((exts.size === 0 ? fallback : [...exts]).includes(ext)) results.push(p);
      }
    }
  };
  if (fs.existsSync(root)) walk(root);
  return results;
}

// 收集待扫描文件；allIssues 累积每文件的问题；onGrid 判断 px 值是否落在 4px 网格上。
const files = collectFiles(src);
const allIssues = [];
const onGrid = (px) => { const n = parseFloat(px); return n === 0 || Math.abs(n % 4) < 0.01; };

// 逐文件读取并用正则规则体检，命中即记录 (level/cat/msg)。
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const issues = [];
  const rel = path.relative(process.cwd(), file);

  // 1. pure black
  if (/#0{3}(?:0{3})?\b/.test(text)) issues.push({ level: 'error', cat: '色彩', msg: '使用了纯黑 #000（禁用），应改为 off-black / neutral.950。' });

  // 2. Inter font
  if (/font-?family[^;{]*inter/i.test(text)) issues.push({ level: 'error', cat: '排版', msg: 'font-family 包含 Inter（禁用），改用 Geist / Satoshi。' });

  // 3. spacing off grid
  const spRe = /(padding|margin|gap|inset|top|left|right|bottom)\s*:\s*([^;]+);/gi;
  let sp;
  while ((sp = spRe.exec(text)) !== null) {
    const nums = sp[2].match(/-?\d*\.?\d+px/g) || [];
    nums.forEach((n) => { if (!onGrid(n)) issues.push({ level: 'warn', cat: '间距', msg: `${sp[1]} 取值 "${n}" 不在 4px 间距阶梯上。` }); });
  }

  // 4. font-size off scale
  const fsRe = /font-size\s*:\s*([^;]+);/gi;
  let fz;
  while ((fz = fsRe.exec(text)) !== null) {
    const vals = fz[1].match(/-?\d*\.?\d+(?:px|rem)/g) || [];
    vals.forEach((v) => {
      let px = parseFloat(v);
      if (/rem$/.test(v)) px *= 16;
      const ok = fontVals.some((s) => Math.abs(s - px) <= 1);
      if (!ok) issues.push({ level: 'warn', cat: '排版', msg: `font-size "${v}" 不在字阶上（容差 ±1px）。` });
    });
  }

  // 5. three equal cards
  if (/grid-template-columns\s*:\s*[^;]*(?:repeat\(\s*3\s*,\s*1fr\s*\)|1fr\s+1fr\s+1fr)/i.test(text)) {
    issues.push({ level: 'warn', cat: '布局', msg: '三等宽卡片行 grid(3×1fr)（疑似“AI 味”），改用非对称栅格 / 2 列之字 / 横向滚动。' });
  }

  // 6. centered hero
  if (/text-align\s*:\s*center/i.test(text)) {
    issues.push({ level: 'warn', cat: '布局', msg: 'text-align: center（疑似居中 Hero），优先左对齐 + 非对称留白。' });
  }

  // 7. default black box-shadow / neon glow
  const bsRe = /box-shadow\s*:\s*([^;]+);/gi;
  let bs;
  while ((bs = bsRe.exec(text)) !== null) {
    const v = bs[1];
    if (/(rgba?\(\s*0\s*,\s*0\s*,\s*0|#000|black)/i.test(v)) {
      issues.push({ level: 'warn', cat: '阴影', msg: 'box-shadow 使用默认黑阴影，未着色到背景色相。' });
    }
    const hexes = v.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
    hexes.forEach((hx) => { if (saturation(hx) > 80) issues.push({ level: 'warn', cat: '阴影', msg: `box-shadow 含高饱和色 ${hx}（疑似霓虹外发光）。` }); });
  }

  // 8. oversaturated accent colors
  const allHex = text.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
  allHex.forEach((hx) => { if (saturation(hx) > 85) issues.push({ level: 'warn', cat: '色彩', msg: `高饱和色 ${hx}（饱和度 > 80%，过饱和强调色）。` }); });

  // 9. missing :focus-visible when interactive hover exists
  if (/:hover/.test(text) && !/:focus-visible/.test(text) && /(^|\s)(a|button|\.btn|input|select|textarea|\[role=["']?button)/im.test(text)) {
    issues.push({ level: 'warn', cat: '交互', msg: '存在可交互元素的 :hover 但缺少 :focus-visible（无障碍必需）。' });
  }

  // 10. placeholder content
  if (/john doe|acme|99\.99%|lorem ipsum/i.test(text)) {
    issues.push({ level: 'info', cat: '内容', msg: '发现占位内容（John Doe / Acme / 99.99% / Lorem），应替换为真实感数据。' });
  }

  if (issues.length) allIssues.push({ file: rel, issues });
}

// ---- 报告输出 ----
// 汇总 error/warn/info 计数；有 error 时退出码 1（供 CI/预提交钩子卡点）。
let err = 0, warn = 0, info = 0;
for (const { file, issues } of allIssues) {
  console.log(`\n${file}`);
  for (const i of issues) {
    if (i.level === 'error') err++; else if (i.level === 'warn') warn++; else info++;
    const tag = i.level === 'error' ? 'ERR ' : i.level === 'warn' ? 'WARN' : 'INFO';
    console.log(`  [${tag}] (${i.cat}) ${i.msg}`);
  }
}
console.log(`\n扫描 ${files.length} 个文件。问题统计：error=${err}  warn=${warn}  info=${info}`);
process.exit(err > 0 ? 1 : 0);
