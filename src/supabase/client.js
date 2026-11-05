// Supabase 客户端工厂（联网对战背诗 S3-T05 用）
// 凭证来自 .env 的 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY。
// 未配置时 isSupabaseConfigured=false，对战自动降级为本地模式（人机 / 同设备双开）。
//
// 说明：@supabase/supabase-js 未列入默认依赖（避免未配置时构建失败）。
// 真正启用联网模式前请先 `npm install @supabase/supabase-js`，再在 .env 配置两个变量。
// 这里用 /* @vite-ignore */ 动态 import，构建期不会尝试解析该包。

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

let _client = null

export async function getSupabase() {
  if (!isSupabaseConfigured) return null
  if (_client) return _client
  try {
    const mod = await import(/* @vite-ignore */ '@supabase/supabase-js')
    const createClient = mod.createClient || (mod.default && mod.default.createClient) || mod.default
    _client = createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
    })
    return _client
  } catch (e) {
    console.error('[supabase] 加载失败，请先 npm install @supabase/supabase-js', e)
    return null
  }
}
