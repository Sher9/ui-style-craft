---
name: ui-style-craft
description: "UI 视觉质量增强技能。当 CodeBuddy 编写或修改前端界面代码（页面、组件、CSS/样式、布局、表单、卡片、导航等）时使用，通过 design token 体系与专业设计规范，让产出的界面一致、可访问、无“AI 味”。涵盖微调现有样式与从零构建 UI 两个场景。触发词：写页面/做界面/调样式/美化 UI/写组件/改 CSS/做布局/做表单/做卡片/polish UI/style the component。"
agent_created: true
---

# UI Style Craft

## 定位

让 CodeBuddy 写出/改出的前端界面自带专业设计感——一致、可访问、无“AI 味”。把专业设计体系（token 系统 + 视觉规范 + 反模式禁令）沉淀为可执行资产，写 UI 时“被迫”遵循，而不是每次重新发明轮子。

## 1. 场景分流

- **微调现有样式** → 先加载 `references/anti-patterns.md` + 运行 `audit-styles.mjs` 体检，再据问题改。
- **从零构建 UI** → 先加载 `references/design-tokens.md` + `references/visual-principles.md`，运行 `generate-tokens.mjs` 生成 token，再据 token 写代码。

## 2. 硬规则（不可违反）

- 所有间距 / 字号 / 圆角必须取自 token 阶梯，**禁止魔法数字**。
- 文本 / 背景对比度 ≥ WCAG AA（正文 4.5:1，大字 3:1）。
- **禁用纯黑 `#000`**；最多 1 个强调色，饱和度 < 80%。
- **禁用 Inter 字体**（用 Geist / Satoshi）；仪表盘禁用衬线。
- 禁用三等卡片行、居中 Hero、霓虹外发光、渐变文字。
- 阴影须着色到背景色相（tinted shadow），非默认黑阴影。
- 每个可交互元素必须有 `:hover` / `:active` / `:focus-visible`。

## 3. 工作流

1. 判断场景（微调 / 新建）。
2. 按场景加载对应 `references/`（见第 5 节索引）。
3. 新建场景：运行 `generate-tokens.mjs` 产出 token，落地到项目（JSON 为规范源，导出 CSS/TS）。
4. 据 token + 规范写 / 改 UI 代码（间距、字阶、圆角、语义色全部走变量）。
5. 运行 `audit-styles.mjs` 自检，修复反模式与离标值（error 必须清零）。
6. 运行 `validate-contrast.mjs` 复核可访问性（必须全 PASS）。
7. 交付。

## 4. 脚本调用约定

所有脚本为纯 Node.js（ESM，零依赖），在 `scripts/` 下运行。

### generate-tokens.mjs — 生成 design token

```bash
node scripts/generate-tokens.mjs \
  --accent "#2563eb" --mode light --density normal \
  --ratio 1.125 --out json,css,ts --dir ./design-tokens
```

输入种子：`--accent`（强调色，自动派生语义色）、`--mode`（light/dark）、`--density`（compact/normal/comfortable）、`--ratio`（字阶比例，默认 1.125）、`--out`（json,css,ts 可多选）、`--dir`（输出目录）。输出 `tokens.json`（单一真相源）+ `tokens.css` + `tokens.ts`。算法见 `lib/color.mjs`、`lib/scale.mjs`。

### validate-contrast.mjs — WCAG 对比度校验

```bash
node scripts/validate-contrast.mjs --tokens ./design-tokens/tokens.json --level AA
```

读 `tokens.json`，枚举所有语义文本/背景组合，输出 PASS/FAIL 表格；有 FAIL 时退出码 1（可接入 CI），并对失败项给出达标建议色。

### audit-styles.mjs — 反模式体检

```bash
node scripts/audit-styles.mjs --src "./src/**/*.{css,scss,tsx,jsx,vue}" --tokens ./design-tokens/tokens.json
```

扫描样式源文件，检测纯黑、Inter、离标间距/字号、三等卡片、居中 Hero、默认黑阴影、霓虹外发光、过饱和色、缺 focus-visible、占位内容等。有 error 时退出码 1。不传 `--tokens` 时按内置默认阶梯容差检查。

## 5. references 索引（何时加载哪个）

- `references/design-tokens.md` — token 体系完整规范（色彩/排版/间距/圆角/阴影/动效）。**新建场景必读**。
- `references/visual-principles.md` — 视觉原则（层级/留白/对齐/节奏/纵深）。**新建场景读**。
- `references/anti-patterns.md` — “AI 味”反模式清单 + 修正方案。**微调场景必读**。
- `references/component-patterns.md` — 按钮/卡片/表单/表格/导航/反馈 组件级指引。
- `references/interaction-states.md` — hover/focus/active/loading/empty/error 交互态规范。

## 6. 资源

- `assets/default-tokens.json` — 一套中性浅色默认 token（`--preset default` 的产出样本）。
- `lib/tokens.schema.json` — token JSON Schema，校验输入输出合法性。

## 给 Agent 的提示

- 规范优先于个人审美；遇到冲突以本技能 `references/` 与 token 为准。
- 系统性问题改 token 层，不要在组件里打补丁。
- 交付前两步自检脚本必须跑通（无 error、对比度全 PASS）。
