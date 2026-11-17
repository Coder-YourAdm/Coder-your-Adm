// S3-T07 AI 诗画 · 代理层（前端 → 本服务 → 硅基流动 Kolors）
//
// 设计要点：
//  1. 零依赖：只用 Node 内置能力（http / fs / fetch），node >= 18。
//  2. key 只从环境变量 / .env.local 读取，绝不进 git、绝不下发给前端。
//  3. 硅基流动返回的图片 URL 只有 1 小时有效 → 本服务立刻下载、转 base64
//     data URL 返回，前端拿到的图永久可用。
//  4. 诗词数据直接读 src/data/poems/*.json —— 与前端同一数据源，不重复维护。
//  5. 错误码与前端契约对齐：RATE_LIMIT / NO_QUOTA / UPSTREAM_ERROR / BAD_REQUEST。
//
// 本地启动：npm run ai-proxy（读根目录 .env.local）
// 部署：同一段逻辑可平移到 Supabase Edge Function / Vercel Function，
//       只需把读文件的部分换成打包时注入的 JSON。

import http from 'node:http'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// ── 配置 ────────────────────────────────────────────────
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.PORT || 8788)
const UPSTREAM = 'https://api.siliconflow.cn/v1'
const IMAGE_MODEL = 'Kwai-Kolors/Kolors'
const UPSTREAM_TIMEOUT_MS = 50_000 // 必须小于前端 60s 超时，先给前端回错误
const RATE_LIMIT_PER_MIN = 10 // 每 IP 每分钟生图次数（免费模型限流低，别打爆）

// ── 环境变量（.env.local 优先，便于本地开发）──────────────
const env = loadEnv(path.join(ROOT, '.env.local'))
const API_KEY = String(env.SILICONFLOW_API_KEY || process.env.SILICONFLOW_API_KEY || '').trim()

// ── 诗词数据（与前端同一数据源）─────────────────────────
const poems = new Map()
for (const file of readdirSync(path.join(ROOT, 'src', 'data', 'poems'))) {
  if (!file.endsWith('.json')) continue
  for (const p of JSON.parse(readFileSync(path.join(ROOT, 'src', 'data', 'poems', file), 'utf-8'))) {
    poems.set(p.id, p)
  }
}

// ── 画风提示词模板 ──────────────────────────────────────
const STYLES = {
  ink: '中国水墨写意画，宣纸质感，淡墨晕染，大量留白，意境空灵',
  gongbi: '中国工笔重彩画，绢本设色，线条细腻工整，色彩典雅富丽',
  oil: '古典油画风格，厚重笔触，暖色调光影，博物馆藏品质感',
  photo: '摄影写实风格，自然光影，浅景深，高清细节，晨雾或夕照氛围',
}

// ── 简易限流（每 IP 滑动窗口）────────────────────────────
const hits = new Map()
function rateLimited(ip) {
  const now = Date.now()
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000)
  if (arr.length >= RATE_LIMIT_PER_MIN) {
    hits.set(ip, arr)
    return true
  }
  arr.push(now)
  hits.set(ip, arr)
  return false
}

// ── HTTP 服务 ───────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') return res.writeHead(204).end()
  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, {
      ok: true,
      keyLoaded: Boolean(API_KEY),
      poems: poems.size,
      model: IMAGE_MODEL,
    })
  }

  if (req.method === 'POST' && url.pathname === '/api/generate') {
    if (!API_KEY) return fail(res, 500, 'UPSTREAM_ERROR', '代理未配置 SILICONFLOW_API_KEY')
    if (rateLimited(req.socket.remoteAddress)) {
      return fail(res, 429, 'RATE_LIMIT', `每分钟最多 ${RATE_LIMIT_PER_MIN} 次生成，请稍后再试`)
    }
    return handleGenerate(req, res)
  }

  fail(res, 404, 'BAD_REQUEST', `未知路由：${req.method} ${url.pathname}`)
})

