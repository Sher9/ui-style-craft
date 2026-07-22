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
- **从零构建 UI（web）** → 先确定**风格 preset**（见 `references/styles.md`，本文件必读）。运行 `generate-tokens.mjs --preset <风格>` 生成 token，并**只复制 1 套最贴近的 `templates/` 骨架**（用 `read_file` 单独读取那一个文件，**不要一次性载入全部模板**）。其余规范（`design-tokens.md` / `visual-principles.md` / `layout-patterns.md` / `polish.md`）**按需查阅**——仅在需要对应细节时再 `read_file`，不要预先全量加载，以控制上下文体积、加快生成。
- **移动端 / 小程序** → **必读 `references/mobile.md`** 与 `references/styles.md`（选风格 preset）。小程序运行 `generate-tokens.mjs --platform wechat --preset <风格> --out wxss,json` 产出 `rpx` 单位 token；从 `templates/mobile-web.html` 或 `templates/miniprogram/` 取骨架（同样只 `read_file` 对应的一套）。

## 2. 硬规则（不可违反）

- 所有间距 / 字号 / 圆角必须取自 token 阶梯，**禁止魔法数字**。
- 文本 / 背景对比度 ≥ WCAG AA（正文 4.5:1，大字 3:1）。
- **禁用纯黑 `#000`**；默认最多 1 个强调色、饱和度 < 80%（科技 / 马卡龙 / 国潮 / 多巴胺等风格用预设的 `accent-2..4` 与高饱和色，见 `references/styles.md` 风格例外）。
- **禁用 Inter 字体**（用 Geist / Satoshi）；默认禁用衬线（但 `business` / `guochao` 预设允许衬线标题，字体栈已生成 `--font-family-serif`）。
- **字体必须真正加载**：写页面时在 `<head>` 引入 Geist（Google Fonts）并预连接，避免静默回退 `system-ui`（加载片段见 `references/fonts.md`）。
- **中文 / 小程序界面用 CJK 字体栈**（Geist/Satoshi 是纯拉丁字体，不含中文字形，直出会掉字）：`"PingFang SC", "Microsoft YaHei", system-ui`（可把 Geist 置于其前仅作用于拉丁/数字）。生成小程序 token 用 `--platform wechat` 自动切换。详见 `references/mobile.md`。
- **移动端 / 小程序专属硬规则**：① 小程序间距/字号/圆角用 `rpx`（来自 `tokens.wxss`），禁裸 `px` 布局值；② 可点目标 ≥ `88rpx`（44px），主按钮 `88–96rpx`；③ 固定底栏/操作栏含 `env(safe-area-inset-bottom)`；④ 触屏无 `:hover`，按压态用 `:active` / 小程序 `hover-class`；⑤ 无 `color-mix()` / `prefers-reduced-motion`（见 `references/mobile.md` 替代）。
- 禁用三等卡片行、居中 Hero。**霓虹外发光、渐变文字**默认禁用，但在 `glass` / `tech` / `dopamine` 预设下按 `references/styles.md` 风格例外**放开**（用预设生成的辉光阴影与渐变文字，勿自造纯黑辉光）。
- 阴影须着色到背景色相（tinted shadow），非默认黑阴影；`glass` / `tech` / `dopamine` 用预设生成的着色辉光阴影。
- 每个可交互元素必须有 `:hover` / `:active` / `:focus-visible`。

## 3. 工作流

1. 判断场景（微调 / 新建）。
2. 按场景加载对应 `references/`（见第 5 节索引）。
3. 新建场景：
   - Web：运行 `node scripts/generate-tokens.mjs --preset <风格> --accent <色> --mode <light|dark>` 产出 token，落地到项目（JSON 为规范源，导出 CSS/TS）。
   - **小程序**：运行 `node scripts/generate-tokens.mjs --platform wechat --preset <风格> --accent <色> --out wxss,json --dir <项目styles>` 产出 `rpx` 单位 token（`tokens.wxss` 在 `app.wxss` 用 `@import` 引入）。
   - **从 `templates/` 选取最贴近的页面骨架**（web：hero-split / features-asymmetric / stats-band / pricing / settings-form / dashboard / web-tech / web-glass / **login-split**；移动端：mobile-web.html / **login-mobile**；登录：login-split / login-mobile / login-glass / login-dark；小程序：miniprogram/ 及 miniprogram-macaron / miniprogram-guochao），基于它改，而不是凭空构图。
