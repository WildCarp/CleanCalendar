# CleanCalendar — 项目开发规格书（Web 版）

> **目标：** 轻量级本地日程安排 Web 应用，部署于 GitHub Pages，支持多端（桌面/平板/手机）使用。
> **核心亮点：** 基于紧急程度 × 重要程度的智能权重排程算法。
> **设计系统：** 沿用 `DESIGN.md`，新增响应式适配规则。

---

## 1. 技术栈

| 层级 | 选型 | 理由 |
|------|------|------|
| 框架 | **React 18** + TypeScript | 生态成熟，社区庞大，适合复杂交互（拖拽、网格渲染） |
| 构建 | **Vite 5** | 极速 HMR，开箱即用 TypeScript + CSS Modules，产物优化好 |
| 样式 | **Tailwind CSS 3** | 快速开发，暗色/亮色主题切换简便，DESIGN.md 设计 token 直接映射 |
| 数据存储 | **IndexedDB**（通过 **Dexie.js**） | 浏览器端结构化存储，支持索引/事务/批量操作，无大小限制 |
| 状态管理 | **Zustand** | 极轻量（~1KB），订阅精确，无 boilerplate，适合中等复杂度 |
| 拖拽 | **@dnd-kit** | 现代拖拽库，支持网格吸附、冲突检测、自定义碰撞算法 |
| 排程算法 | **TypeScript**（`scheduler.ts`） | 纯前端运行，无后端依赖；算法逻辑与原 Rust 版完全一致 |
| 节假日数据 | 联网 API 获取 + IndexedDB 缓存 | 数据始终最新，离线时有本地缓存 fallback |
| 部署 | **GitHub Pages** + GitHub Actions | `gh-pages` 分支自动部署，零运维成本 |

### 为什么选择这个组合

- **React + Vite + Tailwind** 是当前 Web 开发最成熟的技术栈，你作为 TA（技术美术）日常接触工程化工具，上手成本最低。
- **IndexedDB** 替代 SQLite：浏览器原生支持，不需要任何数据库引擎，数据持久化在用户浏览器中。
- **纯前端无后端**：GitHub Pages 只能托管静态资源，所有逻辑在浏览器中完成。数据存储在用户本地浏览器里，天然隔离。
- **@dnd-kit** 在 React 拖拽生态中是目前最好的选择——支持自定义碰撞检测，可以实现按 `timeGranularity` 步进的网格吸附和重叠冲突检测。

---

## 2. 数据模型

> 数据模型与原始规格一致，仅存储层由 SQLite 改为 IndexedDB。

### 2.1 标签组（TagGroup）

```typescript
interface TagGroup {
  id: string;              // UUID (crypto.randomUUID())
  name: string;            // 标签组名称
  color: string;           // HEX 颜色值，如 "#FF6B6B"
  emoji: string;           // 显示在任务名前的 emoji
  isWork: boolean;         // 是否为工作标签组（仅安排在工作日工作时间）
  isDefault: boolean;      // 是否为默认标签组（不可删除）
  createdAt: number;       // 时间戳
  sortOrder: number;       // 排序权重（支持拖动排序）
}
```

### 2.2 任务（Task）

```typescript
interface Task {
  id: string;              // UUID
  tagGroupId: string;      // 所属标签组 ID
  name: string;            // 任务名称
  startTime: string;       // ISO 8601 "YYYY-MM-DDTHH:mm"
  endTime: string;         // ISO 8601 "YYYY-MM-DDTHH:mm"
  importance: number;      // 1-5
  urgency: number;         // 1-5
  duration: number;        // 分钟
  canFragment: boolean;    // 可否碎片化
  canAffectOthers: boolean;// 可否影响其他任务
  status: TaskStatus;      // 'unscheduled' | 'scheduled' | 'completed'
  segments: TaskSegment[]; // 已安排的时间段
  createdAt: number;
}

type TaskStatus = 'unscheduled' | 'scheduled' | 'completed';

interface TaskSegment {
  id: string;
  taskId: string;
  startTime: string;       // ISO 8601
  endTime: string;         // ISO 8601
  index: number;           // 段序号（从 1 开始）
  totalSegments: number;
  isCompleted: boolean;
  isManuallyPlaced: boolean;
}
```

