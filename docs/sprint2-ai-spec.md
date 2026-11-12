# 诗韵·古诗库 — Sprint 2 开发规格（AI 可执行版）

> 规划人：洪修睿（包工头 / Coder-YourAdm）　|　制定：2026-10-21
> 配套机器清单：`docs/sprint2-tasks.json`（AI 逐条解析执行）
> 本规格**取代** `docs/sprint-2-plan.md` 的草稿，以本版为准。

---

## 0. 一句话目标

把当前"占位页 + 数据层 + 全局布局 + 素材主题"做成**可演示、可交互的 MVP**，10 天内跑通主链路：

```
浏览(首页/分类) → 搜索 → 诗词详情(含朗读) → 游戏(飞花令/填空) → 个人中心(登录/收藏/主题)
```

期末合 `main` 打 `v0.2`。

---

## 1. 前提假设（AI 执行前先确认，不满足先补）

1. 张雅萱 `feature/assets` 已 rebase 最新 `develop` 并解决 `App.vue`/`style.css` 冲突后合并：
   `src/styles/theme.css`、`src/stores/display.js`、字体、`public/images/themes/*.png`、`public/audio/*.mp3` 均在 `develop`。
2. **5 人诗词 json 已全部合入 `src/data/poems/`**，且 ID 遵循 `朝代-负责人-0001`（陈汝桐需把 `song-0001` → `song-chen-0001`）。
3. `npm run build` 当前通过（无编译阻塞）。
4. 所有 poetry 字段可能为**空字符串**（徐潇的数据目前 `analysis/appreciation/...` 多为空），**视图层渲染任何长文本区块前必须判空，空则不渲染**。

---

## 2. 技术约束与约定（AI 必须遵守）

- **框架**：Vue 3 + Vite + Vue Router 4 + Pinia。
- **分支**：每人从 `develop` 拉 `feature/sprint2-<scope>`；做完提 PR 到 `develop`，由**另一名成员 review** 后合并。`main` 受保护，禁止直推。
- **提交前缀**：`feat:` / `fix:` / `docs:` / `style:` / `refactor:`（例：`feat: 实现诗词详情页 PoemView`）。
- **数据获取**：页面**只**通过 `src/api/poems.js` 的导出函数取数，禁止页面直接 `import` json 文件。
- **状态管理**：Pinia store 放 `src/stores/`，`defineStore` 定义；需要持久化的（用户/收藏/主题）用 `localStorage` 自实现（无需额外依赖）。
- **诗词标准字段**（见 §3，任何页面按此渲染）。

---

## 3. 诗词标准字段（Poem Schema）

`src/data/poems/*.json` 每个文件是诗词对象数组，单条结构：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 唯一，格式 `朝代-负责人-0001`；朝代码 `tang/song/yuan/...`，负责人 `hong/liu/chen/xu/zhang` |
| `title` | string | ✅ | 标题 |
| `author` | string | ✅ | 作者 |
| `dynasty` | string | ✅ | 朝代，如 `唐`/`宋`/`元` |
| `form` | string | ✅ | 体裁：`诗`/`词`/`曲` |
| `content` | string[] | ✅ | 每行一句 |
| `theme` | string | ✅ | 主题分类，如 `豪放`/`婉约`/`思乡羁旅` |
| `tags` | string[] | ❌ | 标签 |
| `translation` | string | ❌ | 译文（可空） |
| `notes` | string | ❌ | 注释（可空） |
| `background` | string | ❌ | 创作背景（可空） |
| `analysis` | string | ❌ | 赏析（可空） |
| `appreciation` | string | ❌ | 鉴赏（可空） |
| `artisticConcept` | string | ❌ | 艺术构思/意境（可空） |

> 渲染规则：除 `id/title/author/dynasty/form/content/theme` 外，其余字段**为空字符串或空数组时一律不渲染对应区块**。

---

## 4. 路由与页面分工（已固定，勿改 `router/index.js` 路径）

| 路径 | name | 文件 | 负责人 |
|---|---|---|---|
| `/` | home | `src/views/HomeView.vue` | 陈汝桐 |
| `/category` | category | `src/views/CategoryView.vue` | 刘庭彰 |
| `/category/:type` | categoryList | `src/views/CategoryListView.vue` | 陈汝桐 |
| `/poem/:id` | poem | `src/views/PoemView.vue` | 刘庭彰 |
| `/search` | search | `src/views/SearchView.vue` | 陈汝桐 |
| `/game` | game | `src/views/GameView.vue` | 刘庭彰 |
| `/game/feihua` | feihua | `src/views/FeihuaView.vue` | 洪修睿 |
| `/game/fill` | fill | `src/views/FillView.vue` | 洪修睿 |
| `/profile` | profile | `src/views/ProfileView.vue` | 陈汝桐 |
| `/login` | login | `src/views/LoginView.vue` | 洪修睿 |
| `/settings` | settings | `src/views/SettingsView.vue` | 张雅萱 |