4. 据 token + 规范 + 模板写 / 改 UI 代码（间距、字阶、圆角、语义色全部走变量）。
5. 应用 `references/polish.md` 与 `references/styles.md` 的签名技法（玻璃面 / 辉光 / 渐变文字 / 衬线标题）提升质感——风格专属技法按预设放开，勿当作反模式"修复"掉。
6. 运行 `audit-styles.mjs --style <风格>` 自检（传预设名可放宽辉光 / 高饱和 / 渐变相关检查），修复反模式与离标值（error 必须清零）。
7. 运行 `validate-contrast.mjs` 复核可访问性（必须全 PASS）。
8. **视觉 QA 自检**（见下方「视觉 QA 清单」），确认构图达标后再交付。
9. 交付。

### 视觉 QA 清单（交付前最后一道关）

- [ ] 单一视觉焦点：一屏一个主行动 / 主信息，无"处处强调"。
- [ ] 留白节奏：区块 / 组件 / 组内间距来自 `space` 阶梯且分级可见（不是均匀随机值）。
- [ ] 层级靠字重 + 对比度 + 间距建立，而非单纯放大字号或高饱和色。
- [ ] 反模式已避开（极简/商务：无居中 Hero、无三等卡片行、无纯黑、无 Inter；玻璃/科技/多巴胺：**渐变文字与着色辉光属正解**，不应被"修复"）。
- [ ] 字体真实加载（web：Geist / Satoshi；中文/小程序：CJK 栈；`business`/`guochao` 标题可用 `--font-family-serif`）。
- [ ] 响应式：≤768px 单列且可用；桌面端多列对齐到栅格。
- [ ] 交互态齐全：每个可交互元素有 `:hover` / `:active` / `:focus-visible`。

## 4. 脚本调用约定

所有脚本为纯 Node.js（ESM，零依赖），在 `scripts/` 下运行。

### generate-tokens.mjs — 生成 design token

```bash
node scripts/generate-tokens.mjs \
  --accent "#2563eb" --mode light --density normal \
  --ratio 1.125 --out json,css,ts --dir ./design-tokens
```

输入种子：`--accent`（强调色，自动派生语义色）、`--mode`（light/dark）、`--density`（compact/normal/comfortable）、`--ratio`（字阶比例，默认 1.125）、`--platform`（web/wechat 小程序）、`--preset`（风格：minimal/business/glass/tech/macaron/guochao/dopamine）、`--out`（json,css,ts,wxss 可多选）、`--dir`（输出目录）。输出 `tokens.json`（单一真相源）+ `tokens.css`/`tokens.ts`/`tokens.wxss`。算法见 `lib/color.mjs`、`lib/scale.mjs`、`lib/presets.mjs`。

### validate-contrast.mjs — WCAG 对比度校验

```bash
node scripts/validate-contrast.mjs --tokens ./design-tokens/tokens.json --level AA
```

读 `tokens.json`，枚举所有语义文本/背景组合，输出 PASS/FAIL 表格；有 FAIL 时退出码 1（可接入 CI），并对失败项给出达标建议色。

### audit-styles.mjs — 反模式体检

```bash
node scripts/audit-styles.mjs --src "./src/**/*.{css,scss,tsx,jsx,vue}" --tokens ./design-tokens/tokens.json
```

