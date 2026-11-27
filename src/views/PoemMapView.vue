<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { getAllPoems } from '@/api/poems'

const router = useRouter()
const poems = getAllPoems()

// ---- 朝代主题配色（仿古地图的淡雅分色，低饱和以配水墨背景）----
const DYNASTY_COLORS = {
  '全部':    { land: '#e7ecdf', deep: '#cdd8c6', accent: '#5a7a63' },
  '先秦':    { land: '#ece7d8', deep: '#d8cfb7', accent: '#8a7c55' },
  '汉':      { land: '#e9e4d4', deep: '#d4c9ad', accent: '#8a7449' },
  '三国':    { land: '#e3e8e6', deep: '#c6d3cf', accent: '#4f756e' },
  '西晋':    { land: '#e6e9df', deep: '#ccd7c4', accent: '#617a54' },
  '东晋':    { land: '#e2ebe4', deep: '#c5d8c8', accent: '#4e7a5c' },
  '南朝':    { land: '#e6ece1', deep: '#cbd9c0', accent: '#5c7a4b' },
  '北朝':    { land: '#ece5df', deep: '#d9c9bd', accent: '#8a6a55' },
  '隋':      { land: '#e8e6d6', deep: '#d2cdb0', accent: '#7a7547' },
  '唐':      { land: '#efe6d3', deep: '#ddcba8', accent: '#8a6f3c' },
  '五代':    { land: '#e8e5e0', deep: '#d0c9c1', accent: '#756a5e' },
  '宋':      { land: '#e4ebe6', deep: '#c5d6c9', accent: '#4c7660' },
  '元':      { land: '#e8e4ec', deep: '#cec6d9', accent: '#6d5e83' },
  '明':      { land: '#ece3d8', deep: '#d7c3ad', accent: '#8a6547' },
  '清':      { land: '#e6e0e6', deep: '#cbbecb', accent: '#725b72' },
}
const palette = computed(() => DYNASTY_COLORS[selectedDynasty.value] || DYNASTY_COLORS['全部'])

// ---- 筛选 ----
const selectedDynasty = ref('全部')
const selectedTheme = ref('全部')
const searchQuery = ref('')

const dynasties = computed(() =>
  ['全部', ...new Set(poems.map((p) => p.dynasty).filter(Boolean))]
    .sort((a, b) => (a === '全部' ? -1 : b === '全部' ? 1 : a.localeCompare(b, 'zh-Hans-CN'))),
)
const themes = computed(() =>
  ['全部', ...new Set(poems.map((p) => p.theme).filter(Boolean))]
    .sort((a, b) => (a === '全部' ? -1 : b === '全部' ? 1 : a.localeCompare(b, 'zh-Hans-CN'))),
)

function hasLocation(poem) {
  const l = poem.location
  return l && Number.isFinite(Number(l.latitude)) && Number.isFinite(Number(l.longitude))
}

const filteredPoems = computed(() => {
  const kw = searchQuery.value.trim()
  return poems.filter((p) => {
    if (!hasLocation(p)) return false
    if (selectedDynasty.value !== '全部' && p.dynasty !== selectedDynasty.value) return false
    if (selectedTheme.value !== '全部' && p.theme !== selectedTheme.value) return false
    if (kw && !(`${p.title}${p.author}${p.location.ancientName || ''}${p.location.modernName || ''}`.includes(kw))) return false
    return true
  })
})

