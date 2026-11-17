// S3-T07 AI 诗画 · 前端接入层（唯一出入口）
//
// ── 前后端契约 ──────────────────────────────────────────────
// 请求：POST {VITE_AI_IMAGE_API_BASE}/generate
//   body: { "poemId": "tang-xu-0001", "style": "ink" }
//   style ∈ ink(水墨写意) / gongbi(工笔重彩) / oil(古典油画) / photo(摄影写实)
// 成功响应（HTTP 200）：
//   { "ok": true, "imageUrl": "https://...", "prompt": "生成所用的画面提示词", "model": "wan2.1-t2i-turbo" }
// 失败响应（HTTP 4xx/5xx）：
//   { "ok": false, "error": "UPSTREAM_ERROR", "message": "人类可读的原因" }
//   约定错误码：RATE_LIMIT(限流) / NO_QUOTA(免费额度用尽) / UPSTREAM_ERROR(模型侧失败) / BAD_REQUEST(参数问题)
//
// ── 切换到真实后端 ──────────────────────────────────────────
// 默认走线上代理（Render 免费档），任何人 clone 后无需任何配置即可真实生图。
// .env 里可覆盖 VITE_AI_IMAGE_API_BASE：
//   指向自定义代理地址（如 http://localhost:8788/api 走本地代理开发）
//   或填 "mock" 强制走本地演示模式（占位图，不调任何外部接口）。
// 硅基流动 key 只存在云端代理的环境变量里，前端代码与仓库中永远不出现。
//
// ── 线上架构（S3-T07 定稿）──────────────────────────────────
//   前端 → https://shiyun-ai-image.onrender.com/api（Render, 新加坡区）
//        → 硅基流动 Kwai-Kolors/Kolors（生图免费）
//   注意：免费档 15 分钟无访问会休眠，首次请求需 30~60 秒唤醒，超时已放宽到 90s。

import { getPoemById, getRandomPoems } from './poems'

// 线上默认地址（公开 URL，非机密，可以进仓库）
const DEFAULT_API_BASE = 'https://shiyun-ai-image.onrender.com/api'
const RAW_BASE = String(import.meta.env.VITE_AI_IMAGE_API_BASE ?? '').trim()
const API_BASE = RAW_BASE.toLowerCase() === 'mock' ? '' : RAW_BASE || DEFAULT_API_BASE
const REQUEST_TIMEOUT = 90000

export const AI_IMAGE_STYLES = [
  { value: 'ink', label: '水墨写意' },
  { value: 'gongbi', label: '工笔重彩' },
  { value: 'oil', label: '古典油画' },
  { value: 'photo', label: '摄影写实' },
]

/** 当前是否处于演示模式（.env 里把 VITE_AI_IMAGE_API_BASE 设为 "mock" 时） */
export function isAiImageMockMode() {
  return !API_BASE
}

/**
 * 生成诗词画面。
 * @param {{ poemId: string, style?: string, signal?: AbortSignal }} params
 * @returns {Promise<{ imageUrl: string, prompt: string, model: string }>}
 */
export async function generatePoemImage({ poemId, style = 'ink', signal } = {}) {
  if (typeof poemId !== 'string' || !poemId.trim()) {
    return Promise.reject(createError('BAD_REQUEST', '缺少诗词 ID'))
  }
  if (!AI_IMAGE_STYLES.some((s) => s.value === style)) {
    style = 'ink'
  }
  return API_BASE ? requestRemote({ poemId, style }, signal) : requestMock({ poemId, style })
}

async function requestRemote(body, signal) {
  const controller = signal ? null : new AbortController()
  const timeout = controller
    ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    : null
  try {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: signal || controller.signal,
    })
    let data = null
    try {
      data = await res.json()
    } catch {
      /* 非 JSON 响应按网络错误处理 */
    }
    if (!res.ok || !data || data.ok !== true) {
      throw createError(
        (data && data.error) || `HTTP_${res.status}`,
        (data && data.message) || `服务返回异常（HTTP ${res.status}）`,
      )
    }
    if (typeof data.imageUrl !== 'string' || !data.imageUrl) {
      throw createError('UPSTREAM_ERROR', '服务未返回图片地址')
    }
    return {
      imageUrl: data.imageUrl,
      prompt: String(data.prompt ?? ''),
      model: String(data.model ?? 'unknown'),
    }
  } catch (err) {
    if (err && err.code) throw err
    if (err && err.name === 'AbortError') {
      throw createError('TIMEOUT', '生成超时，请稍后重试')
    }
    throw createError('NETWORK', '网络异常，无法连接生成服务')
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function requestMock({ poemId, style }) {
  const poem = getPoemById(poemId)
  if (!poem) {
    throw createError('BAD_REQUEST', `未找到诗词：${poemId}`)
  }
  const styleLabel = AI_IMAGE_STYLES.find((s) => s.value === style)?.label ?? '水墨写意'
  const lines = (poem.content ?? []).slice(0, 2).join('，')
  const prompt = `${styleLabel}风格，中国古典意境：${lines || poem.title}。留白构图，诗意悠远。`
  const imageUrl = buildPlaceholderImage(poem, styleLabel)
  await sleep(1600 + Math.random() * 900)
  return { imageUrl, prompt, model: 'mock-placeholder' }
}

/** 演示模式占位图：内联 SVG，不依赖任何网络与素材文件 */
function buildPlaceholderImage(poem, styleLabel) {
  const title = escapeXml(poem.title ?? '诗')
  const author = escapeXml(`${poem.dynasty ?? ''} · ${poem.author ?? ''}`)
  const line = escapeXml((poem.content ?? [])[0] ?? '')
  const bg = styleLabel === '工笔重彩' ? '#f3e2c3' : '#f6f4ec'
  const ink = styleLabel === '摄影写实' ? '#3c4a42' : '#4c5a50'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="512" viewBox="0 0 768 512">
  <rect width="768" height="512" fill="${bg}"/>
  <rect x="24" y="24" width="720" height="464" fill="none" stroke="${ink}" stroke-opacity="0.35" stroke-width="2"/>
  <circle cx="560" cy="150" r="90" fill="${ink}" fill-opacity="0.10"/>
  <path d="M60 420 Q 250 330 420 400 T 700 360" fill="none" stroke="${ink}" stroke-opacity="0.30" stroke-width="3"/>
  <text x="384" y="225" text-anchor="middle" font-family="Kaiti SC, KaiTi, STKaiti, serif" font-size="44" fill="${ink}">${title}</text>
  <text x="384" y="285" text-anchor="middle" font-family="Kaiti SC, KaiTi, STKaiti, serif" font-size="20" fill="${ink}" fill-opacity="0.75">${line}</text>
  <text x="384" y="330" text-anchor="middle" font-family="Kaiti SC, KaiTi, STKaiti, serif" font-size="15" fill="${ink}" fill-opacity="0.55">${author}</text>
  <text x="384" y="465" text-anchor="middle" font-family="sans-serif" font-size="13" fill="${ink}" fill-opacity="0.45">演示模式占位图 · AI 诗画</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** 随机挑一首适合演示的诗词（首屏“换一首”按钮用） */
export function pickRandomPoemId() {
  const [poem] = getRandomPoems(1)
  return poem ? poem.id : ''
}

function createError(code, message) {
  const err = new Error(message)
  err.code = code
  return err
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c],
  )
}
