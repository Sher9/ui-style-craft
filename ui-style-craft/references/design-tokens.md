# Design Tokens 规范

本文件是 `ui-style-craft` 的**单一真相源**。由 `scripts/generate-tokens.mjs` 产出、`validate-contrast.mjs` 校验、`audit-styles.mjs` 比对，全部围绕它。token 以 **JSON 为规范格式**，可导出 CSS / TS / SCSS；不绑定任何框架。

## 1. 色彩

```jsonc
{
  "color": {
    "neutral": {              // 中性色阶 50–950，共 11 级，由 accent 色相派生
      "50": "#f8fafc", "100": "#f1f5f9", "200": "#e2e8f0",
      "300": "#cbd5e1", "400": "#94a3b8", "500": "#64748b",
      "600": "#475569", "700": "#334155", "800": "#1e293b",
      "900": "#0f172a", "950": "#0a0a0b"   // 950 = off-black，禁纯黑
    },
    "semantic": {
      "bg":            "{color.neutral.50}",
      "surface":       "#ffffff",
      "surface-2":     "{color.neutral.100}",
      "border":        "{color.neutral.200}",
      "text-primary":   "{color.neutral.900}",
      "text-secondary": "{color.neutral.600/700}",   // 自动取 ≥4.5:1 的档
      "text-muted":     "{color.neutral.500/600}",   // 自动取 ≥4.5:1 的档
      "primary":        "#2563eb",          // 唯一强调色，饱和度 < 80%
      "primary-fg":     "#ffffff",          // 自动保证 ≥4.5:1
      "success": "#16a34a", "warning": "#d97706",
      "danger":  "#dc2626", "info":   "#0891b2"
    }
  }
}
```

**硬规则**
- 最多 1 个强调色，饱和度 < 80%。
- **禁纯黑**，用 `neutral.950`（off-black）。
- 同项目不混冷暖灰（中性阶统一由一个 accent 色相派生）。
- 所有 `text-*` / `bg` 组合 ≥ WCAG AA（正文 4.5:1，大字 3:1）；`primary-fg` 对 `primary` 同样 ≥4.5:1。

**派生算法**（`lib/color.mjs`）
- `generateNeutralRamp(accentHue, mode)`：以 accent 色相为基调、固定低饱和，按感知亮度 L 均匀切 11 级（light: L 98→9；dark: 倒置）。
- `generateSemanticColors(accent, mode, neutral)`：派生 primary 及其前景（自动在白/黑中取 ≥4.5:1），并**自动加深 text-secondary / text-muted** 直到在 bg/surface/surface-2 上均达标。

## 2. 排版

```jsonc
{
  "font": {
    "family": {
      "sans": "Geist, Satoshi, system-ui, sans-serif",   // 禁 Inter
      "mono": "Geist Mono, JetBrains Mono, monospace"
    },
    "size": {                     // modular scale, ratio 默认 1.125
      "xs": "0.75rem", "sm": "0.875rem", "base": "1rem",
      "lg": "1.125rem", "xl": "1.25rem", "2xl": "1.5rem",
      "3xl": "2rem", "4xl": "2.5rem", "5xl": "3.25rem", "6xl": "4rem"
    },
    "weight": { "regular": "400", "medium": "500", "semibold": "600", "bold": "700" },
    "lineHeight": { "tight": "1.15", "normal": "1.5", "relaxed": "1.625" },
    "letterSpacing": { "tighter": "-0.02em", "normal": "0", "wide": "0.025em" }
  }
}
```

**硬规则**：层级靠字重 + 对比度 + 间距建立，不靠单纯放大；仪表盘仅无衬线（Geist + Geist Mono）；行高正文 1.5、标题 1.15。

## 3. 间距

```jsonc
{
  "space": {                      // 4px 基准
    "0": "0", "1": "4px", "2": "8px", "3": "12px", "4": "16px",
    "5": "20px", "6": "24px", "8": "32px", "10": "40px",
    "12": "48px", "16": "64px", "20": "80px"
  },
  "spaceAlias": { "xs": "{space.1}", "sm": "{space.2}", "md": "{space.4}", "lg": "{space.6}", "xl": "{space.8}", "2xl": "{space.12}" }
}
```

**硬规则**：所有 padding / margin / gap 取自阶梯，**禁魔法数字**。`--density` 参数以 0.75/1/1.5 倍率缩放基准（结果仍对齐 4px 网格）。紧凑密度适合数据密集型仪表盘，舒适密度适合营销/阅读页。

## 4. 圆角 / 阴影 / 动效

```jsonc
{
  "radius": { "none": "0", "sm": "4px", "md": "8px", "lg": "12px", "xl": "16px", "2xl": "24px", "full": "9999px" },
  "shadow": {   // 着色到背景色相（tinted），三层体系
    "sm": "0 1px 2px 0 rgba(15,23,42,0.05)",
    "md": "0 4px 6px -1px rgba(15,23,42,0.07), 0 2px 4px -2px rgba(15,23,42,0.05)",
    "lg": "0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.05)",
    "xl": "0 20px 25px -5px rgba(15,23,42,0.10), 0 8px 10px -6px rgba(15,23,42,0.05)"
  },
  "motion": {
    "duration": { "instant": "0ms", "fast": "150ms", "normal": "250ms", "slow": "400ms" },
    "easing": { "standard": "cubic-bezier(0.4,0,0.2,1)", "emphasized": "cubic-bezier(0.2,0,0,1)", "decelerate": "cubic-bezier(0,0,0.2,1)" }
  }
}
```

**硬规则**：阴影着色到背景色相（非默认黑），禁霓虹外发光；动效走 `motion.duration`/`motion.easing`，尊重 `prefers-reduced-motion`。

## 5. 命名约定

- 语义变量：`--color-bg` / `--color-text-primary` / `--color-primary` / `--color-border` 等。
- 间距：`--space-{n}`；别名 `--space-{xs|sm|md|lg|xl|2xl}`。
- 导出时 CSS 用 `:root { --... }`，TS 用 `export const tokens = {...} as const`。