### 2.3 设置（Settings）

```typescript
interface Settings {
  // 任务相关
  workStartTime: string;       // "10:30"
  workEndTime: string;         // "20:30"
  lunchStart: string;          // "12:00"
  lunchEnd: string;            // "14:00"
  dinnerStart: string;         // "18:00"
  dinnerEnd: string;           // "19:00"
  restStart: string;           // "23:00"
  restEnd: string;             // "08:00"
  urgencyImportanceRatio: number; // 0-1，默认 0.5

  // 视觉相关
  dayStartHour: number;        // 0
  axisSwapped: boolean;        // false（横轴时间/竖轴日期）
  darkMode: boolean;           // false（默认亮色。DESIGN.md 虽为暗色优先设计，但 Web 端亮色更符合大众预期，暗色模式通过设置按钮手动切换）
  taskOpacity: number;         // 0.8
  timeGranularity: number;     // 15（10/15/20/30/60）
  displayDays: number;         // 7（1/3/7/14/28）
}
```

### 2.4 节假日数据

**数据来源：** 与原版相同，联网 API + IndexedDB 本地缓存。

| 优先级 | API | 说明 |
|--------|-----|------|
| 首选 | `https://holiday.ailcc.com/api/holiday/year/{year}` | 免费、无需注册 |
| 备选 | `https://publicapi.xiaoai.me/holiday/year?date={year}` | 开源项目 |

**缓存策略（IndexedDB 实现）：**
- 应用启动时检查 IndexedDB 中 `holidays` 表
- 当年数据缺失或缓存超过 30 天 → 尝试联网更新
- 联网失败 → 使用本地缓存继续工作
- 本地完全无数据且联网失败 → 按标准周一至周五为工作日

**注意：** Web 端的跨域限制——节假日 API 需要服务端返回 CORS 头。若 API 不开放 CORS，需要在 Vite 开发环境配置代理（`vite.config.ts` 的 `server.proxy`），生产环境则通过 GitHub Actions 定时拉取数据预置到静态 JSON 文件中，或使用 CORS 代理服务。

### 2.5 IndexedDB 数据库设计

使用 Dexie.js 定义数据库：

```typescript
// db.ts
import Dexie, { type Table } from 'dexie';

class CleanCalendarDB extends Dexie {
  tagGroups!: Table<TagGroup, string>;
  tasks!: Table<Task, string>;
  segments!: Table<TaskSegment, string>;
  settings!: Table<{ key: string; value: any }, string>;  // key-value
  holidays!: Table<HolidayCache, number>;                   // primary key = year

  constructor() {
    super('CleanCalendar');
    this.version(1).stores({
      tagGroups: 'id, sortOrder, isDefault',
      tasks: 'id, tagGroupId, status, startTime, endTime',
      segments: 'id, taskId, startTime, endTime',
      settings: 'key',
      holidays: 'year',
    });
  }
}

export const db = new CleanCalendarDB();
```

---

## 3. 核心算法 —— 智能排程

> 算法逻辑与原版完全一致，实现语言由 Rust 改为 TypeScript，所有排程决策在浏览器主线程中完成。

### 3.1 优先级评分公式

```
Score(task) = W_urgency × UrgencyFactor(task) + W_importance × ImportanceFactor(task)
```

其中：
- `W_urgency = 1 - urgencyImportanceRatio`
- `W_importance = urgencyImportanceRatio`
- `UrgencyFactor = urgency × TimeDecayMultiplier`
- `ImportanceFactor = importance`

#### 时间衰减乘数

```
effectiveNow = max(now, task.startTime)
remainingHours = (task.endTime - effectiveNow) 的小时数
totalHours = (task.endTime - task.startTime) 的小时数

if totalHours == 0:
    progress = 1.0
else:
    progress = clamp(1 - remainingHours / totalHours, 0, 1)

TimeDecayMultiplier = 1 + 2 × progress²
```

