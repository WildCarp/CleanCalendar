# CleanCalendar Design System

> 基于 Linear 设计语言，为桌面日历排程工具定制的设计系统。
> 暗色模式优先，同时覆盖亮色模式。设计核心理念：极致精确、信息密集但不拥挤、色彩仅用于传达信息而非装饰。

---

## 1. Visual Theme & Atmosphere

CleanCalendar 是一款桌面效率工具。它的视觉语言应当传达**精确、克制、可靠**——不是花哨的 SaaS 落地页，而是一个你每天打开、安静服务于你的工具。

**暗色模式（默认）：** 近黑的画布（`#0d0d0e`）上，信息通过亮度的精确层级浮现。日程网格是整个界面的视觉重心，任务格子是仅有的色彩载体——标签组颜色在暗色画布上自然成为视觉锚点。边框极细、半透，像月光下的线框。

**亮色模式：** 转译为暖白基底（`#fafaf9`），保持同样的克制——灰度文本层级、极细边框、任务格子用标签组颜色但降低饱和度以适应亮色背景。

**关键特征：**
- 暗色原生设计：`#0d0d0e` 基础画布，`#121213` 面板，`#1a1a1c` 浮层
- Inter Variable 字体，`cv01`/`ss03` OpenType 特性
- 标签组颜色作为用户数据的色彩载体——任务格子和侧栏色点；系统 UI 全部中性灰度
- 语义色仅用于关键交互反馈：绿色（正向操作/开关开启）、红色（危险操作）、绿→红梯度（五圆评分）
- 半透明白色边框（暗色）和半透明灰度边框（亮色）
- 日程表网格使用细线分隔，当前日期行/列有中性微亮高亮（无蓝紫调）
- 所有弹窗/弹出式组件（下拉菜单、日历选择器）统一 8px 圆角矩形，风格一致

---

## 2. Color Palette & Roles

### 2.1 Dark Mode

#### Background Surfaces
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-canvas` | `#0d0d0e` | 最深层画布——日程表主体背景 |
| `--bg-panel` | `#121213` | 侧栏、顶栏、详情面板背景 |
| `--bg-surface` | `#1a1a1c` | 卡片、弹窗、设置页浮层 |
| `--bg-surface-hover` | `#222225` | hover 状态的浮层 |
| `--bg-grid-today` | `rgba(255,255,255,0.03)` | 日程表中"今天"行/列高亮 |
| `--bg-grid-header` | `#0f0f11` | 日程表表头（时间轴/日期轴） |

#### Text & Content
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#f0f0f2` | 主文本——标题、任务名、重要标签 |
| `--text-secondary` | `#c8ccd4` | 次要文本——描述、副标题 |
| `--text-tertiary` | `#828690` | 辅助文本——时间戳、元数据、占位符 |
| `--text-disabled` | `#5a5d65` | 禁用状态、已完成任务文本 |

#### Accent & Interactive
| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#6b6e75` | 中性强调色——focus 环、选中态高亮、日历标记（非按钮） |
| `--accent-hover` | `#81848a` | 中性强调色 hover |
| `--accent-subtle` | `rgba(107, 110, 117, 0.10)` | 中性强调微妙背景 |
| `--switch-on` | `#27a644` | 开关开启态填充（绿色） |
| `--btn-ghost-bg` | `rgba(255,255,255,0.06)` (暗) / `rgba(0,0,0,0.06)` (亮) | Ghost 按钮背景 |

> **设计原则：** 系统 UI（按钮、输入框、面板）全部中性灰度，不带蓝色/紫色调。仅两类元素使用色彩：(1) 用户标签组颜色——任务格子和侧栏色点；(2) 语义色——绿色表示正向操作和开启状态，红色表示危险操作，五圆评分按 1-5 从绿过渡到红。亮色/暗色模式下 accent 保持同一灰度，不随主题变化。

#### Status
| Token | Value | Usage |
|-------|-------|-------|
| `--status-success` | `#27a644` | 完成勾选、成功状态 |
| `--status-warning` | `#e5a83e` | 警告、提示 |
| `--status-error` | `#e5484d` | 错误、冲突提示 |

