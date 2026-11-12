# 诗韵·古诗库 — Sprint 2 分工手册（逐人版 · 给队友一眼看懂）

> 规划人：洪修睿（包工头）　|　周期：10 天　|　目标：做出可演示 MVP，合 `main` 打 `v0.2`
> 配套文件：`sprint2-ai-spec.md`（详细规格）、`sprint2-tasks.json`（机器执行清单）
> **本手册就是给你看的"每天该干嘛"；AI 代理请改读 `sprint2-tasks.json`。**

---

## 0. 一张表看懂：按天排期（行=人，列=天，格子里是当天任务）

| 天 | 徐潇（数据） | 刘庭彰（布局） | 陈汝桐（页面） | 张雅萱（主题） | 洪修睿（核心/联调） |
|---|---|---|---|---|---|
| **D1** | 🔴DATA-1 规范诗词ID　· DATA-3 字段文档 | （等徐潇） | （等徐潇） | 🔴THM-0 rebase合并素材PR | CORE-1 用户store　· CORE-2 收藏store |
| **D2** | DATA-2 扩展 poems.js | LAY-4 增强PoemCard | （等 DATA-2） | （等 THM-0） | （等 stores） |
| **D3** | ✅ 数据层完成 | LAY-1 诗词详情页 | VIE-1 首页 | （等 THM-0） | （等 DATA-2） |
| **D4** | — | LAY-2 分类首页 | VIE-2 搜索页 | （等 THM-0） | — |
| **D5** | — | LAY-3 游戏中心 | VIE-3 分类列表 | THM-1/2/3 主题+设置 | CORE-3 登录页 |
| **D6** | — | — | （联调准备） | （主题打磨） | CORE-4 飞花令　· CORE-5 填空 |
| **D7** | — | — | VIE-4 个人中心 | — | — |
| **D8** | — | — | — | THM-4 音频接入详情页 | CORE-6 联调开始 |
| **D9** | — | — | — | — | CORE-6 联调/修冲突 |
| **D10** | — | — | — | — | CORE-6 build验收·合main打v0.2 |

🔴 = 阻塞点（后面的人要等它合入才能开工）。 milestone：**D4** 能看（首页/分类/详情）｜**D7** 能用（搜索/游戏/登录/我的）｜**D10** 全链路通+发布。

---

## 1. 徐潇（GitHub: `xvxiao30509899`）— 数据层

- **分支**：`feature/sprint2-data`
- **角色定位**：全队地基。**你的活最前置**，刘/陈/洪都直接或间接等你，请务必先交。
- **每天做什么**
  - **D1（最重要的一天）**：
    - `DATA-1` 规范 5 人诗词 ID：遍历 `src/data/poems/*.json`，每条 `id` 改成 `朝代-负责人-0001`（唐=`tang`、宋=`song`、元=`yuan`；负责人 `hong/liu/chen/xu/zhang`）。**重点：陈汝桐的 `song-0001` → `song-chen-0001`**，否则和别人撞车、数据静默丢一半。
    - `DATA-3` 写 `docs/poem-schema.md`（标准字段说明），D2 前合入让大家对齐。
  - **D2**：`DATA-2` 给 `src/api/poems.js` 新增 5 个函数并 `export`：`getRandomPoems(n)`、`getPagedPoems({page,size})`、`groupByAuthor()`、`getPoemsByContent(char)`（飞花令用）、`getPoemAudio(id)`（返回 `'audio/'+id+'.mp3'`）。
- **你负责的文件**：`src/data/poems/*.json`（改）、`src/api/poems.js`（改）、`docs/poem-schema.md`（建）
- **验收（合 PR 前自查）**：`npm run dev` 控制台无 `[poems] ID 冲突` 告警；`getPoemById` 每个 id 唯一命中；5 个新函数都能 import 到。
- **避坑**：① ID 不规范是全局雷；② 徐潇自己的数据很多字段是空串，提醒页面层要判空（你文档里写清"空字段不渲染"）。
- **谁等你**：刘庭彰（`LAY-1`/`LAY-2`）、陈汝桐（全部 `VIE-*`）、洪修睿（`CORE-4`/`CORE-5`/`CORE-6`）都依赖 `DATA-2`；`DATA-1` 是所有人数据正确的前提。

---

## 2. 刘庭彰（GitHub: `Akirachan86`）— 布局 / 组件

