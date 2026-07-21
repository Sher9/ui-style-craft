# 组件级指引

具体落地时使用。组件尺寸、内距、圆角、状态一律取自 token。

## 1. 按钮 Button

- 尺寸阶梯：`sm`(32px) / `md`(40px) / `lg`(48px) 高度。
- 内距：横向 `var(--space-4)` ~ `var(--space-5)`，纵向居中。
- 圆角：`var(--radius-md)`(8px)。
- 三级：主（primary 填充）/ 次（surface + border）/ 幽灵（透明 + primary 文字）。
- Focus ring：`outline: 2px solid var(--color-primary); outline-offset: 2px;`
- 禁用：`opacity: 0.5` + `cursor: not-allowed`，不去掉边框。
- 过渡：`150ms` 颜色，`:active` 微缩放 `translateY(1px)`。

## 2. 卡片 Card

- 仅当投影能传达“层级”时使用卡片。
- 内距：24–32px（`--space-6` ~ `--space-8`）。
- 边框：1px `var(--color-border)` + 着色淡阴影 `var(--shadow-sm)`。
- 圆角：`var(--radius-lg)`(12px)。
- 标题与正文间距 ≥ `--space-3`(12px)。

## 3. 表单 Form

- 标签在输入框**上方**，helper 在下，error 在下。
- 垂直间距一致：标签→输入 `--space-2`(8px)，字段组间 `--space-4`(16px)。
- 输入框：高度 40px，圆角 `md`，聚焦时 `border-color: primary` + 3px 着色光环。
- 错误态：边框/文字用 `danger`，内联明确提示，不用仅靠颜色（加图标/文字）。
- 禁用控件视觉可辨（降透明度而非纯灰）。

## 4. 表格 Table

- 分隔优先用 1px 行分隔线 + 留白分组，而非全盒装边框。
- 高密度（compact）：行高 32–36px，1px `border` 分隔。
- 表头：`text-secondary` + `font-weight: medium`，与数据行留白区分。
- 数值列右对齐，文本列左对齐。

## 5. 导航 Navigation

- 栏式（顶部/侧边）：当前项用 `primary` 文字或左侧指示条。
- 抽屉（移动端）：遮罩 + 右侧滑入，聚焦陷阱与 ESC 关闭。
- 面包屑：用 `text-muted` + 分隔符，当前页 `text-primary`。
- 不混用多种导航形态于同一层级。

## 6. 反馈 Feedback

- Toast：右下角，自动消失，圆角 `md` + `shadow-md`，不超过 3 行。
- Modal：遮罩 50% 黑，`surface` + `shadow-xl`，聚焦陷阱。
- Skeleton：匹配将被替换内容的**布局尺寸**（非通用 spinner），用 `neutral` 阶做微动效。
- Empty：构图完整的空状态 + 明确引导动作，不是“无数据”孤字。
- Error：内联明确指示（尤指表单），可恢复。