#### Border
| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `rgba(255,255,255,0.04)` | 最细分割线——网格线 |
| `--border-default` | `rgba(255,255,255,0.06)` | 默认边框——输入框、卡片 |
| `--border-strong` | `rgba(255,255,255,0.10)` | 强调边框——面板边缘、focus 环 |
| `--border-accent` | `rgba(107,110,117,0.25)` | 中性强调色边框——焦点态 |

#### Task Tag Group Colors (用户自定义)
标签组颜色为**用户自由选择的 HEX 色值**，不做限制。设计系统仅规定展示规则：
- 暗色模式：任务格子背景 = 标签组颜色 + 透明度 `0.18`，文字 = 标签组颜色（适当调亮）
- 亮色模式：任务格子背景 = 标签组颜色 + 透明度 `0.15`，文字 = 标签组颜色（适当调暗）

### 2.2 Light Mode

| Token | Value |
|-------|-------|
| `--bg-canvas` | `#fafaf9` |
| `--bg-panel` | `#f5f4f3` |
| `--bg-surface` | `#ffffff` |
| `--bg-surface-hover` | `#f0efee` |
| `--bg-grid-today` | `rgba(0,0,0,0.03)` |
| `--bg-grid-header` | `#f3f2f0` |
| `--text-primary` | `#1a1a1c` |
| `--text-secondary` | `#585a60` |
| `--text-tertiary` | `#8e9098` |
| `--text-disabled` | `#b8bac2` |
| `--border-subtle` | `rgba(0,0,0,0.05)` |
| `--border-default` | `rgba(0,0,0,0.08)` |
| `--border-strong` | `rgba(0,0,0,0.12)` |
| `--border-accent` | `rgba(107,110,117,0.20)` |
| `--accent-hover` | `#55585e` |
| `--accent-subtle` | `rgba(107, 110, 117, 0.08)` |
| `--bg-task-completed` | `rgba(0, 0, 0, 0.04)` |
| `--btn-ghost-bg` | `rgba(0,0,0,0.06)` |

> `--accent`、`--switch-on`、`--status-success`、`--status-warning` 在亮色模式下保持不变，与暗色模式一致。

---

## 3. Typography Rules

### Font Family
- **Primary:** `Inter Variable`, fallback: `system-ui, -apple-system, Segoe UI, sans-serif`
- **Monospace:** `JetBrains Mono`, fallback: `ui-monospace, SF Mono, Menlo, Consolas`
- **OpenType Features:** `"cv01", "ss03"` 全局启用

### Hierarchy

| Role | Size/Weight | Line Height | Letter Spacing | Usage |
|------|------------|-------------|----------------|-------|
| Heading 1 | 22px / 590 | 1.3 | -0.32px | 设置页标题 |
| Heading 2 | 18px / 590 | 1.3 | -0.22px | 面板区块标题 |
| Heading 3 | 15px / 590 | 1.4 | -0.16px | 标签组名称、详情面板子标题 |
| Body Large | 14px / 510 | 1.5 | normal | 导航链接、按钮文字 |
| Body | 13px / 400 | 1.5 | normal | 任务名称、正文 |
| Body Em | 13px / 510 | 1.5 | normal | 强调的任务名、选中项 |
| Caption | 12px / 400 | 1.4 | normal | 时间段序号 "(2/3)"、元数据 |
| Caption Em | 12px / 510 | 1.4 | normal | 标签、状态 |
| Label | 11px / 510 | 1.3 | normal | 表头（时间轴/日期轴） |
| Micro | 10px / 400 | 1.4 | normal | 时间戳、辅助信息 |

### Principles
- **510 是默认强调权重** — 介于 regular 和 medium 之间，微妙但清晰
- **日程表文本偏小** — 13px body / 12px caption，在密集网格中保持可读
- **头尾层级差小** — 工具类应用不需要夸张的排版对比，22px 标题 + 13px 正文足够
- **数字使用 tabular-nums** — 时间、日期等数字列对齐

---

## 4. Component Stylings

### 4.1 Schedule Grid (日程表网格)

```
- 背景: --bg-canvas
- 表格线: --border-subtle, 1px
- 表头行: --bg-grid-header 背景, 高度 32px
- "今天"行/列: --bg-grid-today 背景高亮
- 时间粒度: 按 timeGranularity 设置绘制水平线（15/30/60min）
- 小时标记线: --border-default 略粗
```