效果：离截止日期越近，紧急因子最高放大 3 倍。

#### 最终归一化评分

```
NormalizedScore = Score(task) / MaxPossibleScore × 100
MaxPossibleScore = max(W_urgency, W_importance) × 5 × 3
```

### 3.2 时间可用性规则（不变）

| 标签组类型 | 不可用时间 |
|-----------|-----------|
| 工作标签组 | 非工作日全天 + 工作日的非工作时间（上班前、下班后、午休、晚饭） |
| 非工作标签组 | 每天的休息时间（默认 23:00-08:00） |

### 3.3 碎片化定义（不变）

仅任务段之间被**其他任务**隔开才计入碎片化拆分。午休/晚饭/休息/跨天分割不计入。

不可碎片化任务（`canFragment=false`）最多允许 2 次真正的拆分（3 个段）。

### 3.4 ~ 3.7 排程流程

算法伪代码、批量重排逻辑、时间窗口内任务定义、重排规则约束——**完全沿用原规格书 §10 中的实现**，在 `src/utils/scheduler.ts` 中以 TypeScript 实现。

**Web Worker 优化（可选）：** 若排程计算量较大（任务数量 > 100 且窗口跨度 > 30 天），可将 `scheduler.ts` 放入 Web Worker 避免阻塞 UI。初期直接在 main thread 运行，性能瓶颈出现时再迁移。

### 3.8 评分计算示例（不变）

略，与原规格一致。

---

## 4. 界面布局

### 4.1 整体结构（与 DESIGN.md §5 一致）

```
┌─ Top Bar: 44px ────────────────────────────────────────┐
│ [☰] CleanCalendar    [📅 今天]              [⚙️] [🌙] │
├──────────┬──────────────────────────┬──────────────────┤
│ Sidebar  │   Schedule Grid          │  Detail Panel    │
│  240px   │   flex: 1                │  280px           │
│          │  横轴=时间 / 竖轴=日期    │  点击任务弹出     │
│ ┌──────┐ │  ┌──────────────────┐   │                  │
│ │标签组 │ │  │ 任务格子 (圆角)  │   │  详情 + 编辑     │
│ │·默认  │ │  │ emoji+名称      │   │  [安排][重排]   │
│ │·工作  │ │  └──────────────────┘   │  [删除]          │
│ ├──────┤ │                          │                  │
│ │未安排 │ │  "今天"行/列高亮         │                  │
│ │·任务  │ │                          │                  │
│ ├──────┤ │                          │                  │
│ │已完成 │ │                          │                  │
│ │·任务  │ │                          │                  │
│ └──────┘ │                          │                  │
└──────────┴──────────────────────────┴──────────────────┘
```

### 4.2 日程表导航（不变）

略，与原版相同。

### 4.3 左侧栏（不变）

略，与原版相同。

### 4.4 任务格子（不变）

略，与原版相同。拖拽使用 `@dnd-kit` 实现，通过自定义 `collisionDetection` 实现网格吸附和重叠冲突检测。

### 4.5 右侧任务详情面板（不变）

略，与原版相同。

### 4.6 设置页面（不变）

略，与原版相同。所有设置存储在 IndexedDB `settings` 表中。

---

## 5. 新增：响应式布局规则

> 原 DESIGN.md §8 仅覆盖桌面窗口缩放。Web 版需要完整的移动端适配。

### 5.1 断点定义

| 断点 | 屏幕宽度 | 设备类型 | 布局行为 |
|------|---------|---------|---------|
| Desktop | ≥ 1024px | 桌面/大平板 | 完整三栏：侧栏 240px + 日程表 + 详情面板 280px |
| Tablet | 768~1023px | 小平板 | 仅日程表 + 可展开详情面板（底部 sheet）。侧栏变为抽屉式 |
| Mobile | < 768px | 手机 | 日程表单栏。侧栏和详情面板均为全屏覆盖层 |

