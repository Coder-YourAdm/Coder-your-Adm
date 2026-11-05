# Supabase 配置（联网对战背诗 S3-T05）

本目录为「联网对战背诗」所需的 BaaS（Supabase）脚手架。

## 三种对战通道

| 通道 | 入口 | 是否需后端 | 说明 |
|------|------|-----------|------|
| 🤖 人机对战 | 大厅选「人机对战」 | 否 | 本地 AI 飞花令接力，单人即可练习/演示 |
| 💻 同设备双开 | 大厅选「同设备双开」 | 否 | 用 `BroadcastChannel` 在两个标签页间实时同步，演示实时通信 |
| 🌐 联网对战 | 大厅选「联网对战」 | 是（Supabase） | 经 Supabase Realtime 跨设备匹配真人 |

> 未配置 Supabase 时，选「联网对战」会**自动降级**为「同设备双开」，并给出提示；功能仍可完整演示。

## 启用真正的联网对战

1. 在 [supabase.com](https://supabase.com) 新建项目。
2. 在项目 SQL Editor 中执行 `migrations/0001_battle.sql`。
3. 复制 `.env.example` 为 `.env`，填入项目的 URL 与 anon key：
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
4. 安装 SDK：`npm install @supabase/supabase-js`
5. 重新启动 `npm run dev`，大厅选「联网对战」即可跨设备匹配。

## 关键代码

- `src/supabase/client.js`：读取 env、动态加载 SDK（`@vite-ignore` 避免未安装时构建失败）。
- `src/stores/battle.js`：对战状态机，统一三种通道（bot / local / online）。
- `src/views/BattleView.vue`：大厅 / 匹配 / 对战 / 结算四态界面。

## 约定

- 前端**不持有任何密钥**：Supabase anon key 仅用于客户端 Realtime，属公开密钥；
  涉及 DeepSeek 等私密 key 的调用应走 Supabase Edge Functions（见 sprint3-tasks.json 的 backend_rule）。