### 4.2 Task Block (任务格子)

```
暗色模式:
- 背景: 标签组颜色 + 透明度 0.18
- 文字: 标签组颜色, 调亮 15%
- 圆角: 6px
- 边框: 标签组颜色 + 透明度 0.10, 1px
- 勾选框: 右上角 14px 圆形, --border-default 描边

亮色模式:
- 背景: 标签组颜色 + 透明度 0.15
- 文字: 标签组颜色, 调暗 10%
- 边框: 标签组颜色 + 透明度 0.20, 1px

已完成状态:
- 背景变灰: rgba(128,128,128,0.08) (暗) / rgba(0,0,0,0.04) (亮)
- 文字: --text-disabled
- 勾选框: --status-success 填充 + 白色勾

拖动态:
- 阴影: rgba(0,0,0,0.3) 0px 4px 16px
- scale: 1.02
- 过渡: 150ms ease-out
```

### 4.3 Buttons

按钮不使用灰色，按用途分配语义色：

| Variant | Background | Text | Border | Radius | Padding | Usage |
|---------|-----------|------|--------|--------|---------|-------|
| Success | `rgba(39,166,68,0.12)` | `#27a644` | `rgba(39,166,68,0.20)` | 6px | 6px 14px | 主操作——"重新安排"、保存、确认 |
| Danger | `rgba(229,72,77,0.12)` | `#e5484d` | `rgba(229,72,77,0.20)` | 6px | 6px 14px | 危险操作——"删除"、取消 |
| Ghost | `--btn-ghost-bg` | `--text-secondary` | `--border-default` | 6px | 6px 12px | 导航/次要操作——"今天"按钮 |
| Subtle | transparent | `--text-tertiary` | none | 4px | 4px 8px | 内联操作——"+"添加按钮 |
| Icon | transparent | `--text-tertiary` | none | 50% | 6px | 工具图标——侧栏开关、主题切换 |

- `--btn-ghost-bg`：暗色 `rgba(255,255,255,0.06)` / 亮色 `rgba(0,0,0,0.06)` — 直接使用 `--text-primary` 和 `--bg-panel` 的中间色自适应亮暗
- Ghost/Icon/Subtle 的背景和文字色随亮暗模式自动反转（暗底+白字 / 亮底+黑字），不使用灰色调
- 按钮 hover: 成功/危险按亮度 ± 15% 变化
- 按钮 active: scale(0.97), 100ms
- `border-radius: 8px` on dropdown/date-picker popups (视觉一致)

### 4.4 Sidebar (左侧栏)

```
- 背景: --bg-panel
- 宽度: 240px
- 右侧分割线: --border-default 1px
- 标签组列表项:
  - 圆角: 6px
  - 左侧色点: 10px 圆形, 标签组颜色
  - padding: 6px 10px
  - hover: --bg-surface-hover
  - 选中: --accent-subtle 背景（中性灰度，非彩色）
- "未安排"/"已完成"分区:
  - 分区标题: Heading 3, --text-tertiary
  - 下方任务列表缩进排列
```

### 4.5 Detail Panel (右侧详情面板)

```
- 背景: --bg-panel
- 宽度: 280px
- 左侧分割线: --border-default 1px
- 属性区块: 每组 padding-bottom 16px
- 输入框:
  - 背景: --bg-surface
  - 边框: --border-default, 1px
  - 圆角: 8px (--radius-lg)
  - padding: 6px 10px
  - 文字: --text-primary, 13px
  - focus: --border-accent 边框 + 3px --accent-subtle 光晕
```

**标签组选择器 (Custom Select):**
```
- 触发器: 与输入框同风格，显示选中项的标签组色点（8px 圆形）+ 文字，右侧 ▾ 三角箭头，展开时旋转 180°
- 弹出菜单:
  - 圆角: 8px (--radius-lg)
  - 背景: --bg-surface, 边框: --border-strong
  - 阴影: rgba(0,0,0,0.35) (暗) / rgba(0,0,0,0.12) (亮)
  - 每项: 左侧 8px 标签组色点 + 文字, padding 7px 10px, hover: --bg-surface-hover
  - 选中项: 加粗
- 点击外部自动关闭
```