// ---- 地点聚类：same ancientName+modernName 合并成一个点位 ----
const placeGroups = computed(() => {
  const map = new Map()
  for (const p of filteredPoems.value) {
    const l = p.location
    const key = `${l.ancientName || ''}|${l.modernName || ''}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        ancientName: l.ancientName || l.modernName,
        modernName: l.modernName || '',
        latitude: Number(l.latitude),
        longitude: Number(l.longitude),
        poems: [],
      })
    }
    map.get(key).poems.push(p)
  }
  return [...map.values()]
})

// 经纬度 -> SVG 坐标（中国范围近似线性投影）
function project(lat, lng) {
  return {
    x: 28 + ((lng - 73) / 62) * 584,
    y: 18 + ((54 - lat) / 36) * 424,
  }
}
const basePoints = computed(() =>
  placeGroups.value.map((g) => ({ ...g, ...project(g.latitude, g.longitude) })),
)

// ---- 视图变换：支持滚轮缩放 + 拖拽平移 ----
const BASE = { x: 0, y: 0, w: 640, h: 460 }
const view = ref({ ...BASE })
const scale = computed(() => BASE.w / view.value.w)
const zoomPct = computed(() => Math.round(scale.value * 100))
const activePlace = ref(null)

function clampView(v) {
  // 最多放大 32 倍（viewBox 宽最小 20），缩小回全图
  const w = Math.min(BASE.w, Math.max(20, v.w))
  const h = w * (BASE.h / BASE.w)
  return {
    w,
    h,
    x: Math.min(BASE.w - w, Math.max(0, v.x)),
    y: Math.min(BASE.h - h, Math.max(0, v.y)),
  }
}

// ---- 防重叠布局：屏幕上挨得太近的点螺旋散开，用引线连回真实坐标 ----
// 半径按"屏幕像素"恒定：缩放越大，SVG 单位半径越小，点之间自然分开。
const layoutPoints = computed(() => {
  const s = scale.value                       // 1 = 全图, 越大越放大
  const unit = 1 / s                           // 1 屏幕px 对应的 SVG 单位
  const baseRadius = 9 * unit                  // 标记半径（屏幕恒定 9px）
  const minDist = baseRadius * 2.5             // 触发散开的最小间距
  const placed = []

  //  poetry 多的点优先占住原位，其余点绕开
  const ordered = [...basePoints.value].sort((a, b) => b.poems.length - a.poems.length)
  for (const p of ordered) {
    let dx = 0
    let dy = 0
    let ring = 0
    // 最多尝试若干圈，找不与已放点冲突的位置
    for (ring = 0; ring < 12; ring++) {
      const count = ring === 0 ? 1 : ring * 8
      let found = false
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + ring * 0.4
        const dist = ring === 0 ? 0 : ring * minDist
        const tx = p.x + Math.cos(angle) * dist
        const ty = p.y + Math.sin(angle) * dist
        const collide = placed.some((q) => Math.hypot(q.mx - tx, q.my - ty) < minDist)
        if (!collide) {
          dx = tx - p.x
          dy = ty - p.y
          found = true
          break
        }
      }
      if (found) break
    }
    placed.push({
      ...p,
      mx: p.x + dx,
      my: p.y + dy,
      radius: baseRadius,
      coreRadius: Math.max(1.5, baseRadius * 0.42),
      hasLeader: Math.hypot(dx, dy) > baseRadius * 0.5,
      fontSize: Math.max(5, 9 * unit),
      strokeWidth: Math.max(0.6, 2 * unit),
    })
  }
  return placed
})

function zoomAt(clientX, clientY, factor, svgEl) {
  if (!svgEl) return
  const rect = svgEl.getBoundingClientRect()
  const rx = (clientX - rect.left) / rect.width
  const ry = (clientY - rect.top) / rect.height
  const cur = view.value
  const nx = cur.x + rx * cur.w * (1 - 1 / factor)
  const ny = cur.y + ry * cur.h * (1 - 1 / factor)
  view.value = clampView({ ...cur, x: nx, y: ny, w: cur.w / factor })
}

function onWheel(event) {
  event.preventDefault()
  const factor = event.deltaY < 0 ? 1.18 : 1 / 1.18
  zoomAt(event.clientX, event.clientY, factor, event.currentTarget)
}

function zoomButton(factor) {
  const svg = document.querySelector('.poem-map')
  const rect = svg?.getBoundingClientRect()
  if (!rect) return
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor, svg)
}

function resetView() {
  view.value = { ...BASE }
}

// 拖拽平移
let dragging = false
let dragStart = null
function onPointerDown(event) {
  if (event.button !== 0) return
  dragging = true
  dragStart = { x: event.clientX, y: event.clientY, view: { ...view.value } }
  event.currentTarget.setPointerCapture?.(event.pointerId)
}
function onPointerMove(event) {
  if (!dragging || !dragStart) return
  const rect = event.currentTarget.getBoundingClientRect()
  const dx = ((event.clientX - dragStart.x) / rect.width) * dragStart.view.w
  const dy = ((event.clientY - dragStart.y) / rect.height) * dragStart.view.h
  view.value = clampView({
    ...dragStart.view,
    x: dragStart.view.x - dx,
    y: dragStart.view.y - dy,
  })
}
function onPointerUp() {
  dragging = false
  dragStart = null
}

function selectPlace(group) {
  activePlace.value = group
}

function openPoem(poem) {
  router.push({ name: 'poem', params: { id: poem.id } })
}

// 标记半径随聚类数量变化
function radiusFor(count) {
  return Math.min(16, 6 + Math.log2(count + 1) * 2.2)
}
</script>

<template>
  <main class="map-page">
    <header class="page-heading">
      <p class="eyebrow">游戏 · 山河寻踪</p>
      <h1>诗词地图</h1>
      <p>仿古舆图 · 500 首诗词散落山河。滚轮缩放、拖动平移，点亮一处看遍在此写下的诗。</p>
    </header>

    <section class="map-toolbar">
      <label for="dynasty-select">朝代</label>
      <select id="dynasty-select" v-model="selectedDynasty">
        <option v-for="d in dynasties" :key="d" :value="d">{{ d }}</option>
      </select>
      <label for="theme-select">主题</label>
      <select id="theme-select" v-model="selectedTheme">
        <option v-for="t in themes" :key="t" :value="t">{{ t }}</option>
      </select>
      <input v-model="searchQuery" class="map-search" type="search" placeholder="搜诗词 / 诗人 / 地名" aria-label="搜索诗词地点">
      <span class="map-count">{{ filteredPoems.length }} 首 · {{ placeGroups.length }} 处</span>
    </section>

    <figure class="map-figure">
      <svg
        class="poem-map"
        :viewBox="`${view.x} ${view.y} ${view.w} ${view.h}`"
        role="group"
        aria-label="可缩放拖拽的诗词地点地图"
        @wheel="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <defs>
          <!-- 宣纸纹理：程序化，无外部图片 -->
          <filter id="paper-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="gray" />
            <feComponentTransfer in="gray" result="faded">
              <feFuncA type="linear" slope="0.06" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="faded" mode="multiply" />
          </filter>
          <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6f7a68" stroke-opacity=".13" stroke-width=".6" />
          </pattern>
          <!-- 国土轮廓作为色块裁剪区，保证朝代淡色只在境内渲染 -->
          <clipPath id="china-clip">
            <path d="M34 189 48 169 68 159 84 141 103 131 122 117 151 97 178 91 207 94 231 78 258 83 283 91 312 77 346 84 374 68 409 64 438 77 461 91 490 100 518 95 548 108 578 126 606 139 594 159 574 169 571 191 551 200 536 216 516 223 501 237 512 254 501 277 485 296 474 320 460 338 437 349 421 366 394 373 379 354 360 349 341 360 320 354 301 340 283 333 266 340 248 328 235 310 216 306 199 314 177 305 158 295 139 286 119 279 102 264 86 256 73 240 60 223 44 207Z" />
          </clipPath>
        </defs>

        <!-- 宣纸底 -->
        <rect x="-32" y="-23" width="704" height="506" :fill="palette.land" filter="url(#paper-grain)" />
        <rect x="-32" y="-23" width="704" height="506" fill="url(#map-grid)" />
        <!-- 朝代淡色文化圈（装饰性，不表示精确疆域） -->
        <g clip-path="url(#china-clip)" :opacity="selectedDynasty === '全部' ? 0.35 : 0.6">
          <ellipse cx="360" cy="285" rx="145" ry="115" :fill="palette.deep" opacity=".55" />
          <ellipse cx="440" cy="320" rx="105" ry="95" :fill="palette.deep" opacity=".4" />
          <ellipse cx="270" cy="225" rx="95" ry="80" :fill="palette.deep" opacity=".35" />
        </g>
        <path
          class="china-outline"
          d="M34 189 48 169 68 159 84 141 103 131 122 117 151 97 178 91 207 94 231 78 258 83 283 91 312 77 346 84 374 68 409 64 438 77 461 91 490 100 518 95 548 108 578 126 606 139 594 159 574 169 571 191 551 200 536 216 516 223 501 237 512 254 501 277 485 296 474 320 460 338 437 349 421 366 394 373 379 354 360 349 341 360 320 354 301 340 283 333 266 340 248 328 235 310 216 306 199 314 177 305 158 295 139 286 119 279 102 264 86 256 73 240 60 223 44 207Z"
          :stroke="palette.accent"
        />
        <path class="china-island" d="M470 365c9-7 16 1 13 13-2 10-9 20-14 17-6-4-5-21 1-30Z" :stroke="palette.accent" />
        <path class="china-island" d="M414 393c10-4 18 2 14 9-5 8-20 8-24 2-3-4 3-9 10-11Z" :stroke="palette.accent" />
        <path class="map-river" d="M177 249 228 253 273 265 315 272 357 270 402 268 444 275 480 289" />
        <path class="map-river" d="M202 227 244 230 281 226 315 215 354 218 388 204 427 199" />
        <text class="map-label river-label" x="408" y="286">长江</text>
        <text class="map-label river-label" x="356" y="209">黄河</text>

        <!-- 仿古地图装饰：外框、图名、图例、比例尺、罗盘 -->
        <g class="map-ornament" :stroke="palette.accent">
          <rect x="6" y="6" width="628" height="448" fill="none" stroke-width="1.4" opacity=".5" />
          <rect x="11" y="11" width="618" height="438" fill="none" stroke-width=".5" opacity=".35" />
        </g>
        <g class="map-legend">
          <rect x="24" y="376" width="150" height="66" rx="3" fill="#fffdf5" fill-opacity=".82" :stroke="palette.accent" stroke-opacity=".45" stroke-width=".8" />
          <text x="34" y="393" class="legend-title">诗韵舆图 · 图例</text>
          <circle cx="40" cy="407" r="5" fill="#fffdf5" :stroke="palette.accent" stroke-width="1.6" />
          <text x="52" y="411" class="legend-text">诗词地点（数字为首数）</text>
          <line x1="34" y1="424" x2="66" y2="424" :stroke="palette.accent" stroke-width="1" stroke-dasharray="2 2" />
          <text x="72" y="427" class="legend-text">虚线指向真实位置</text>
        </g>
        <g class="map-compass" :transform="'translate(600,60)'" :stroke="palette.accent">
          <circle r="17" fill="#fffdf5" fill-opacity=".6" stroke-width=".8" />
          <path d="M0 -13 L3 -3 0 0 -3 -3Z" fill="currentColor" stroke="none" />
          <path d="M0 13 L3 3 0 0 -3 3Z" fill="none" stroke-width=".8" />
          <text x="0" y="-21" class="compass-n" text-anchor="middle">北</text>
        </g>
        <g class="map-scale" :transform="'translate(470,430)'" :stroke="palette.accent">
          <line x1="0" y1="0" x2="90" y2="0" stroke-width="1.2" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke-width="1.2" />
          <line x1="45" y1="-3" x2="45" y2="3" stroke-width=".8" />
          <line x1="90" y1="-4" x2="90" y2="4" stroke-width="1.2" />
          <text x="45" y="14" class="scale-text" text-anchor="middle">约 500 公里（示意）</text>
        </g>

        <g
          v-for="group in layoutPoints"
          :key="group.key"
          class="poem-map-point"
          :class="{ active: activePlace?.key === group.key }"
          role="button"
          tabindex="0"
          :aria-label="`${group.ancientName}：${group.poems.length} 首诗，点击查看`"
          @click.stop="selectPlace(group)"
          @keydown.enter.prevent="selectPlace(group)"
          @keydown.space.prevent="selectPlace(group)"
        >
          <title>{{ group.ancientName }} · {{ group.poems.length }} 首诗</title>
          <line
            v-if="group.hasLeader"
            class="point-leader"
            :x1="group.x" :y1="group.y"
            :x2="group.mx" :y2="group.my"
            :stroke-width="Math.max(0.5, 1 * (1 / scale))"
          />
          <circle class="point-anchor" :cx="group.x" :cy="group.y" :r="Math.max(1, 1.6 * (1 / scale))" />
          <circle class="point-halo" :cx="group.mx" :cy="group.my" :r="group.radius" :stroke-width="group.strokeWidth" />
          <circle class="point-core" :cx="group.mx" :cy="group.my" :r="group.coreRadius" />
          <text class="point-count" :x="group.mx" :y="group.my + group.fontSize * 0.35" :font-size="group.fontSize">{{ group.poems.length }}</text>
        </g>
      </svg>

      <div class="zoom-controls">
        <button type="button" aria-label="放大" @click="zoomButton(1.3)">＋</button>
        <span>{{ zoomPct }}%</span>
        <button type="button" aria-label="缩小" @click="zoomButton(1 / 1.3)">－</button>
        <button type="button" aria-label="重置视图" @click="resetView">⟲</button>
      </div>
      <figcaption class="map-caption">滚轮缩放 · 按住拖动 · 点击圆点查看此地诗词</figcaption>
    </figure>

    <!-- 选中地点的诗词列表 -->
    <section v-if="activePlace" class="place-panel" aria-label="地点诗词">
      <header class="place-panel-head">
        <div>
          <p class="eyebrow">{{ activePlace.modernName }}</p>
          <h2>{{ activePlace.ancientName }} · {{ activePlace.poems.length }} 首</h2>
        </div>
        <button type="button" class="place-close" @click="activePlace = null">收起 ✕</button>
      </header>
      <div class="poem-grid">
        <button
          v-for="poem in activePlace.poems"
          :key="poem.id"
          type="button"
          class="poem-chip"
          @click="openPoem(poem)"
        >
          <span class="chip-title">《{{ poem.title }}》</span>
          <span class="chip-meta">{{ poem.dynasty }} · {{ poem.author }}</span>
        </button>
      </div>
    </section>

    <p class="map-attribution-note">
      本图为本地绘制的仿古地理示意（含台湾及南海诸岛轮廓），仅用于文化展示、不作导航；朝代淡色块为装饰性文化圈，不表示精确疆域。地点按诗词文本线索、作者活动地或朝代文化中心推断，坐标为地名附近的约略位置。
    </p>
  </main>
</template>

<style scoped>
.map-page { width: min(100%, 980px); margin: 0 auto; }
.page-heading { margin-bottom: 1.4rem; text-align: center; }
.eyebrow { margin: 0 0 0.5rem; color: var(--accent, #65846c); font-size: 0.75rem; letter-spacing: 0.12em; }
.page-heading h1 { margin: 0 0 0.55rem; font-family: var(--poem-font, "Songti SC", serif); font-size: clamp(2rem, 5vw, 2.6rem); }
.page-heading > p:last-child, .map-attribution-note, .map-caption { color: var(--text-secondary, #718071); font-size: 0.82rem; line-height: 1.7; }

.map-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 0.8rem; color: var(--text-secondary, #718071); font-size: 0.85rem; }
.map-toolbar select, .map-search { padding: 0.55rem 0.7rem; border: 1px solid var(--border, rgba(47,63,49,.18)); border-radius: 0.65rem; color: var(--text, #28382e); background: var(--card-surface, #fffefa); font: inherit; font-size: 0.85rem; }
.map-search { flex: 1; min-width: 12rem; }
.map-count { margin-left: auto; font-weight: 600; }

.map-figure { position: relative; margin: 0; overflow: hidden; border: 1px solid rgba(90,110,85,.32); border-radius: 4px; background: #e9ecdf; box-shadow: inset 0 0 40px rgba(90,80,50,.08), 0 6px 22px rgba(40,56,46,.09); }
.poem-map { display: block; width: 100%; height: clamp(360px, 56vh, 580px); background: #e9ecdf; cursor: grab; touch-action: none; user-select: none; }
.poem-map:active { cursor: grabbing; }
.china-outline { fill: transparent; stroke-width: 1.8; stroke-linejoin: round; }
.china-island { fill: transparent; stroke-width: 1.1; }
.map-river { fill: none; stroke: #8aa9ad; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; opacity: .75; }
.map-label { fill: #5c6b5b; font-family: var(--poem-font, "Songti SC", serif); text-anchor: middle; pointer-events: none; }
.river-label { fill: #5b7f86; font-size: 10px; }
.map-ornament { fill: none; pointer-events: none; }
.legend-title { fill: #4a5c49; font-family: var(--poem-font, "Songti SC", serif); font-size: 11px; font-weight: 700; }
.legend-text { fill: #5c6b5b; font-size: 9px; }
.map-compass, .map-scale { fill: #4a5c49; pointer-events: none; }
.map-compass { color: #5a7a63; }
.compass-n { fill: #4a5c49; font-family: var(--poem-font, "Songti SC", serif); font-size: 10px; }
.scale-text { fill: #5c6b5b; font-size: 8px; }

.poem-map-point { cursor: pointer; outline: none; }
.point-leader { stroke: var(--accent, #65846c); stroke-opacity: .55; stroke-dasharray: 2 2; pointer-events: none; }
.point-anchor { fill: var(--accent, #65846c); fill-opacity: .5; pointer-events: none; }
.point-halo { fill: #fffefa; stroke: var(--accent, #65846c); transition: fill 150ms ease, stroke 150ms ease; }
.point-core { fill: var(--accent, #65846c); pointer-events: none; }
.point-count { fill: var(--accent, #65846c); font-weight: 700; text-anchor: middle; pointer-events: none; }
.poem-map-point:hover .point-halo, .poem-map-point:focus .point-halo, .poem-map-point.active .point-halo { fill: #e7ae6a; stroke: #b9813f; }
.poem-map-point:hover .point-count, .poem-map-point.active .point-count { fill: #7a4e17; }

.zoom-controls { position: absolute; top: 0.8rem; right: 0.8rem; display: flex; align-items: center; gap: 0.3rem; padding: 0.3rem; border: 1px solid var(--border, rgba(47,63,49,.14)); border-radius: 999px; background: rgba(255,254,250,.92); }
.zoom-controls button { width: 1.9rem; height: 1.9rem; border: none; border-radius: 50%; color: var(--accent, #65846c); background: transparent; cursor: pointer; font-size: 1rem; }
.zoom-controls button:hover { background: color-mix(in srgb, var(--accent, #65846c) 14%, transparent); }
.zoom-controls span { min-width: 2.6rem; text-align: center; font-size: 0.75rem; color: var(--text-secondary, #718071); }
.map-caption { margin: 0; padding: 0.65rem 0.9rem; border-top: 1px solid var(--border, rgba(47,63,49,.1)); text-align: center; }

.place-panel { margin-top: 1rem; padding: 1.1rem 1.2rem; border: 1px solid color-mix(in srgb, var(--accent, #65846c) 20%, transparent); border-radius: 1rem; background: var(--card-surface, #fffefa); }
.place-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 0.8rem; }
.place-panel-head h2 { margin: 0; font-family: var(--poem-font, "Songti SC", serif); font-size: 1.25rem; }
.place-close { padding: 0.35rem 0.7rem; border: 1px solid var(--border, rgba(47,63,49,.16)); border-radius: 999px; color: var(--text-secondary, #718071); background: transparent; cursor: pointer; font: inherit; font-size: 0.75rem; }
.poem-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.55rem; max-height: 320px; overflow-y: auto; }
.poem-chip { display: grid; gap: 0.2rem; padding: 0.6rem 0.75rem; border: 1px solid var(--border, rgba(47,63,49,.12)); border-radius: 0.7rem; text-align: left; background: transparent; cursor: pointer; font: inherit; }
.poem-chip:hover { border-color: var(--accent, #65846c); background: color-mix(in srgb, var(--accent, #65846c) 8%, transparent); }
.chip-title { color: var(--text, #28382e); font-family: var(--poem-font, "Songti SC", serif); font-size: 0.92rem; }
.chip-meta { color: var(--text-secondary, #718071); font-size: 0.72rem; }

.map-attribution-note { margin-top: 1rem; }
@media (max-width: 520px) { .map-count { width: 100%; margin-left: 0; } }
</style>
