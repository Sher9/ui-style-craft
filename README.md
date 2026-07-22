# ui-style-craft

一个面向 **CodeBuddy** 的 UI 视觉质量增强技能包 **`ui-style-craft`**：把专业设计体系（design token + 视觉规范 + 反模式禁令）沉淀为可执行资产，让 AI 写/改出来的前端界面一致、可访问、无“AI 味”。
- 打包产物：`dist/ui-style-craft.zip`

---

## 一、这个 Skill 有什么用（作用）

LLM 生成的前端界面普遍存在五类顽疾，本 Skill 专门解决它们：

| 顽疾 | 典型表现 | 本 Skill 如何应对 |
|---|---|---|
| 间距混乱 | 随手 `margin: 13px`、`padding: 7px` | 强制 4px 间距网格 + token 阶梯，禁止魔法数字 |
| 色彩失控 | 纯黑 `#000`、霓虹紫蓝、冷暖灰混用 | 单一强调色 + 中性色阶 + 语义色，自动校验对比度 |
| 排版发虚 | 字号随意、行高紧、层级靠“放大”硬撑 | 模块化字阶 + 固定字重/行高/字距 |
| 缺乏纵深 | 全平面、或默认外发光阴影 | 着色阴影（tinted shadow）+ 圆角/动效体系 |
| “AI 味”明显 | 居中 Hero、三等卡片、Inter 字体、John Doe 占位 | `audit-styles.mjs` 反模式体检 + `references/anti-patterns.md` 禁令 |

覆盖两类工作场景：

- **微调现有样式**：先用 `audit-styles.mjs` 体检找问题，再改。
- **从零构建 UI**：先用 `generate-tokens.mjs` 生成 token，再据 token 写代码。

---

## 二、设计思路

1. **规范优先于个人审美**。把“好设计”显性化为可检查的规则，写 UI 时“被迫”遵循，而不是每次重新发明轮子。
2. **确定性工具，而非玄学建议**。用纯 Node.js 脚本做“生成 / 校验”，结果可复现、可接入 CI，而非只在提示词里空谈。
3. **框架无关 + 零依赖**。只产出 token（JSON/CSS/TS）与规范文档，不绑定 React/Vue 等任何框架；脚本仅用 Node 标准库，无需 `npm install`。
4. **渐进加载**。SKILL.md 保持精简（<5k 字，给 Agent 工作流与硬规则），详细规范下沉到 `references/`，按需加载，避免上下文膨胀。
5. **单一真相源**。token 以 `tokens.json` 为源，CSS/TS 由其派生，避免多份样式定义漂移。

---

## 三、实现原理

### 1. Skill 加载机制（CodeBuddy）

CodeBuddy 在匹配到 UI/CSS 相关任务时自动加载 `ui-style-craft/SKILL.md`，其 `description` 中的触发词（写页面/做界面/调样式/美化 UI/写组件/改 CSS…）决定何时激活。SKILL.md 内给出：场景分流、硬规则、7 步工作流、脚本调用约定、`references` 索引。Agent 据此在合适时机调用 `scripts/` 下脚本并读取 `references/`。

### 2. 三个核心脚本

| 脚本 | 职责 | 关键算法 |
|---|---|---|
| `generate-tokens.mjs` | 由少量种子生成自洽 token 集合 | 色相派生中性色阶 → 派生语义色 → 生成字阶/间距/圆角/着色阴影/动效 |
| `validate-contrast.mjs` | WCAG 对比度闸门（CI 友好） | 相对亮度 → 对比度公式 → 二分搜索建议达标色 |
| `audit-styles.mjs` | “AI 味”/离标样式体检 | 正则扫描源文件 → 11 类反模式规则 → 分级报告 |

### 3. 颜色与对比度（`lib/color.mjs`）

- **色空间转换**：十六进制 ↔ RGB ↔ HSL，供派生与饱和度判断。
- **WCAG 相对亮度**：先按 sRGB 线性化（≤0.03928 走线性段，否则走指数段），再按人眼权重 `0.2126R + 0.7152G + 0.0722B` 叠加。
- **对比度**：`(L亮 + 0.05) / (L暗 + 0.05)`，≥4.5 满足 AA 正文、≥3 满足大字。
- **语义色自动达标**：`generateSemanticColors` 用 `pick()` 在候选色档中逐档加深，确保 `text-secondary`/`text-muted` 在各背景上都 ≥4.5:1，避免人工调色的对比度翻车。

### 4. 字阶与间距（`lib/scale.mjs`）

- **模块化字阶**：以 `base`（rem）为基准、按几何比例 `ratio`（默认 1.125 小五度）等比生成各档字号，层级视觉增量一致。
- **4px 间距网格**：基础网格 × 密度系数（compact/normal/comfortable），四舍五入后强制回到网格，杜绝离标值。

### 5. 反模式检测（`scripts/audit-styles.mjs`）

