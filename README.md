# 诗韵 · 古诗库

> 古典诗词学习 Web 应用（Vue 3 课程项目）
> 项目骨架由 **洪修睿** 搭建，其余成员在此基础上并行开发。

## 技术栈（课程硬性要求，不得替换）

- **Vue 3** + **Vite**
- **Vue Router 4**
- **Pinia**（全局状态管理）

## 运行方式

```bash
npm install      # 安装依赖
npm run dev      # 本地起开发服务（默认 http://localhost:5173）
npm run build    # 生产构建（答辩硬指标，必须成功）
npm run preview  # 预览生产构建产物
```

## 目录结构

```
shiyun/
├─ index.html
├─ package.json
├─ vite.config.js        # 已配置 @ -> src 别名
├─ .gitignore
├─ README.md
├─ public/
│  ├─ fonts/             # 字体文件（张雅萱）
│  ├─ audio/             # 朗诵 mp3（张雅萱，10 首）
│  └─ images/themes/     # 四季背景图（张雅萱）
├─ src/
│  ├─ main.js            # 挂载 Pinia + Router
│  ├─ App.vue            # 仅路由出口（布局由刘庭彰补充）
│  ├─ api/poems.js       # 数据接入层（徐潇）
│  ├─ data/poems/        # 诗词 json（5 人各一个文件）
│  ├─ router/index.js    # 路由表（陈汝桐）
│  ├─ layout/AppLayout.vue   # 全局布局（刘庭彰）
│  ├─ components/PoemCard.vue  # 公共卡片（刘庭彰）
│  ├─ styles/theme.css   # 四季主题+字体变量（张雅萱）
│  └─ views/             # 11 个页面占位（陈汝桐）
└─ docs/
```

## 分工表（§0 公共约定）

| 成员 | 任务 | 分支 | 负责文件 |
|---|---|---|---|
| 洪修睿 | 项目骨架 | `develop`（先合） | 脚手架 / 目录 / 协作规则 |
| 徐潇 | 数据接入层 | `feature/data` | `src/api/poems.js` |
| 刘庭彰 | 全局布局 + 公共组件 | `feature/layout` | `AppLayout.vue` / `PoemCard.vue` |
| 陈汝桐 | 路由表 + 页面占位 | `feature/router` | `router/index.js` / `views/*` |
| 张雅萱 | 素材落地 + 主题系统 | `feature/assets` | `theme.css` / 字体 / 背景 / 音频 |

## 分支与提交规则

- `main` 受保护，**禁止直接 push**；日常集成在 `develop`。
- 洪修睿先把骨架合到 `develop`；其余 4 人从 `develop` 拉自己的 feature 分支，做完提 PR 由另一人 review 后合并。
- 提交前缀：`feat:` / `fix:` / `docs:` / `style:`
  例：`feat: 新增数据接入层 poems.js`

## 协作时序

洪修睿先把骨架合 `develop` → 徐/刘/陈/张 各自拉 feature 分支并行开发 → 每人的 PR 由另一人 review 后合回 `develop` → 周五洪修睿把 `develop` 合 `main` 打 `v0.1` tag。