async function handleGenerate(req, res) {
  let body
  try {
    body = JSON.parse(await readBody(req, 64 * 1024))
  } catch {
    return fail(res, 400, 'BAD_REQUEST', '请求体不是合法 JSON')
  }

  const poemId = String(body.poemId || '').trim()
  const style = STYLES[body.style] ? body.style : 'ink'
  const poem = poems.get(poemId)
  if (!poem) return fail(res, 400, 'BAD_REQUEST', `未找到诗词：${poemId || '(空)'}`)

  // ── 组提示词：诗意要素 + 画风 + 反文字指令 ──
  const lines = (poem.content || []).slice(0, 2).join('，')
  const prompt = [
    STYLES[style],
    `画面主题：中国古典诗意场景——${poem.title}（${poem.dynasty || ''}·${poem.author || ''}）：${lines}`,
    '构图讲究留白与远近距离，意境悠远。',
    '画面中不要出现任何文字、题字、印章。',
  ].join('')

  try {
    // ── 调硅基流动生图 ──
    const gen = await fetchJson(`${UPSTREAM}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: IMAGE_MODEL, prompt, image_size: '1024x1024', batch_size: 1 }),
      timeoutMs: UPSTREAM_TIMEOUT_MS,
    })
    const tempUrl = gen?.images?.[0]?.url
    if (!tempUrl) return fail(res, 502, 'UPSTREAM_ERROR', '上游未返回图片地址')

    // ── 立刻下载临时 URL → base64（S3 链接 1 小时失效，必须当场转存）──
    const img = await fetchBinary(tempUrl, UPSTREAM_TIMEOUT_MS)
    const dataUrl = `data:image/png;base64,${img.toString('base64')}`

    send(res, 200, { ok: true, imageUrl: dataUrl, prompt, model: IMAGE_MODEL })
  } catch (err) {
    const { status, code, message } = mapUpstreamError(err)
    fail(res, status, code, message)
  }
}

// ── 上游错误 → 契约错误码 ───────────────────────────────
function mapUpstreamError(err) {
  const status = err.status || 0
  const bodyText = String(err.body || '')
  if (status === 429) return { status: 429, code: 'RATE_LIMIT', message: '上游限流，请稍后重试' }
  if (err.name === 'TimeoutError' || err.name === 'AbortError') {
    return { status: 504, code: 'UPSTREAM_ERROR', message: '上游生成超时' }
  }
  if (/AllocationQuota|quota|额度/i.test(bodyText)) {
    return { status: 402, code: 'NO_QUOTA', message: '免费额度已用尽' }
  }
  if (status === 401 || status === 403) {
    return { status: 502, code: 'UPSTREAM_ERROR', message: '上游鉴权失败（检查 API key）' }
  }
  return { status: 502, code: 'UPSTREAM_ERROR', message: `上游异常：${err.message || status}` }
}

// ── 小工具 ─────────────────────────────────────────────
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) return reject(new Error('body too large'))
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

async function fetchJson(url, init) {
  const r = await fetchWithTimeout(url, init)
  const text = await r.text()
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status, body: text })
  try { return JSON.parse(text) } catch { throw new Error('上游返回非 JSON') }
}

async function fetchBinary(url, timeoutMs) {
  const r = await fetchWithTimeout(url, { method: 'GET' }, timeoutMs)
  if (!r.ok) throw Object.assign(new Error(`下载失败 HTTP ${r.status}`), { status: r.status })
  return Buffer.from(await r.arrayBuffer())
}

function fetchWithTimeout(url, init = {}, timeoutMs = UPSTREAM_TIMEOUT_MS) {
  const signal = AbortSignal.timeout(timeoutMs)
  return fetch(url, { ...init, signal })
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
}

function send(res, status, data) {
  res.writeHead(status).end(JSON.stringify(data))
}

function fail(res, status, code, message) {
  send(res, status, { ok: false, error: code, message })
}

function loadEnv(file) {
  const out = {}
  try {
    for (const line of readFileSync(file, 'utf-8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m || line.trim().startsWith('#')) continue
      out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* 文件不存在则只用进程环境变量 */ }
  return out
}

// ── 启动 ───────────────────────────────────────────────
if (!API_KEY) {
  console.error('[ai-proxy] ⚠️ 未配置 SILICONFLOW_API_KEY（.env.local 或环境变量）')
}
server.listen(PORT, () => {
  console.log(`[ai-proxy] http://localhost:${PORT}  诗词 ${poems.size} 首  key=${API_KEY ? '已加载' : '未配置'}`)
})