### 5.2 各断点详细行为

#### Desktop（≥ 1024px）
- 完整三栏布局
- 日程表支持滚动翻页 + 日期选择器跳转
- 拖拽操作完整性保留

#### Tablet（768~1023px）
- 侧栏默认隐藏，通过顶栏 ☰ 按钮打开抽屉式侧栏（左侧滑入，宽度 260px，带遮罩）
- 详情面板改为底部 Sheet（从底部滑入，最大高度 60vh，可拖动把手调整高度）
- 日程表显示天数自动缩减（`displayDays` 设置若有 14/28 天则自动降为 7 天）
- 拖拽操作：短按任务格子 200ms 后激活拖拽（避免滚动冲突）

#### Mobile（< 768px）
- 仅主日程表区域可见
- 侧栏 = 全屏覆盖层（左侧滑入，占满屏幕）
- 详情面板 = 全屏覆盖层（底部滑入，占满屏幕）
- 日程表为单列滚动（默认 `axisSwapped=true`，即横轴日期/纵轴时间——竖向滚动更自然）
- `timeGranularity` 最小 30 分钟（避免格子太矮）
- `displayDays` 最大 3 天
- 顶栏简化：仅保留 ☰ + 应用名 + ⚙️
- Top Bar 吸附在屏幕顶部（`position: sticky; top: 0`）
- 拖拽操作：用户可双指缩放日程表后再长按 400ms 激活拖拽，解决小屏幕精度问题。日程表需支持 `pinch-zoom`（CSS `touch-action: manipulation` + 手势库处理）
- 创建任务：全屏表单 + 底部固定按钮

### 5.3 响应式 CSS 实现策略

```css
/* Tailwind 断点 + 自定义值 */

/* 侧栏宽度变量 */
:root {
  --sidebar-width: 240px;
  --detail-width: 280px;
  --topbar-height: 44px;
}

/* Tablet 以下：侧栏变抽屉 */
@media (max-width: 1023px) {
  .sidebar { position: fixed; left: -100%; z-index: 50; transition: left 300ms; }
  .sidebar.open { left: 0; }
  .sidebar-overlay { display: block; } /* 点击关闭 */
  .detail-panel { position: fixed; bottom: 0; left: 0; right: 0; max-height: 60vh; border-radius: 12px 12px 0 0; z-index: 40; }
}

/* Mobile：全屏覆盖 */
@media (max-width: 767px) {
  .sidebar { width: 100%; }
  .detail-panel { max-height: 100vh; border-radius: 0; }
  .task-block { font-size: 12px; }
}
```

### 5.4 PC / 移动端坐标轴默认值

> 不同设备有不同的自然交互方式，默认值按设备自动切换，用户可在设置中手动覆盖。

| 设备 | `axisSwapped` 默认值 | 效果 | 原因 |
|------|---------------------|------|------|
| Desktop / Tablet（≥ 768px） | `false` | 横轴 = 时间 / 竖轴 = 日期 | 宽屏横向滚动浏览时间线更自然 |
| Mobile（< 768px） | `true` | 横轴 = 日期 / 竖轴 = 时间 | 竖屏纵向滚动浏览日程更自然 |

- 此默认值仅在**首次加载**或**重置设置**时应用
- 用户手动在设置中切换后，该选择持久化，不再跟随设备变化
- 实现方式：`useSettingsStore` 初始化时检测 `useResponsive()` 返回值决定默认值

---

## 6. 交互流程

> §5.1 ~ §5.7 的交互流程与原版完全一致。以下标注 Web 特有的差异点。

### 5.1 创建任务（不变）

底部两个按钮：[仅创建] / [创建并安排]。创建后自动存储到 IndexedDB。

### 5.2 安排未安排的任务（不变）

### 5.3 手动拖动任务

使用 `@dnd-kit` 实现：
- `DndContext` 包裹日程表区域
- 自定义 `collisionDetection` 算法：基于 `timeGranularity` 的网格对齐 + 已有任务占位检测
- `DragOverlay` 显示拖拽中的任务格子（视觉反馈）
- 移动端使用 `PointerSensor` + `activationConstraint: { delay: 200, tolerance: 5 }`

