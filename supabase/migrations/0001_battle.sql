-- 联网对战背诗（S3-T05）数据库初始化
-- 用途：持久化对战房间与结算，供 Supabase Realtime 匹配/广播扩展使用。
-- 注意：核心对战同步走 Realtime broadcast（无需此表即可实时对战）；
--       本表用于房间记录与战绩留痕，按需启用。

create table if not exists public.battle_rooms (
  id          uuid primary key default gen_random_uuid(),
  char        text not null,
  player_a    text,
  player_b    text,
  winner      smallint,
  moves       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

alter table public.battle_rooms enable row level security;

-- 匿名（或已登录）可读写，便于匹配与结算留痕。
-- 生产环境可收紧为仅登录用户。
create policy "battle_rooms_anon_insert" on public.battle_rooms
  for insert to anon with check (true);

create policy "battle_rooms_anon_select" on public.battle_rooms
  for select to anon using (true);

-- 启用 Realtime（如需订阅房间表变更则生效；当前对战主要用 broadcast）
alter publication supabase_realtime add table public.battle_rooms;
