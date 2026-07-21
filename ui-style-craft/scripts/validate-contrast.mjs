#!/usr/bin/env node
/**
 * validate-contrast.mjs — token 集合的 WCAG 对比度闸门。
 *
 * 读取 tokens.json，枚举所有语义文本/背景组合，报告是否满足 WCAG AA。
 * 只要有任意组合不达标就以退出码 1 结束（可接入 CI 做可访问性卡点）。
 *
 * 用法：
 *   node validate-contrast.mjs --tokens tokens.json --level AA
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexToHsl, hslToHex, contrastRatio } from '../lib/color.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 从命令行读取 --key value 参数，缺失时回退默认值。
function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
// 默认读取技能内置的 default-tokens.json；level 决定门槛（AA=4.5，AAA=7）。
const tokensPath = arg('--tokens', path.resolve(__dirname, '..', 'assets', 'default-tokens.json'));
const level = arg('--level', 'AA');
const threshold = level === 'AAA' ? 7 : 4.5;

if (!fs.existsSync(tokensPath)) { console.error(`tokens file not found: ${tokensPath}`); process.exit(2); }
const tk = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
const sem = tk.color.semantic;

// 需要逐一核对的语义配对：三档文本色分别落在三种背景上，主色前景落在主色上。
const pairs = [
  ['text-primary', ['bg', 'surface', 'surface-2']],
  ['text-secondary', ['bg', 'surface', 'surface-2']],
  ['text-muted', ['bg', 'surface', 'surface-2']],
  ['primary-fg', ['primary']],
];

// 二分搜索：在固定色相/饱和度下调整明度，找出第一个满足对比度门槛的文字色建议值。
function suggest(textHex, bgHex) {
  const hsl = hexToHsl(textHex);
  const bgLum = contrastRatio(textHex, bgHex) != null ? null : null;
  void bgLum;
  // 判断背景偏亮还是偏暗，决定提高明度还是降低明度来满足门槛。
  const bgIsLighter = contrastRatio('#000000', bgHex) < contrastRatio('#ffffff', bgHex);
  let lo = 0, hi = 100;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const cand = hslToHex(hsl.h, hsl.s, mid);
    const ok = contrastRatio(cand, bgHex) >= threshold;
    if (bgIsLighter) { if (ok) hi = mid; else lo = mid; }
    else { if (ok) lo = mid; else hi = mid; }
  }
  return hslToHex(hsl.h, hsl.s, (lo + hi) / 2);
}

// 遍历所有配对，输出 PASS/FAIL 表；失败项附带建议色。
const fails = [];
console.log(`\nWCAG ${level} contrast check (threshold ≥ ${threshold}:1)\n`);
for (const [textKey, bgs] of pairs) {
  const textHex = sem[textKey];
  for (const bgKey of bgs) {
    const bgHex = sem[bgKey];
    const ratio = contrastRatio(textHex, bgHex);
    const ok = ratio >= threshold;
    const tag = ok ? 'PASS' : 'FAIL';
    let line = `  [${tag}] ${textKey.padEnd(14)} on ${bgKey.padEnd(10)} ${ratio.toFixed(2)}:1`;
    if (!ok) {
      const fix = suggest(textHex, bgHex);
      line += `  → 建议调整为 ${fix}`;
      fails.push({ textKey, bgKey, ratio });
    }
    console.log(line);
  }
}

console.log('');
// 全部达标退出 0；否则退出 1，供 CI 卡点使用。
if (fails.length === 0) {
  console.log('✓ All semantic text/background pairings meet WCAG ' + level + '.');
  process.exit(0);
} else {
  console.log(`✗ ${fails.length} pairing(s) below WCAG ${level}. Fix the tokens and re-run.`);
  process.exit(1);
}