### 5.4 完成任务段（不变）

### 5.5 撤销完成（不变）

### 5.6 删除任务（不变）

### 5.7 重新安排（不变）

---

## 7. 通知系统

Web 端使用内联 Toast 组件（不依赖系统通知 API，保证兼容性）。

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| 安排成功 | "✅ [任务名] 已安排" | success |
| 安排失败 | "⚠️ [任务名] 当前已安排不下" | warning |
| 挤走其他任务 | "⚠️ [被挤走任务名] 由于优先级最低已被放回" | warning |
| 重排完成 | "✅ 重新安排完成，共影响 N 个任务" | success |
| 节假日数据更新 | "✅ 节假日数据已更新" / "⚠️ 使用本地缓存" | info/warning |
| 数据导出 | "✅ 数据已导出为 JSON 文件" | success |
| 数据导入 | "✅ 已导入 N 个标签组，M 个任务" | success |

---

## 8. 数据导入/导出

### 8.1 导出

用户点击设置页中的「导出数据」→ 浏览器下载一个 `CleanCalendar_backup_YYYY-MM-DD.json` 文件。包含全部标签组、任务、段的完整 JSON。

### 8.2 导入

用户点击设置页中的「导入数据」→ 弹出文件选择器 → 读取 JSON → 校验格式 → 弹出确认框显示将导入的内容摘要 → 确认后写入 IndexedDB（清空覆盖）。

```typescript
interface ExportData {
  version: number;         // 数据格式版本号
  exportedAt: string;      // ISO 8601
  tagGroups: TagGroup[];
  tasks: Task[];
  segments: TaskSegment[];
  settings: Record<string, any>;
}
```

---

## 9. 项目目录结构

```
CleanCalendar/
├── public/
│   ├── favicon.svg
│   └── holidays/                  # 预置节假日 JSON fallback（GitHub Actions 自动更新）
│       └── 2026.json
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.tsx         # 顶栏
│   │   │   ├── Sidebar.tsx        # 左侧栏（标签组/未安排/已完成）
│   │   │   └── DetailPanel.tsx    # 右侧详情面板
│   │   ├── calendar/
│   │   │   ├── ScheduleGrid.tsx   # 日程表主网格
│   │   │   ├── TaskBlock.tsx      # 任务格子（含拖拽 handle）
│   │   │   ├── GridHeader.tsx     # 日程表表头（日期/时间轴）
│   │   │   └── TimeAxis.tsx       # 时间轴标注
│   │   ├── task/
│   │   │   ├── CreateTaskForm.tsx # 创建任务表单
│   │   │   ├── TaskForm.tsx       # 任务属性编辑表单（详情面板内）
│   │   │   └── DotRating.tsx      # 五圆评分组件
│   │   ├── settings/
│   │   │   ├── SettingsModal.tsx  # 设置弹窗
│   │   │   └── SettingsSection.tsx# 设置分组
│   │   └── ui/
│   │       ├── Button.tsx         # 按钮（Success/Danger/Ghost/Subtle/Icon）
│   │       ├── Toggle.tsx         # 开关组件
│   │       ├── Select.tsx         # 自定义下拉选择器
│   │       ├── DatePicker.tsx     # 自定义日期时间选择器
│   │       ├── Toast.tsx          # Toast 通知 + ToastContainer
│   │       ├── Modal.tsx          # 模态弹窗
│   │       └── Sheet.tsx          # 底部弹出层（Tablet/Mobile）
│   ├── stores/
│   │   ├── useTaskStore.ts        # 任务 + 段 → IndexedDB CRUD
│   │   ├── useTagGroupStore.ts    # 标签组状态
│   │   ├── useSettingsStore.ts    # 设置状态（含主题切换）
│   │   ├── useCalendarStore.ts    # 日程表视图状态（当前日期范围、滚动位置）
│   │   └── useUIStore.ts          # UI 状态（侧栏/详情面板/弹窗开关）
│   ├── utils/
│   │   ├── scheduler.ts           # 核心排程算法（原 Rust scheduler.rs）
│   │   ├── scoring.ts             # 优先级评分（前端排序用）
│   │   ├── time.ts                # 时间处理工具（dayjs 封装）
│   │   ├── holidays.ts            # 节假日 API + IndexedDB 缓存
│   │   ├── db.ts                  # Dexie.js 数据库定义 + 初始化
│   │   ├── export.ts              # 数据导入/导出
│   │   └── id.ts                  # UUID 生成
│   ├── hooks/
│   │   ├── useTheme.ts            # 主题切换 hook（暗色/亮色 + 跟随系统）
│   │   ├── useDrag.ts             # 拖拽封装（@dnd-kit 配置）
│   │   ├── useResponsive.ts       # 响应式断点检测
│   │   └── useHolidays.ts         # 节假日数据 hook
│   ├── styles/
│   │   ├── index.css              # Tailwind 指令 + CSS 变量（= DESIGN.md tokens）
│   │   └── calendar.css           # 日程表网格专用样式
│   ├── types/
│   │   └── index.ts               # 所有 TypeScript 接口定义
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js             # DESIGN.md 色板映射
├── tsconfig.json
├── .github/
│   └── workflows/
│       ├── deploy.yml             # GitHub Pages 自动部署
│       └── update-holidays.yml    # 每月自动更新节假日数据
└── README.md
```