**日期时间选择器 (Custom Date Picker):**
```
- 触发器: 与输入框同风格
- 弹出面板:
  - 圆角: 8px (--radius-lg)
  - 背景: --bg-surface, 边框: --border-strong
  - 宽度: 236px
  - 月导航: ◂ ▸ 按钮 (Ghost style), 中间显示年份+月份
  - 日期网格: 7列布局, 每格 28×28px, 当前月黑色/白色, 非当前月灰色
  - 选中日期: --text-primary 背景 + --bg-surface 文字（亮暗自适应）
  - 今日: --text-primary 加粗文字
  - 底部时间输入: 时分两个小输入框, 冒号分隔
- 点击外部自动关闭
```

**五圆评分 (重要/紧急程度):**
```
- 5个圆形按钮, 20px 直径, 间距 6px
- 未填充: 透明背景 + --border-strong 描边 (1.5px)
- 填充后: 所有实心圆使用同一颜色（按评分值）
- 颜色梯度: 1=柔和绿(#5ea86a) → 2=黄绿(#9db040) → 3=黄(#e5a83e) → 4=橙(#f57c00) → 5=红(#e5484d)
- hover: 亮度 0.85
- 圆形完全匹配圆角矩形风格体系
```

**开关 (Toggle):**
```
- 外框: 30×18px pill (--radius-full), 默认 --border-default 背景
- 开启: --switch-on (#27a644) 绿色背景
- 滑块: 14px 白色圆形 (#ffffff), 始终白色（不随亮暗模式变化）
- 滑块位移: translateX(12px)
- 过渡: 150ms
- 用途: "可碎片化处理"、"可影响其他任务"
```

### 4.6 Top Bar (顶栏)

```
- 高度: 44px
- 背景: --bg-panel
- 底部分割线: --border-subtle 1px
- 左侧: ☰ 侧栏开关 + 应用名称 (Heading 3)
- 中央: "📅 今天" 按钮 (Ghost variant)
- 右侧: ⚙️ 设置按钮 (Icon variant)
```

### 4.7 Toast / Notification

```
- 背景: --bg-surface
- 边框: --border-default
- 圆角: 8px
- 阴影: 0px 4px 24px rgba(0,0,0,0.4)
- 内边距: 10px 16px
- 图标 + 文字 13px Body Em
- 动画: 从右侧滑入, 300ms ease-out
```

---

## 5. Layout Principles

### Spacing Scale
Base unit: 4px
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48

| Context | Spacing |
|---------|---------|
| 面板内边距 | 16px |
| 组件内间距 | 8px |
| 区块间距 | 16px |
| 分区间距 | 24px |
| 页面边距 | 0 (桌面应用全屏使用) |
| 日程表格子边距 | 2px |
| 任务格子最小高度 | timeGranularity × 像素换算 |

### Grid Structure
```
┌─ Top Bar: 44px h ──────────────────────────────────────┐
│ ┌─ Sidebar ─┐ ┌─ Schedule Grid ──────┐ ┌─ Detail ───┐ │
│ │   240px    │ │     flex: 1          │ │   280px    │ │
│ │            │ │                      │ │            │ │
│ │            │ │                      │ │            │ │
│ └────────────┘ └──────────────────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────┘
```

- 侧栏和详情面板可折叠，折叠时日程表区域自动扩展
- 日程表表头高度: 40px（日期行）
- 时间轴宽度: 50px（左侧时间标注列）
- 每个时间格高度: timeGranularity 决定（15min ≈ 20px）

### Border Radius Scale
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | 标签、微小元素 |
| `--radius-md` | 6px | 按钮、任务格子 |
| `--radius-lg` | 8px | 输入框、卡片、弹窗菜单、日历选择器 |
| `--radius-xl` | 12px | 大型浮层、设置页卡片 |
| `--radius-full` | 9999px | 勾选框、色点、pill |

---

## 6. Depth & Elevation

由于暗色背景下传统阴影不可见，采用**亮度步进** + **半透边框**表达深度：

