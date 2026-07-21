# “AI 味”反模式清单

微调现有样式时**先读此文件**，对照 `audit-styles.mjs` 的体检结果逐条修正。每条含：**禁用表现 → 修正方案**。

| 禁用 | 修正 |
| --- | --- |
| 纯黑 `#000` | 用 off-black / `neutral.950`（如 `#0a0a0b`） |
| 霓虹外发光（大模糊 + 高饱和色） | 内描边 或 着色淡阴影（`shadow.md/lg` tinted） |
| 过饱和强调色（饱和度 > 80%） | 降饱和至 < 80% 并与中性色融合 |
| 渐变文字 | 用字重 / 对比度建立层级 |
| **Inter** 字体 | Geist / Satoshi / Cabinet Grotesk |
| 超大 H1 硬撑层级 | 字重 + 色对比 + 间距控制层级 |
| 三等卡片行 `grid(3×1fr)` | 2 列之字 / 非对称栅格 / 横向滚动 |
| 居中 Hero（h1 + text-align:center + 单列） | 分屏 / 左对齐内容 + 右侧资产 / 非对称留白 |
| 仪表盘用衬线 | 仅无衬线（Geist + Geist Mono） |
| 占位 John Doe / Acme / 99.99% | 真实感命名 + 有机数据 |
| 破损 Unsplash 链接 | `picsum.photos/seed/{seed}/{w}/{h}` |
| 默认黑色 `box-shadow` 未着色 | 着色到背景色相的 tinted shadow |
| 可交互元素缺 `:focus-visible` | 加 2px 着色 outline，offset 2px |
| 间距魔法数字（13px / 17px 等） | 取 `space` 阶梯（4px 网格） |
| 字号不属字阶 | 取 `font.size`（容差 ±1px） |

## 检测项与级别（audit-styles.mjs 实现）

| 类别 | 检测 | 级别 |
| --- | --- | --- |
| 色彩 | 纯黑 `#000` / `#000000` | error |
| 色彩 | 饱和度 > 80% 的强调色 | warn |
| 排版 | `font-family: Inter` | error |
| 排版 | 字号不属字阶（容差 ±1px） | warn |
| 间距 | padding/margin/gap 不属间距阶梯 | warn |
| 布局 | 三等宽卡片行（`repeat(3,1fr)` / `1fr 1fr 1fr`） | warn |
| 布局 | `text-align: center` | warn |
| 阴影 | 默认黑色 `box-shadow` 未着色 | warn |
| 阴影 | 霓虹外发光（大模糊 + 高饱和色） | warn |
| 交互 | 可交互元素缺 `:focus-visible` | warn |
| 内容 | 占位名 John Doe / Acme / 99.99% | info |

> 退出码：有 error → 1（必须清零）；warn/info 尽量清零。

## 修正示例

```css
/* 反模式 */
.hero { text-align: center; }
.hero h1 { font-size: 52px; color: #7c3aed; }
.card { box-shadow: 0 0 40px 8px #a855f7; }
.btn { background: #000; }

/* 修正后（基于 token） */
.hero { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: var(--space-12); align-items: center; }
.hero h1 { font-size: var(--font-size-4xl); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-tighter); color: var(--color-text-primary); }
.card { box-shadow: var(--shadow-lg); }
.btn { background: var(--color-primary); color: var(--color-primary-fg); }
.btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
```