---

## 10. 构建与部署

### 10.1 开发环境

```bash
pnpm install
pnpm dev          # Vite dev server → http://localhost:5173
```

Vite 开发服务器配置代理解决节假日 API 跨域：

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api/holiday': {
        target: 'https://holiday.ailcc.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/holiday/, '/api/holiday'),
      },
    },
  },
});
```

### 10.2 生产构建

```bash
pnpm build        # → dist/
pnpm preview      # 本地预览构建产物
```

### 10.3 GitHub Pages 部署

> **⚠️ 开发前确认：** 仓库名称未定，需询问用户。Vite 的 `base` 配置取决于仓库名（如仓库名为 `CleanCalendar`，则 `base: '/CleanCalendar/'`；若为用户主页仓库 `<username>.github.io`，则 `base: '/'`）。

GitHub Actions 工作流 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

部署后访问：`https://<your-username>.github.io/CleanCalendar/`

### 10.4 节假日数据自动更新

GitHub Actions 每月 1 日自动拉取最新节假日数据并提交到仓库：

```yaml
name: Update Holiday Data

on:
  schedule:
    - cron: '0 0 1 * *'   # 每月1日
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          CURRENT_YEAR=$(date +%Y)
          curl -s "https://holiday.ailcc.com/api/holiday/year/$CURRENT_YEAR" \
            -o "public/holidays/$CURRENT_YEAR.json"
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update holiday data"
```

### 10.5 跨域问题处理

节假日 API 可能不返回 CORS 头。Web 端策略：

| 环境 | 方案 |
|------|------|
| 开发 | Vite proxy 代理（同上） |
| 生产 | GitHub Actions 定时拉取 API 数据预置到 `public/holidays/` 目录，运行时优先读本地；同时应用内仍尝试直接调 API（若浏览器允许则更新缓存） |

---

## 11. 开发优先级

