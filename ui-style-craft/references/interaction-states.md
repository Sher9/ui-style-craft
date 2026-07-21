# 交互态规范

每个可交互元素必须覆盖以下状态。缺失 `:focus-visible` 即无障碍缺陷（`audit-styles.mjs` 会报 warn）。

## 1. hover

- 轻微背景 / 边框变化，过渡 `150ms`（`motion.duration.fast`）。
- 按钮：背景加深一档（如 `primary` → `primary-hover`）；链接：下划线。
- 不在 hover 时改变布局尺寸（避免抖动）。

## 2. focus-visible（无障碍必需）

```css
.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

- 绝不直接写 `outline: none` 而不给替代；用 `:focus-visible` 而非 `:focus` 以避免鼠标点击也显示环。
- 输入框聚焦：`border-color: primary` + 3px 着色光环（`box-shadow: 0 0 0 3px color-mix(...)`）。

## 3. active

- 模拟按压：微缩放 `translateY(1px)` 或背景再深一档。
- 过渡 `150ms` 内完成。

## 4. loading / skeleton

- 用 skeleton 匹配将被替换内容的布局尺寸（标题行、段落块、头像圆），非通用居中 spinner。
- 骨架色用 `neutral` 阶做呼吸微动效（尊重 `prefers-reduced-motion` 时静止）。
- 加载中按钮：`disabled` + `opacity 0.6` + spinner 内联。

## 5. empty

- 构图完整的空状态：图标/插画 + 一句说明 + 1 个主引导动作。
- 不只用“暂无数据”孤字。

## 6. error

- 表单错误：字段边框/文字用 `danger`，内联具体提示（如“邮箱格式不正确”）。
- 不仅靠颜色传达错误（色盲不可辨）→ 配文字/图标。
- 全局错误：模态或 toast，提供重试/返回动作。

## 7. 动效总约定

- 时长走 `motion.duration`（fast 150 / normal 250 / slow 400）。
- 缓动走 `motion.easing`（standard / emphasized / decelerate）。
- 只动 `transform` / `opacity`，避免动画 `width/height/top/left` 引发重排。
- 全局包裹 `@media (prefers-reduced-motion: reduce) { * { transition: none; animation: none; } }`。