对 CSS/SCSS/TSX/JSX/Vue 源文件逐文件正则扫描，识别：纯黑 `#000`、Inter 字体、离标间距/字号、三等卡片、居中 Hero、默认黑阴影、霓虹外发光、过饱和色、缺 `:focus-visible`、占位内容（John Doe/Acme/Lorem…）。问题按 `error/warn/info` 三级上报，有 error 时退出码 1（可卡 CI / 提交钩子）。

---

## 四、项目结构

```
ai-ui-skill-demo/
├── ui-style-craft/                 # 技能包本体（导入目标）
│   ├── SKILL.md                    # 技能入口：触发词/场景分流/硬规则/工作流/脚本约定
│   ├── package.json                # "type":"module"，零依赖；自带 tokens/contrast/audit 脚本
│   ├── lib/                        # 纯算法库（被脚本复用）
│   │   ├── color.mjs               # 色空间转换、WCAG 亮度/对比度、中性色阶与语义色派生
│   │   ├── scale.mjs               # 模块化字阶、4px 间距阶梯、圆角阶梯生成
│   │   └── tokens.schema.json      # token JSON Schema，校验输入输出合法性
│   ├── scripts/                    # 三个零依赖 CLI 脚本
│   │   ├── generate-tokens.mjs     # 生成 design token（json/css/ts）
│   │   ├── validate-contrast.mjs   # WCAG 对比度校验（CI 闸门）
│   │   └── audit-styles.mjs        # 反模式 / 离标样式体检
│   ├── references/                 # 详细规范，按需加载（避免 SKILL.md 膨胀）
│   │   ├── design-tokens.md        # token 体系完整规范（色彩/排版/间距/圆角/阴影/动效）
│   │   ├── visual-principles.md    # 视觉原则（层级/留白/对齐/节奏/纵深）
│   │   ├── layout-patterns.md      # 构图模式 + 页面骨架索引（天花板，不是地板）
│   │   ├── styles.md               # 风格预设指南（极简/商务/玻璃/科技/马卡龙/国潮/多巴胺 + 风格例外）
│   │   ├── mobile.md               # 移动端 / 小程序规范（rpx、CJK 字体、安全区、WXSS 限制）
│   │   ├── fonts.md                # Geist/Satoshi 加载片段 + 中文 CJK 字体栈 + 衬线说明
│   │   ├── polish.md               # 打磨层（表面渐变/噪点/选区/滚动条/图标/微动效）
│   │   ├── anti-patterns.md        # “AI 味”反模式清单 + 修正方案 + 风格例外
│   │   ├── component-patterns.md   # 按钮/卡片/表单/表格/导航/反馈组件指引
│   │   └── interaction-states.md   # hover/focus/active/loading/empty/error 交互态规范
│   ├── templates/                  # 可直接抄改的页面骨架
│   │   ├── _tokens.css             # 默认 token 的 :root 变量（真实项目替换为生成的 tokens.css）
│   │   ├── hero-split.html         # 非对称分屏首屏（web）
│   │   ├── features-asymmetric.html# 之字特性区（web）
│   │   ├── stats-band.html         # 数据带（web）
│   │   ├── pricing.html            # 定价（web）
│   │   ├── settings-form.html      # 设置表单页（web）
│   │   ├── dashboard.html          # 后台仪表盘（web）
│   │   ├── web-tech.html           # 科技风落地页（暗色 + 渐变标题 + 辉光卡片）
│   │   ├── web-glass.html          # 玻璃拟态落地页（彩色背景 + 磨砂卡片）
│   │   ├── mobile-web.html         # 移动端 web（吸顶导航+列表+底部 Tab+安全区）
│   │   ├── login-split.html         # 登录页·浅色分屏（默认/推荐，响应式到移动端）
│   │   ├── login-mobile.html        # 登录页·移动端单列（触控友好+安全区）
│   │   ├── login-glass.html         # 登录页·玻璃拟态（彩色背景+磨砂卡）
│   │   └── login-dark.html          # 登录页·暗色（深画布+深色玻璃卡）
│   │   ├── miniprogram/            # 小程序极简卡片（WXML + WXSS，rpx + 安全区 + hover-class；风格无关，可配任意 preset）
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   ├── miniprogram-macaron/    # 小程序马卡龙（暖奶油底 + 粉彩标签）
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   └── miniprogram-guochao/    # 小程序国潮新中式（宣纸底 + 衬线标题 + 朱砂点缀）
│   │       ├── index.wxml
│   │       └── index.wxss
│   └── assets/
│       └── default-tokens.json     # 一套中性浅色默认 token 样本
├── ui-style-craft.md               # 技能设计原文文档（设计依据）
└── dist/
    └── ui-style-craft.zip          # 打包产物（可直接导入）
```

---

## 五、怎么用

### 方式 A：作为 CodeBuddy Skill 导入

1. 解压 `dist/ui-style-craft.zip`。
2. 放到技能目录（二选一）：
   - 用户级：`~/.codebuddy/skills/ui-style-craft/`
   - 项目级：`.codebuddy/skills/ui-style-craft/`
3. 之后在对话框里让 CodeBuddy“写页面 / 调样式 / 美化 UI”，它会自动加载该技能并遵循其规范与工作流。