| 阶段 | 内容 | 说明 |
|------|------|------|
| P0 | 项目初始化：Vite + React + Tailwind + Dexie.js + Zustand + @dnd-kit | 基础设施就绪 |
| P0 | 数据模型：IndexedDB 建表 + CRUD 封装 + Zustand stores | 数据层可工作 |
| P0 | 核心排程算法：`scheduler.ts`（TypeScript 移植 Rust 逻辑） | 项目灵魂 |
| P0 | 节假日 API 集成 + IndexedDB 缓存 + fallback | 工作标签组依赖 |
| P1 | 日程表 UI：网格渲染 + 任务格子 + 表头 + 时间轴 | 可视化 |
| P1 | 左侧栏：标签组/未安排/已完成 + 创建/编辑/删除 | 交互完整 |
| P1 | 详情面板：任务属性编辑 + 安排/重新安排按钮 | 功能闭环 |
| P1 | 创建任务表单 + 创建并安排 | 输入闭环 |
| P2 | 拖拽排程：@dnd-kit 集成 + 网格吸附 + 冲突检测 | 体验提升 |
| P2 | 设置页面全部选项 | 可定制 |
| P2 | 响应式布局：Tablet + Mobile 适配 | 多端可用 |
| P3 | 暗色/亮色主题切换 | 视觉完善 |
| P3 | 数据导入/导出（JSON） | 数据安全 |
| P3 | 节假日数据 GitHub Actions 自动更新 | 运维自动化 |
| P3 | GitHub Pages 部署 | 上线可访问 |

---

## 12. 边界情况与约束

> 以下 1~16 与原版一致，新增 17~20 为 Web 端特有。

1. **跨年任务：** 任务时间可跨年，`startTime` 和 `endTime` 包含年份
2. **工作标签组全是假日：** 窗口内无工作日，安排失败
3. **时长超出窗口：** `duration > 可用总时间`，安排失败
4. **零时长任务：** 不允许，最小 1 个 timeGranularity 单位
5. **并发安排：** 单线程执行，不存在并发冲突
6. **数据存储位置：** IndexedDB（浏览器内），每个域名独立
7. **时间粒度变更：** 已有安排不自动对齐，仅影响后续操作
8. **已完成任务占位：** 不释放时间段
9. **撤销完成无冲突：** 已完成任务占位不变
10. **手动拖放禁止重叠：** 已占用位置不可放置
11. **标签组删除不丢任务：** 任务移入默认标签组
12. **默认标签组不可删除：** 始终存在
13. **过去时间可安排：** 支持补录
14. **已完成段可拖动：** 但不参与智能重排
15. **已完成段不参与重排：** 视为固定占位
16. **canAffectOthers 单向性：** 不保护任务免于被他人重排
17. **浏览器清除数据：** 用户清除浏览器数据会丢失所有日程数据。建议定期导出 JSON 备份
18. **多标签页同步：** 同一浏览器打开多个标签页时，使用 `BroadcastChannel` API 同步 Zustand store 变更
19. **隐私模式：** 隐私浏览模式下 IndexedDB 可能受限或被清除。应用启动时检测并提示用户
20. **GitHub Pages 限制：** 纯静态托管，无法运行服务端代码。所有功能必须在浏览器中完成

---

## 13. 与原版（Tauri 桌面版）的关键差异总结

| 维度 | Tauri 桌面版 | Web 版 |
|------|------------|--------|
| 排程算法 | Rust（原生性能） | TypeScript（浏览器主线程） |
| 数据存储 | SQLite（文件系统） | IndexedDB（浏览器） |
| 节假日缓存 | `%APPDATA%/CleanCalendar/holidays/` | IndexedDB + `public/holidays/` 预置 |
| 安装方式 | .exe / .msi 安装包 | 浏览器访问 URL |
| 系统通知 | 原生通知 | 内联 Toast |
| 文件系统 | 直接读写 | 下载/上传 JSON |
| 多端支持 | Windows only | 所有有浏览器的设备 |
| 后台更新 | 手动下载新版本 | 刷新页面即更新 |
| 网络依赖 | 仅节假日更新需要 | 首次加载需要，之后可离线（PWA 可选） |
| 数据持久性 | 永久（除非手动卸载） | 取决于浏览器（清除数据 = 丢失） |

### Web 版的优势

- **零安装**：一个 URL 即可使用，不需要管理员权限
- **多端同步潜力**：未来可通过 GitHub Gist / Cloudflare KV 等服务实现跨设备数据同步
- **自动更新**：刷新即最新，无需下载安装包
- **开发迭代快**：纯前端，不需要 Rust 编译环境

