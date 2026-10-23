# 诗韵·古诗库 — Sprint 2 开发计划（10 天）

> 规划人：洪修睿（包工头）　|　制定时间：2026-10-19
> 适用分支：`develop` → 周末合 `main` 打 `v0.2`

## 一、Sprint 目标

把 Sprint 1 已完成的**骨架 / 数据层 / 全局布局 / 素材主题**，转化为**可演示、可交互的完整 MVP**，跑通主链路：

```
浏览(首页/分类) → 搜索 → 诗词详情 → 游戏(飞花令/填空) → 个人中心(登录/收藏)
```

期末提 PR 合 `main`，打 `v0.2` tag，作为中期答辩/演示版本。

## 二、前提假设（本计划基于此，未满足请先补齐）

1. 张雅萱 `feature/assets` 已合并：`theme.css`、字体、`public/images/themes/` 四季背景、`public/audio/` 朗诵音频已入库。
2. 5 人（洪/徐/刘/陈/张）诗词 json 已全部合入 `src/data/poems/`，且 ID 遵循 `朝代-负责人-0001` 规范（**陈汝桐需把 `song-0001` 改为 `song-chen-0001`**）。
3. 当前 `npm run build` 已通过（53 模块），无编译阻塞。

## 三、时间轴（10 天 / 三阶段）

| 阶段 | 天数 | 目标 |
|---|---|---|
| **A 核心浏览与详情** | D1–D4 | 让产品"能看"：首页、分类、详情三页跑通，能看到诗词 |
| **B 搜索 / 游戏 / 个人中心** | D5–D7 | 让产品"能用"：搜索、飞花令、填空、登录/我的 可用 |
| **C 主题音频 / 收藏 / 联调验收** | D8–D10 | 全链路打通 + 构建验收，合 `main` 打 `v0.2` |

## 四、任务分配（每人从 `develop` 拉 `feature/sprint2-xxx`）

### 徐潇 — 数据层（feature/sprint2-data）
- [ ] **D1 规范 5 人诗词 json**：推动陈汝桐改 ID 前缀；本地 `npm run dev` 看控制台无 ID 冲突告警（`poems.js` 已带自检）。
- [ ] `poems.js` 新增函数：`getRandomPoems(n)`（首页推荐）、`getPagedPoems(page,size)`（分类分页）、`groupByAuthor()`（作者墙）。
- [ ] 产出 `docs/poem-schema.md`：定义诗词标准字段 `title/author/dynasty/form/theme/content[]/tags[]/appreciation/annotation`，D2 前给全员对齐。

### 刘庭彰 — 布局 / 组件（feature/sprint2-layout）
- [ ] `PoemView` 详情页：原文排版、作者+朝代角标、主题标签、译文/注释/赏析折叠区、朗读按钮占位。
- [ ] `CategoryView` 分类首页：朝代 / 主题 / 作者 三类入口卡片。
- [ ] `GameView` 游戏中心：飞花令、填空两个入口卡片。
- [ ] 增强 `PoemCard`：补充作者、朝代角标。

### 陈汝桐 — 页面逻辑（feature/sprint2-views）
- [ ] `HomeView` 完善：热门推荐（调 `getRandomPoems`）+ 搜索入口跳转。
- [ ] `SearchView` 实现：输入 → `searchPoems(kw)` → `PoemCard` 结果列表。
- [ ] `CategoryListView`：按 `:type` 调 `getByDynasty / getByTheme / getByAuthor` 渲染列表。
- [ ] `ProfileView`「我的」：读取收藏（localStorage）、学习统计占位。

### 张雅萱 — 主题 / 素材（feature/sprint2-theme）
- [ ] `theme.css` 四季主题接入 `AppLayout`，提供切换能力（Pinia 存当前主题）。
- [ ] 背景图随主题切换（`public/images/themes/`）。
- [ ] 朗读音频接入 `PoemView`（`public/audio/` 对应 mp3；缺失用占位提示）。
- [ ] `SettingsView` 设置页：主题切换 UI + 字体大小调节。

### 洪修睿（你）— 核心 / 联调（feature/sprint2-core）
- [ ] Pinia store：`user`（登录态/当前主题）、`favorites`（增删查，localStorage 持久化）。
- [ ] 游戏算法：`FeihuaView`（给定字，从 `ALL` 匹配含该字诗句，计时/轮流）、`FillView`（挖空校验）。
- [ ] `LoginView`：localStorage 模拟登录（无后端）。
- [ ] 跨模块联调、PR 合并、进度把控、最终 `npm run build` 验收。

## 五、里程碑验收

- **D4 末**：首页 / 分类 / 详情三页 `npm run dev` 跑通，能看到诗词内容。
- **D7 末**：搜索、飞花令、填空、登录/我的 功能可用。
- **D10 末**：主题切换 + 音频 + 收藏全链路通；`npm run build` 通过；提 PR 合 `main` 打 `v0.2`。

## 六、协作规则（重申）

- 每人从 `develop` 拉 `feature/sprint2-xxx`；做完提 PR，由**另一人 review** 后合回 `develop`。
- 提交前缀：`feat:` / `fix:` / `docs:` / `style:`（例：`feat: 实现搜索页 SearchView`）。
- 周五（D5、D10）由洪修睿把 `develop` 合 `main`；D10 打 `v0.2`。
- 每日站会 5 分钟同步阻塞。

## 七、风险与依赖

| 风险 | 影响 | 应对 |
|---|---|---|
| 诗词 ID 冲突 | `getPoemById` 静默丢数据 | **D1 必做**：徐潇推动全员改规范前缀 |
| 诗词 json 字段不齐（缺 appreciation/annotation） | 详情页空白 | 徐潇 D2 前出 `poem-schema.md`，全员对齐 |
| 张雅萱主题/音频未就绪 | 阶段 C 主题切换、朗读卡住 | 阶段 A/B 先行，主题音频 D8 前必须入库 |
| `poems.js` 新函数未就绪 | 上层页面无数据可调 | 徐潇 D2 前合并新增函数 |

---

*注：本计划基于"张雅萱素材 + 五人诗词已全部入库"的假设；若实际未合入，请先完成 Sprint 1 收尾再启动本周期。*