### 方式 B：命令行直接使用脚本

需要 **Node.js ≥ 18**。所有脚本位于 `ui-style-craft/` 下，纯 Node 运行。

**1) 生成 token**

```bash
cd ui-style-craft
node scripts/generate-tokens.mjs \
  --accent "#2563eb" --mode light --density normal \
  --ratio 1.125 --out json,css,ts --dir ./design-tokens
```

参数：

| 参数 | 说明 | 默认 |
|---|---|---|
| `--accent` | 强调色（自动派生语义色与色阶） | `#2563eb` |
| `--mode` | `light` / `dark` | `light` |
| `--density` | `compact` / `normal` / `comfortable` | `normal` |
| `--ratio` | 字阶比例 | `1.125` |
| `--platform` | `web` / `wechat`（小程序） | `web` |
| `--preset` | 风格预设：`minimal` / `business` / `glass` / `tech` / `macaron` / `guochao` / `dopamine` | `minimal` |
| `--out` | 输出格式，可多选 `json,css,ts,wxss` | `json,css,ts` |
| `--dir` | 输出目录 | `./design-tokens` |

**风格预设**：用 `--preset` 在极简基线上叠加色板 / 阴影 / 字体 / 玻璃面偏差（详见 `references/styles.md`）。常见组合：

| 用户诉求 | 命令要点 |
|---|---|
| Web 极简 / 商务 | `--preset minimal`（商务加 `--accent` 深蓝） |
| Web 玻璃拟态 | `--preset glass --accent "#6366f1"` |
| Web / 小程序 科技 | `--preset tech --mode dark --accent "#22d3ee"` |
| 小程序 马卡龙 | `--preset macaron --platform wechat --accent "#f9a8d4"` |
| 小程序 国潮 | `--preset guochao --platform wechat --accent "#3b6ea5"` |
| 小程序 多巴胺 | `--preset dopamine --platform wechat --accent "#ff5d8f"` |

**小程序场景**：`--platform wechat` 自动把字体族切为 CJK 栈，并支持 `--out wxss` 产出 `rpx` 单位的 `tokens.wxss`（间距 `px×2`、字号 `rem×32`）：

```bash
node scripts/generate-tokens.mjs --preset macaron --platform wechat --mode light --density normal \
  --out wxss,json --dir ./miniprogram/styles
# 在 app.wxss 顶部：@import "styles/tokens.wxss";
```

**2) 校验对比度**

```bash
node scripts/validate-contrast.mjs --tokens ./design-tokens/tokens.json --level AA
```

输出每个文本/背景组合的 PASS/FAIL，失败项给出建议色；有 FAIL 时退出码 1。

**3) 体检反模式**

```bash
node scripts/audit-styles.mjs --src "./src/**/*.{css,scss,tsx,jsx,vue}" --tokens ./design-tokens/tokens.json
```

不传 `--tokens` 时按内置默认阶梯容差检查。有 error 时退出码 1。

> `package.json` 已内置便捷脚本：`npm run tokens` / `npm run contrast` / `npm run audit`（需在 `ui-style-craft/` 目录执行）。

---

## 六、补充

### 质量红线（硬规则）

- 所有间距/字号/圆角取自 token 阶梯，禁止魔法数字。
- 文本/背景对比度 ≥ WCAG AA（正文 4.5:1，大字 3:1）。
- 禁用纯黑 `#000`；最多 1 个强调色，饱和度 < 80%。
- 禁用 Inter 字体（用 Geist / Satoshi）；仪表盘禁用衬线。
- 禁用三等卡片行、居中 Hero、霓虹外发光、渐变文字。
- 阴影须着色到背景色相（tinted shadow），非默认黑阴影。
- 每个可交互元素必须有 `:hover` / `:active` / `:focus-visible`。

### CI / 提交钩子集成

`validate-contrast.mjs` 与 `audit-styles.mjs` 均在有问题时以退出码 1 结束，可直接接入 CI 流水线或 Git 预提交钩子（如 Husky + lint-staged），把“视觉质量”变成可卡点的工程约束。

### 零依赖与兼容性

- 脚本声明 `"type": "module"`，使用 ESM。
- 目录遍历用自写递归 walker，不依赖 `fs.globSync`，兼容较低版本 Node（≥18）。
- 无第三方包，`clone` 后即可运行，无安装成本。

### 可扩展方向

- 增加暗色主题自动对比度复核（已支持 `--mode dark` 生成，可接力 `validate-contrast`）。
- 为 `lib/` 补单元测试（覆盖对比度计算与 token 自洽性），纳入 CI。
- 扩展 `audit-styles.mjs` 规则库（如动效时长、层级 z-index 规范）。
- 接入更多框架的 token 导出格式（如 Style Dictionary 兼容输出）。

### 演进路线（参考 `ui-style-craft.md`）

设计文档规划了四阶段演进：① 基础 token 与校验 → ② 组件级模式库 → ③ 交互态与动效体系 → ④ 与 Ardot 设计体系对齐，逐步把“好看”从个人能力变成团队资产。