### Web 版的局限性

- **数据安全**：浏览器清除数据 = 全部丢失，需用户主动备份
- **性能**：超大量任务（1000+）的排程计算可能阻塞 UI（可通过 Web Worker 解决）
- **网络依赖**：首次访问需加载 ~200KB 的 JS bundle（gzip 后约 60KB）
- **API 跨域**：节假日 API 需要额外处理

---

## 14. 云同步架构（预留）

> **当前版本不实现云同步。** 本节描述架构设计和未来接入方案，确保代码层面不产生技术债。

### 14.1 设计原则：StorageAdapter 抽象层

所有数据读写通过统一的 `StorageAdapter` 接口，业务代码不直接依赖 IndexedDB：

```typescript
// types/storage.ts
interface StorageAdapter {
  // 标签组
  getTagGroups(): Promise<TagGroup[]>;
  saveTagGroup(group: TagGroup): Promise<void>;
  deleteTagGroup(id: string): Promise<void>;

  // 任务
  getTasks(): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;

  // 段
  getSegments(taskId: string): Promise<TaskSegment[]>;
  saveSegment(seg: TaskSegment): Promise<void>;
  deleteSegment(id: string): Promise<void>;

  // 设置
  getSettings(): Promise<Record<string, any>>;
  saveSettings(settings: Record<string, any>): Promise<void>;

  // 节假日
  getHolidays(year: number): Promise<HolidayCache | null>;
  saveHolidays(data: HolidayCache): Promise<void>;

  // 同步相关
  getLastSyncTime(): Promise<number | null>;
  setLastSyncTime(time: number): Promise<void>;
}
```

- **当前实现：** `DexieStorageAdapter` — 基于 Dexie.js 的 IndexedDB 读写
- **未来实现：** `GistStorageAdapter` / `SupabaseStorageAdapter` 等，实现同一接口即可接入，**业务代码零改动**

### 14.2 候选云同步方案对比

| 方案 | 免费额度 | 服务器费用 | 实现难度 | 数据安全 |
|------|---------|-----------|---------|---------|
| **GitHub Gist** | 无限 Gist | 无 | 低 | 存在用户自己的 GitHub 账号下，私密 Gist 仅自己可见 |
| **Supabase** | 500MB DB / 50k 月活 | 无（免费 tier） | 中 | 存在 Supabase 服务器，内置行级安全策略 |
| **Cloudflare Workers + KV** | 10 万请求/天 / 1GB KV | 无 | 中高 | 存在 Cloudflare 边缘节点，高可用 |

### 14.3 推荐路线

**GitHub Gist** — 因为你已经在用 GitHub，零额外注册。实现方式：

1. 用户在设置页粘贴 GitHub Personal Access Token（仅需 `gist` 权限）
2. Token 存浏览器 localStorage（注意：任何能物理接触此电脑的人都可以读取）
3. 首次同步：创建私有 Gist，写入全量数据
4. 后续同步：读取 Gist → 对比 `lastSyncTime` → 合并变更 → 写回（last-write-wins 策略）

**不做冲突合并：** 单人使用场景下，"最后写入者胜出"已经够用。不需要引入 CRDT 等复杂方案。

### 14.4 暂不实现的原因

- 先验证核心排程功能在日常使用中是否真的有用
- 云同步增加了认证、网络错误处理、合并冲突等额外复杂度
- 需要用户操作（创建 PAT / 注册账号），不是"打开即用"的体验

---

## 15. 未来扩展（不在当前版本范围）

- **PWA 支持**：Service Worker + manifest.json，实现离线使用和"添加到主屏幕"
- **云端同步**：可选绑定 GitHub Gist / WebDAV / Cloudflare KV 实现跨设备数据同步
- **iCal 导入/导出**：兼容 Google Calendar / Apple Calendar
- **协作排程**：多人共享日程表（需要后端支持）
- **语音添加任务**：Web Speech API 快速创建任务
- **统计面板**：时间使用分析、标签组耗时占比图表