- **分支**：`feature/sprint2-layout`
- **角色定位**：搭"壳"和"卡片"，所有人页面都用到你的 `PoemCard` 和 `AppLayout`（AppLayout 由张雅萱接主题，别动它）。
- **每天做什么**
  - **D2**：`LAY-4` 增强 `PoemCard.vue`——补作者、朝代角标；整卡可点击跳 `/poem/:id`；保留 scoped 样式与无障碍 focus/hover。
  - **D3**：`LAY-1` 实现 `PoemView.vue`（诗词详情页）：标题/作者+朝代角标/体裁/theme标签；正文逐行；translation/notes/background/analysis/appreciation/artisticConcept 各自折叠区，**字段为空就不渲染该区**；朗读按钮（调 `getPoemAudio(id)`，文件缺失显示"暂无朗读音频"）。
  - **D4**：`LAY-2` 实现 `CategoryView.vue`（分类首页）：朝代/主题/作者三组入口卡片，点击 `router.push({name:'categoryList', params:{type}, query:{value}})`。
  - **D5**：`LAY-3` 实现 `GameView.vue`（游戏中心）：飞花令/填空两个入口卡片，分别跳 `feihua`/`fill`。
- **你负责的文件**：`src/views/PoemView.vue`、`src/views/CategoryView.vue`、`src/views/GameView.vue`、`src/components/PoemCard.vue`
- **验收**：`/poem/song-xu-0001` 能看到正文；空字段区块不显示；分类入口能跳列表页；游戏入口能跳游戏页。
- **避坑**：① 详情页所有长文区块必须判空（徐潇数据多空）；② 朗读按钮别因音频缺失崩溃；③ `PoemCard` 改动会影响陈汝桐的首页/搜索/列表，早点合。
- **谁等你**：陈汝桐（`VIE-3` 分类列表）依赖 `LAY-2`；张雅萱（`THM-4` 音频）依赖 `LAY-1`。

---

## 3. 陈汝桐（GitHub: `AriaaaCHEN`）— 页面逻辑

- **分支**：`feature/sprint2-views`
- **角色定位**：把数据接成"能用的页面"，首页/搜索/列表/我的四个核心页都是你。
- **每天做什么**
  - **D3**：`VIE-1` 完善 `HomeView.vue`：调 `getRandomPoems(8)` 推荐诗词（用 `PoemCard` 网格）；顶部搜索入口跳 `/search?kw=`。
  - **D4**：`VIE-2` 实现 `SearchView.vue`：读 `route.query.kw` 作初始值；输入即调 `searchPoems(kw)` 实时出 `PoemCard` 列表；无结果显示"未找到相关诗词"。
  - **D5**：`VIE-3` 实现 `CategoryListView.vue`：读 `route.params.type`（dynasty/theme/author）+ `route.query.value`，分别调 `getByDynasty/getByTheme/getByAuthor`，用 `PoemCard` 网格 + 分页；顶部标题"X：value"。
  - **D7**：`VIE-4` 实现 `ProfileView.vue`（个人中心）：读 user store（已登录显用户名+退出，未登录显去登录入口）；"我的收藏"列表（读 favorites store 的 ids → `getPoemById` 转 `PoemCard`）；学习统计占位（已学/收藏数）。
- **你负责的文件**：`src/views/HomeView.vue`、`src/views/SearchView.vue`、`src/views/CategoryListView.vue`、`src/views/ProfileView.vue`
- **验收**：首页 8 首推荐可点进详情；搜索实时出结果；分类列表按朝代/主题/作者正确；个人中心登录态与收藏正确。
- **避坑**：① 全部页面只经 `src/api/poems.js` 取数，**禁止直接 import json**；② 列表/收藏都要判空；③ `VIE-4` 依赖洪修睿的 `CORE-1`/`CORE-2`（stores），D7 才能做，前面先做完前三个。
- **谁等你**：洪修睿（`CORE-6` 联调、收藏接入）依赖你全部 `VIE-*`。

---

## 4. 张雅萱（GitHub: `yaxuanzhang490-cloud`）— 主题 / 素材

- **分支**：`feature/assets`（先合并旧 PR）→ `feature/sprint2-theme`
- **角色定位**：颜值担当，主题/字体/背景/音频/设置页。
- **每天做什么**
  - **D1（必须先做）**：`THM-0` 把 `feature/assets` rebase 到最新 `develop` 并解决冲突——**`src/App.vue` 必须保留刘庭彰的 `AppLayout`，并在此基础上加 `useDisplayStore()` 初始化**；`src/style.css` 合并全局+主题样式。解决后提 PR 合 develop。（这步不完成，你后面的任务全卡住。）
  - **D5**：`THM-1` AppLayout 接 `display` store（主题/字体/字号挂根容器）；`THM-2` 背景图随主题切换（`public/images/themes/{season}.png` 铺满+遮罩，**删掉 theme.css 里的临时测试注释**）；`THM-3` `SettingsView.vue` 主题/字体/字号切换 UI（写回 display store + localStorage 持久化）。
  - **D8**：`THM-4` 朗读音频接入详情页——与刘庭彰协调，`PoemView` 朗读按钮用 `getPoemAudio(id)` 取 `'audio/'+id+'.mp3'`，`<audio>` 播放，缺失显示"暂无朗读音频"。