扫描样式源文件，检测纯黑、Inter、离标间距/字号、三等卡片、居中 Hero、默认黑阴影、霓虹外发光、过饱和色、缺 focus-visible、占位内容等。有 error 时退出码 1。不传 `--tokens` 时按内置默认阶梯容差检查。传 `--style <preset>`（glass/tech/dopamine 等）时放宽对应风格的正解技法检查（辉光 / 高饱和 / 渐变文字）。

## 5. references 索引（何时加载哪个）

> ⚡ 性能约定：以上 references **不要在一次生成中全量预读**。依据当前任务只 `read_file` 真正需要的 1–2 个，其余保持按需；`templates/` 同理，只读取你要抄改的那一套，勿批量载入，以免上下文膨胀拖慢生成。

- `references/design-tokens.md` — token 体系完整规范（色彩/排版/间距/圆角/阴影/动效）。**新建场景必读**。
- `references/visual-principles.md` — 视觉原则（层级/留白/对齐/节奏/纵深）。**新建场景读**。
- `references/layout-patterns.md` — **构图模式 + 页面骨架索引（天花板，不是地板）**。**新建场景必读**。
- `references/styles.md` — **风格预设指南**：极简/商务/玻璃/科技/马卡龙/国潮/多巴胺 9 种诉求 → preset 映射、生成命令、签名技法、风格例外。**用户指定风格时必读**。
- `references/mobile.md` — **移动端 / 小程序规范**（rpx 单位、CJK 字体、触控目标、安全区、WXSS 不支持的 CSS 与替代）。**移动端/小程序必读**。
- `references/fonts.md` — Geist / Satoshi 实际加载片段（`<head>` preconnect + link），避免回退 system-ui；含中文 CJK 字体栈与衬线说明。**新建场景必做**。
- `references/polish.md` — 打磨层（表面渐变 / 噪点 / 选区 / 滚动条 / 图标 / 微动效），区分"及格"与"惊艳"。
- `references/anti-patterns.md` — “AI 味”反模式清单 + 修正方案 + **风格例外**。**微调场景必读**。
- `references/component-patterns.md` — 按钮/卡片/表单/表格/导航/反馈 组件级指引。
- `references/interaction-states.md` — hover/focus/active/loading/empty/error 交互态规范。

## 6. 资源

- `templates/` — **可直接抄改的页面骨架**：
  - **Web**：`hero-split.html`（非对称分屏首屏）、`features-asymmetric.html`（之字特性区）、`stats-band.html`（数据带）、`pricing.html`（定价）、`settings-form.html`（设置表单）、`dashboard.html`（后台仪表盘）、`web-tech.html`（科技风暗色）、`web-glass.html`（玻璃拟态）。
  - **移动端 web**：`mobile-web.html`（吸顶导航 + 列表行 + 底部 Tab + 安全区 + 浮动按钮）。
  - **登录页**：`login-split.html`（浅色分屏，**默认 / 推荐**，响应式到移动端）、`login-mobile.html`（移动端单列、触控友好、安全区）、`login-glass.html`（玻璃拟态）、`login-dark.html`（暗色）。四套共用 token 与组件逻辑，详见 `references/login.md`。
  - **小程序**：`miniprogram/`（极简卡片，WXML + WXSS，rpx + 安全区 + hover-class）、`miniprogram-macaron/`（马卡龙暖底 + 粉彩）、`miniprogram-guochao/`（国潮宣纸底 + 衬线 + 朱砂点缀）。
  - 使用：复制最接近的一页 → Web 用你产出的 `tokens.css` 替换 `_tokens.css`；小程序用 `tokens.wxss` 并在 `app.wxss` `@import`。
- `assets/default-tokens.json` — 一套中性浅色默认 token（`--preset default` 的产出样本）。
- `lib/tokens.schema.json` — token JSON Schema，校验输入输出合法性。

## 给 Agent 的提示

- 规范优先于个人审美；遇到冲突以本技能 `references/` 与 token 为准。
- 系统性问题改 token 层，不要在组件里打补丁。
- 交付前两步自检脚本必须跑通（无 error、对比度全 PASS）。