约定：`CategoryView` 跳转列表页使用 `router.push({ name:'categoryList', params:{ type:'dynasty'|'theme'|'author' }, query:{ value:'唐' } })`；`CategoryListView` 读 `route.params.type` + `route.query.value` 决定调哪个查询函数。

---

## 5. 10 天三阶段时间轴

| 阶段 | 天数 | 目标 | 关键交付 |
|---|---|---|---|
| **A 核心浏览与详情** | D1–D4 | 让产品"能看" | 徐：ID规范+poems.js扩展+字段文档；刘：PoemView+CategoryView；陈：HomeView+SearchView |
| **B 搜索/游戏/个人中心** | D5–D7 | 让产品"能用" | 刘：GameView；陈：CategoryListView+ProfileView；张：主题接入+SettingsView；洪：stores+LoginView+Feihua+Fill |
| **C 主题音频/收藏/联调** | D8–D10 | 全链路通+验收 | 张：音频接入；洪：收藏接入详情/我的+联调+合并；最终 `npm run build` 通过，合 `main` 打 `v0.2` |

---

## 6. 各人任务（详见 `sprint2-tasks.json`）

### 徐潇（xvxiao30509899）— 数据层 `feature/sprint2-data`
- 规范 5 人诗词 ID（D1，必须先做，否则静默丢数据）。
- 给 `poems.js` 加 `getRandomPoems(n)`、`getPagedPoems({page,size})`、`groupByAuthor()`、`getPoemsByContent(char)`、`getPoemAudio(id)`。
- 写 `docs/poem-schema.md` 对齐字段。

### 刘庭彰（Akirachan86）— 布局/组件 `feature/sprint2-layout`
- `PoemView` 详情页（原文排版、朝代/作者角标、主题标签、译文/注释/赏析/背景/鉴赏/意境折叠区——判空渲染、朗读按钮）。
- `CategoryView` 分类首页（朝代/主题/作者三类入口卡片）。
- `GameView` 游戏中心（飞花令/填空入口）。
- 增强 `PoemCard`（补作者、朝代角标）。

### 陈汝桐（AriaaaCHEN）— 页面逻辑 `feature/sprint2-views`
- `HomeView` 首页推荐（`getRandomPoems`）+ 搜索入口。
- `SearchView` 搜索（`searchPoems` → PoemCard 列表）。
- `CategoryListView` 按 `type` 调 `getByDynasty/getByTheme/getByAuthor` 渲染。
- `ProfileView` 我的（读收藏 store + 学习统计占位）。

### 张雅萱（yaxuanzhang490-cloud）— 主题/素材 `feature/sprint2-theme`
- **前提**：rebase `feature/assets` 到最新 `develop`，解决 `App.vue`/`style.css` 冲突（保留 `AppLayout`，加入 `useDisplayStore()` 初始化），合并。
- `AppLayout` 接入 `display` store（主题/字体）。
- 背景图随主题切换（`public/images/themes/`）。
- `SettingsView` 主题切换 + 字体 + 字号 UI。
- 朗读音频接入：详情页播放器用 `getPoemAudio(id)` 取 `public/audio/${id}.mp3`，缺失则占位提示。

### 洪修睿（Coder-YourAdm）— 核心/联调 `feature/sprint2-core`
- `src/stores/user.js`（登录态，localStorage 持久化）。
- `src/stores/favorites.js`（收藏增删查，localStorage 持久化）。
- `LoginView` 模拟登录（无后端）。
- `FeihuaView` 飞花令（给定字 → 从 `getPoemsByContent` 取含该字诗句，计时/计分/提示）。
- `FillView` 填空（随机诗随机挖空 → 用户补字 → 校验）。
- 跨模块联调、PR 合并、进度把控、最终 `npm run build` 验收、合 `main` 打 `v0.2`。

---

## 7. 验收里程碑

- **D4 末**：`npm run dev` 首页/分类/详情三页能显示真实诗词，`poems.js` 控制台无 ID 冲突告警。
- **D7 末**：搜索、飞花令、填空、登录/我的 功能可用。
- **D10 末**：主题切换 + 朗读音频 + 收藏全链路通；`npm run build` 通过；提 PR 合 `main` 打 `v0.2`。

## 8. 已知风险（AI 执行时盯紧）

| 风险 | 触发 | 应对 |
|---|---|---|
| 诗词 ID 冲突 | 多人 json 同 ID | 徐潇 D1 必做规范；`poems.js` 已有 dev 自检，看控制台 |
| 字段为空导致详情页空白 | 徐潇数据多空字段 | 所有长文区块**判空渲染** |
| 张雅萱主题冲突 | App.vue/style.css | 先 rebase 解决再合并 |
| 字体走 Git LFS | 部署环境无 LFS | 改用 Web 字体 CDN 或直接提交（<50MB） |
| 音频未关联数据 | poems 无 audio 字段 | 用 `getPoemAudio(id)` 按 id 拼路径，不依赖 json 字段 |

---

*本规格与 `sprint2-tasks.json` 配套使用；AI 代理按 JSON 的 `tasks[].id` 顺序、遵循 `depends_on` 执行，并以 `acceptance` 作为完成判据。*
