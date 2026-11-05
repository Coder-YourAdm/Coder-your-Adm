// Supabase 客户端工厂（联网对战背诗 S3-T05 用）
// 凭证来自 .env 的 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY。
// 未配置时 isSupabaseConfigured=false，对战自动降级为本地模式（人机 / 同设备双开）。
//
// 说明：@supabase/supabase-js 未列入默认依赖（避免未配置时构建失败）。
// 这里用「变量 + @vite-ignore」动态 import：dev 模式下 Vite 的 import-analysis
// 无法静态解析变量，未安装该包也不会再弹报错遮罩；运行时解析失败会被 catch 住并降级。
// 真正启用联网模式：先 `npm install @supabase/supabase-js`，
// 再把下面 PKG 换回字符串字面量 '@supabase/supabase-js'，Vite 即可正常解析。
const PKG = '@supabase' + '/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

let _client = null

export async function getSupabase() {
  if (!isSupabaseConfigured) return null
  if (_client) return _client
  try {
    const mod = await import(/* @vite-ignore */ PKG)
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
