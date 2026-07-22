# 登录页（Login）设计指引

本项目沉淀了 4 套可直接抄改的登录页模板，均引用 `templates/_tokens.css`（design token 单一真相源），间距 / 字号 / 圆角全部走变量，规避“AI 生成很丑”的顽疾。

## 0. 模板速查

| 文件 | 风格 | 适用 | 构图 |
|------|------|------|------|
| `login-split.html` | 浅色分屏（**默认 / 推荐**） | Web 桌面 / 平板，响应式折叠到手机 | 左品牌面板 0.92fr + 右表单 1.08fr |
| `login-mobile.html` | 浅色单列 | 移动端 web | 单列，触控目标 ≥44px，安全区 |
| `login-glass.html` | 玻璃拟态（preset: glass） | 想突出“惊艳感”的 Web | 彩色渐变画布 + 居中磨砂卡 |
| `login-dark.html` | 暗色（preset: dark） | 暗色主题 / 夜间模式 | 深画布 + 深色玻璃卡 + 靛蓝点缀 |

> 选哪套：**首选 `login-split.html`**（最稳、最像高端 SaaS、天然响应式）。需要氛围感用 glass，需要暗色用 dark，纯移动端落地页用 `login-mobile.html`。

## 1. 构图原则（避免登录页常见 AI 丑点）

- **不做居中大卡片 Hero**：用**非对称分屏**（品牌展示在左，表单在右），或玻璃/暗色下的**居中磨砂卡**（玻璃/暗色属预设正解，不视为反模式）。
- **表单内容左对齐**：标题、标签、按钮左对齐，靠字重 + 间距建立层级，而非放大字号硬撑。
- **单一视觉焦点**：一屏一个主行动（登录按钮），社交登录与注册引导为次级，不处处强调。
- **留白走 4px 栅格**：区块 / 字段组 / 组内间距取自 `space` 阶梯且分级可见。

## 2. 组件清单（顺序即视觉层级）

1. **品牌区**：logo（内联 SVG 几何标）+ 产品名，置于左上或卡片顶部。
2. **主标题 + 副文案**：`h2`（3xl，semibold，紧字距）+ `lead`（text-secondary，sm）。
3. **社交登录**：Google / GitHub 次级描边按钮（图标用品牌色 / 中性色，非高饱和平涂），两列网格。
4. **分隔线**：“或使用邮箱登录”，左右 1px `border` 细线。
5. **邮箱字段**：`label` 在上，`input` 在下，前导图标（mail），占位 `you@company.com`（禁用 `Acme` / `John Doe` / `Lorem`）。
6. **密码字段**：前导锁图标 + 右侧显隐切换（`type` 切换 + aria-label）。
7. **记住我 + 忘记密码**：一行两端对齐（`remember` 用 `accent-color: primary`）。
8. **主按钮**：`primary` 填充、full-width、48px 高、`:active` 微缩放、提交时 loading 态。
9. **注册引导**：底部居中 `text-secondary` + `primary` 链接。

## 3. token 用法（硬规则）

- 间距：全部 `var(--space-*)`；字号：`var(--font-size-*)`；圆角：`var(--radius-md)`（输入/按钮）、`var(--radius-2xl)`（玻璃卡）。
- 阴影：**着色阴影**，非默认黑。浅色版用 `_tokens.css` 的 `shadow-sm/md`；玻璃/暗色版用预设的着色辉光（`rgba(99,102,241,…)`，低透明，非霓虹）。
- focus ring：输入框 `border-color: primary` + `box-shadow: 0 0 0 3px color-mix(in srgb, primary 22~30%, transparent)`；其余可交互元素继承 `_tokens.css` 全局 `:focus-visible` 着色 outline。
- 字体：Web 用 `Geist` 置于 `PingFang SC/微软雅黑` 之前；中文界面必须含 CJK 栈，否则掉字。
- 颜色：禁用纯黑；文本 / 背景对比度 ≥ WCAG AA（正文 4.5:1）。暗色版底色用 `#0a0d16` 系（非 `#000`），文字用浅中性阶。

## 4. 玻璃 / 暗色变体要点

- **玻璃（glass）**：背景**必须有彩色块供折射**（多色 radial-gradient + 浅色 linear 底），否则玻璃感出不来；玻璃卡仅做容器，文字用加深 `text-primary` 保对比；主按钮可用 `linear-gradient(primary→accent)`。
- **暗色（dark）**：近黑底 + 低透明靛蓝径向辉光（非纯黑、非过曝白光晕）；卡片用半透明深色 + `backdrop-filter` 磨砂 + 着色辉光阴影；输入框半透明白底、浅色文字；危险色用提亮的 `#f87171` 以达 AA。

## 5. 反模式清单（登录页专属）

- 禁用：居中大卡片 Hero（浅色风）、三等卡片行、纯黑 `#000`、Inter 字体、默认黑阴影、霓虹外发光、离栅间距（如 `13px`）、占位 `Acme`/`John Doe`/`Lorem`、缺 `:focus-visible`。
- 玻璃 / 暗色风**放开**：渐变标题/按钮、着色辉光（用预设变量，勿自造纯黑辉光）。

## 6. 接后端（把演示态换成真实请求）

模板内置前端校验 + `setTimeout` 模拟提交。接入真实接口时，替换 `submit` 处理器：

```js
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let ok = true;
  if (!isEmail(form.email.value.trim())) { emailField.classList.add("error"); ok = false; }
  if (!form.password.value) { passField.classList.add("error"); ok = false; }
  if (!ok) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> 登录中…';
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.value,
        password: form.password.value,
        remember: form.remember.checked,
      }),
    });
    if (!res.ok) throw new Error("登录失败");
    location.href = "/dashboard"; // 成功跳转
  } catch (err) {
    passField.classList.add("error"); // 显示错误态（结合 .msg 文本）
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "登录";
  }
});
```

## 7. 自检清单（交付前）

- [ ] 选用了贴合诉求的模板；间距 / 字号 / 圆角全走 token，无魔法数字。
- [ ] 无 `#000`、无 `Inter`、无默认黑阴影、无霓虹；玻璃/暗色仅用预设辉光。
- [ ] 字体真实加载（Geist + CJK 栈），中文不掉字。
- [ ] 每个可交互元素有 `:hover` / `:active` / `:focus-visible`。
- [ ] 响应式：≤900px 表单占满且可用；移动端触控目标 ≥44px、含安全区。
- [ ] 文本 / 背景对比度 ≥ AA。