| Level | Treatment (Dark) | Usage |
|-------|-----------------|-------|
| Canvas | `--bg-canvas` | 日程表背景 |
| Panel | `--bg-panel` + `--border-default` | 侧栏、顶栏、详情面板 |
| Surface | `--bg-surface` + `--border-default` | 弹窗、下拉菜单 |
| Overlay | `rgba(0,0,0,0.6)` | 模态框遮罩 |

Elevation 不通过阴影叠加，而是**每升一级，背景 white 不透明度 + 0.02~0.04**。这一原则在亮色模式中反转——每升一级，背景变亮。

---

## 7. Do's and Don'ts

### Do
- ✅ 使用半透明白色/灰色边框，不要用实色边框在暗色背景上
- ✅ 标签组颜色仅用于任务格子和左侧色点；系统 UI 全部灰度（按钮非灰，见 4.3）
- ✅ 任务格子使用标签组颜色的半透明版本做背景
- ✅ 数字列使用 `font-variant-numeric: tabular-nums` 对齐
- ✅ grids 的行高对齐到 timeGranularity
- ✅ 所有可交互元素 hover 时有视觉反馈（背景微亮或微暗）
- ✅ 已完成任务保留占位但不抢视线（灰+透明）

### Don't
- ❌ 不要在非任务元素上使用不必要的彩色——系统 UI 保持中性灰度 + 语义绿/红
- ❌ 不要使用纯白 `#ffffff` 做主文本——`#f0f0f2` 更护眼
- ❌ 不要在暗色背景上用实色黑边框——完全看不见
- ❌ 不要使用装饰性渐变、投影、发光效果
- ❌ 不要使用 emoji 以外的图标 Logo（侧栏开关和设置按钮除外）
- ❌ 不要使用 serif 字体
- ❌ 不要对已完成任务使用相同的色彩强度

---

## 8. Responsive Behavior

CleanCalendar 是桌面应用，窗口最小宽度 900px。不设计移动端布局。

窗口缩放行为：
- 最小宽度 900px 时，详情面板自动折叠
- 最小宽度 680px 时，侧栏自动折叠
- 任务格子文字在格子宽度 < 80px 时仅显示 emoji
- 时间粒度较低时（60min），格子的最小高度增大以留出文字空间

---

## 9. Agent Prompt Guide

### Quick Reference
- Canvas: `#0d0d0e` (dark) / `#fafaf9` (light)
- Panel: `#121213` (dark) / `#f5f4f3` (light)
- Primary text: `#f0f0f2` (dark) / `#1a1a1c` (light)
- Secondary text: `#c8ccd4` (dark) / `#585a60` (light)
- Accent (neutral): `#6b6e75`
- Success (green): `#27a644`
- Danger (red): `#e5484d`
- Border: `rgba(255,255,255,0.06)` (dark) / `rgba(0,0,0,0.08)` (light)
- Task block: tag color + 0.18 opacity bg
- Grid header: `#0f0f11` (dark) / `#f3f2f0` (light)
- Today highlight: `rgba(255,255,255,0.03)` (dark) / `rgba(0,0,0,0.03)` (light)
- Font: Inter Variable, `"cv01" "ss03"`, weight 510 emphasis

### Component Snapshot
```
Task Block = tagColor @ 0.18 opacity bg + tagColor text + 6px radius + 13px Inter 400
  └── ×1.15 brightness on text for dark mode
Success Button = rgba(39,166,68,0.12) bg + #27a644 text + rgba(39,166,68,0.20) border + 6px radius + 6px 14px padding
Danger Button = rgba(229,72,77,0.12) bg + #e5484d text + rgba(229,72,77,0.20) border + 6px radius + 6px 14px padding
Ghost Button = --btn-ghost-bg (adaptive) + --text-secondary + --border-default
Sidebar Item = 10px color dot + 13px Inter 510 text + 6px radius + hover: --bg-surface-hover
Dot Rating = 5 × 20px circles + green→red color scale + all filled share same color
Switch = 30×18px pill + green on + white (#fff) knob always
Custom Select Popup = 8px radius + --bg-surface + --border-strong + shadow
Grid Line = rgba(255,255,255,0.04) 1px (hour) / rgba(255,255,255,0.02) (sub-hour)
```