- **你负责的文件**：`src/App.vue`、`src/style.css`、`src/layout/AppLayout.vue`、`src/styles/theme.css`、`src/views/SettingsView.vue`、`src/views/PoemView.vue`（改，仅朗读部分）
- **验收**：主题切换实时生效；背景随季节变化且文字清晰；设置刷新后保留；详情页朗读能放、缺失有占位。
- **避坑**：① D1 冲突是硬骨头，先和刘庭彰对齐 App.vue；② 字体走了 Git LFS，部署环境若无 LFS 会 404，建议改用 Web 字体 CDN 或直接提交（<50MB）；③ 音频文件名必须与诗词 id 一致（如 `song-xu-0001.mp3`）。
- **谁等你**：洪修睿（`CORE-6` 主题联调）、刘庭彰（`THM-4` 音频）依赖你。

---

## 5. 洪修睿（GitHub: `Coder-YourAdm`）— 核心 / 联调（包工头）

- **分支**：`feature/sprint2-core`
- **角色定位**：写底层 store 和游戏算法，最后负责把所有人的 PR 联调、合并、验收、发布。
- **每天做什么**
  - **D1**：`CORE-1` 建 `src/stores/user.js`（登录态，localStorage key `shiyun-user`）；`CORE-2` 建 `src/stores/favorites.js`（收藏增删查，localStorage key `shiyun-favorites`）。这俩无依赖，先交，陈汝桐/张雅萱才能用。
  - **D5**：`CORE-3` `LoginView.vue` 模拟登录（无后端，输入用户名→`user.login()`→跳 `/profile`，含游客跳过）。
  - **D6**：`CORE-4` `FeihuaView.vue` 飞花令（内置字库→随机抽字→`getPoemsByContent(X)` 取参考答案→用户输入校验含字→计时/计分/提示）；`CORE-5` `FillView.vue` 填空（随机诗随机挖 1 字→用户补→校验→下一题）。
  - **D8–D10**：`CORE-6` 联调——① 给 `PoemView` 加"收藏"按钮（`favorites.toggle`）；② 各 feature 提 PR 合 develop 后，dev 走通主链路（首页→分类→详情→朗读→搜索→飞花令→填空→登录→收藏→设置）；③ `npm run build` 必须通过；④ 提 `develop→main` PR 合入（main 受保护，需临时放宽再恢复）并打 `git tag v0.2`。
- **你负责的文件**：`src/stores/user.js`、`src/stores/favorites.js`、`src/views/LoginView.vue`、`src/views/FeihuaView.vue`、`src/views/FillView.vue`、`src/views/PoemView.vue`（收藏按钮）、`src/views/ProfileView.vue`（联调）
- **验收**：登录/收藏持久化；飞花令+填空可玩；主链路全通；build 通过；main 合入 v0.2 且保护恢复。
- **避坑**：① stores 的 key 命名统一，别和张雅萱的 `shiyun-display` 撞；② 联调时重点查跨模块冲突（尤其 App.vue、PoemView 被多人改）。

---

## 6. 依赖关系（谁等谁）一眼图

```
徐潇 DATA-1 ─┐
            ├─→ 徐潇 DATA-2 ──→ 刘 LAY-1/2 ─→ 陈 VIE-3
            │                 └→ 陈 VIE-1/2 ─→ 张 THM-4(音频)
            │                 └→ 洪 CORE-4/5
徐潇 DATA-3 ─┘
张雅萱 THM-0(合并素材) ─→ 张 THM-1/2/3 ─→ 洪 CORE-6(主题联调)
洪 CORE-1/2(stores) ──→ 陈 VIE-4(我的) / 张 THM(收藏联调)
```

**卡点预警**：D1 徐潇 ID 规范 + 张雅萱素材合并，这两件事不做，后面一大片人开不了工。

---

## 7. 合并与 Review 规则（全员遵守）

1. 每人从 `develop` 拉自己的 `feature/sprint2-<scope>`（张雅萱先处理 `feature/assets`）。
2. 提交前缀：`feat:` / `fix:` / `docs:` / `style:` / `refactor:`。
3. 做完提 **PR 到 `develop`**，**由另一名成员 review 通过后合并**（别自己合自己的）。
4. `main` 受保护，**禁止直推**；发布由洪修睿统一走 `develop→main` 的 PR。
5. 每天结束前尽量把当天 feature 合进 develop，避免月底大冲突。

---

## 8. 三个里程碑（对齐用）

- **D4 末**：首页/分类/详情三页 dev 下显示真实诗词；`poems.js` 控制台无 ID 冲突告警。
- **D7 末**：搜索、飞花令、填空、登录/我的 功能可用。
- **D10 末**：主题切换 + 朗读音频 + 收藏全链路通；`npm run build` 通过；合 main 打 `v0.2`。

> 不确定自己任务优先级时，看 §0 排期表 + 你那一节的"每天做什么"即可。有冲突/依赖卡住，群里 @ 对应人。
