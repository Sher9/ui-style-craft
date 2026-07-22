#!/usr/bin/env node
/**
 * pack.mjs — 把 ui-style-craft 技能目录打包成 zip 放到 dist/。
 *
 * 纯 Node.js（零依赖）：用 zlib.deflateRawSync 写标准 zip 容器，
 * 不依赖系统 zip / tar / PowerShell，Windows / macOS / Linux 行为一致。
 *
 * 用法：
 *   node scripts/pack.mjs                 # 默认打包到 ../dist/ui-style-craft.zip
 *   node scripts/pack.mjs --name usc.zip  # 自定义 zip 名（自动补 .zip）
 *
 * 默认打包脚本所在目录的上层（即 ui-style-craft 技能根），
 * 排除 node_modules / .git / _bench / dist / 临时产物 / .zip 等。
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 从命令行读取 --key value 参数，缺失时回退默认值。
function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

// 源目录：脚本的上层（ui-style-craft 技能根）。
const srcDir = path.resolve(__dirname, '..');
// 输出目录：仓库根 / dist。
const distDir = path.resolve(__dirname, '..', '..', 'dist');
let name = arg('--name', 'ui-style-craft.zip');
if (!name.toLowerCase().endsWith('.zip')) name += '.zip';
const outZip = path.join(distDir, name);

// 递归收集要打包的文件（相对路径，统一用 / 分隔，zip 内顶层为 ui-style-craft/）。
const IGNORE = new Set(['node_modules', '.git', '_bench', 'dist', '.turbo', '.cache', 'coverage', '.vscode', '.idea']);
const entries = [];
const collect = (dir, base) => {
  let list;
  try { list = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of list) {
    if (e.isDirectory()) {
      if (IGNORE.has(e.name)) continue;
      collect(path.join(dir, e.name), path.join(base, e.name));
    } else {
      if (e.name === '.DS_Store' || e.name.endsWith('.zip')) continue;
      entries.push(path.join(base, e.name));
    }
  }
};
collect(srcDir, ''); // srcDir 即技能根，zip 内条目名在下方统一加 ui-style-craft/ 前缀

if (entries.length === 0) { console.error('没有可打包的文件。'); process.exit(1); }

// CRC32 表与计算（zip 必需）。
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// DOS 时间/日期（zip 用）。
function dosDateTime(d = new Date()) {
  const time = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() / 2) & 0x1f);
  const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0xf) << 5) | (d.getDate() & 0x1f);
  return { time: time & 0xffff, date: date & 0xffff };
}
const FLAG_UTF8 = 0x0800; // 文件名按 UTF-8 编码
const { time, date } = dosDateTime();

// 逐文件写出 local header + 数据，并累积 central directory。
const chunks = [];
const central = [];
let offset = 0;
for (const rel of entries) {
  const filePath = path.join(srcDir, rel);
  const data = fs.readFileSync(filePath);
  const compressed = zlib.deflateRawSync(data);
  const crc = crc32(data);
  const nameBuf = Buffer.from('ui-style-craft/' + rel.split(path.sep).join('/'), 'utf8');

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);          // version needed
  local.writeUInt16LE(FLAG_UTF8, 6);   // flags（UTF-8 文件名）
  local.writeUInt16LE(8, 8);           // method: deflate
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(date, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);          // extra len
  chunks.push(local, nameBuf, compressed);

  const c = Buffer.alloc(46);
  c.writeUInt32LE(0x02014b50, 0);
  c.writeUInt16LE(20, 4);              // version made by
  c.writeUInt16LE(20, 6);              // version needed
  c.writeUInt16LE(FLAG_UTF8, 8);
  c.writeUInt16LE(8, 10);              // method
  c.writeUInt16LE(time, 12);
  c.writeUInt16LE(date, 14);
  c.writeUInt32LE(crc, 16);
  c.writeUInt32LE(compressed.length, 20);
  c.writeUInt32LE(data.length, 24);
  c.writeUInt16LE(nameBuf.length, 28);
  c.writeUInt16LE(0, 30);              // extra
  c.writeUInt16LE(0, 32);              // comment
  c.writeUInt16LE(0, 34);              // disk
  c.writeUInt16LE(0, 36);              // internal attrs
  c.writeUInt32LE(0, 38);              // external attrs
  c.writeUInt32LE(offset, 42);         // local header offset
  central.push(Buffer.concat([c, nameBuf]));

  offset += local.length + nameBuf.length + compressed.length;
}

const cdStart = offset;
const cd = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(0, 4);
end.writeUInt16LE(0, 6);
end.writeUInt16LE(central.length, 8);
end.writeUInt16LE(central.length, 10);
end.writeUInt32LE(cd.length, 12);
end.writeUInt32LE(cdStart, 16);
end.writeUInt16LE(0, 20);              // comment len

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(outZip, Buffer.concat([...chunks, cd, end]));

const kb = (fs.statSync(outZip).size / 1024).toFixed(1);
console.log(`✓ 已打包 ${entries.length} 个文件 → ${outZip} (${kb} KB)`);
