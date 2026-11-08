<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { getAllPoems } from '@/api/poems'

const router = useRouter()
const poems = getAllPoems()
const selectedDynasty = ref('唐')
const focusLocations = ref(false)

const dynasties = computed(() =>
  [...new Set(poems.map((poem) => poem.dynasty).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)

function isMappable(poem) {
  const location = poem.location
  return location
    && Number.isFinite(Number(location.latitude))
    && Number.isFinite(Number(location.longitude))
    && Math.abs(Number(location.latitude)) <= 90
    && Math.abs(Number(location.longitude)) <= 180
}

const locatedPoems = computed(() =>
  poems.filter((poem) => poem.dynasty === selectedDynasty.value && isMappable(poem)),
)

const basePoints = computed(() =>
  locatedPoems.value.map((poem) => {
    const latitude = Number(poem.location.latitude)
    const longitude = Number(poem.location.longitude)
    const x = 28 + ((longitude - 73) / 62) * 584
    const y = 18 + ((54 - latitude) / 36) * 424
    return { poem, x, y }
  }),
)

const viewBox = computed(() => {
  if (!focusLocations.value || !basePoints.value.length) return '0 0 640 460'

  const xs = basePoints.value.map((point) => point.x)
  const ys = basePoints.value.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  let width = Math.max(140, maxX - minX + 90)
  let height = Math.max(110, maxY - minY + 70)
  const ratio = 640 / 460

  if (width / height < ratio) width = height * ratio
  else height = width / ratio

  const left = Math.max(0, Math.min(640 - width, (minX + maxX - width) / 2))
  const top = Math.max(0, Math.min(460 - height, (minY + maxY - height) / 2))
  return `${left} ${top} ${width} ${height}`
})

const projectedPoems = computed(() => {
  const scale = Number(viewBox.value.split(' ')[2]) / 640
  const separation = 14 * scale
  const offset = 16 * scale
  const displayed = []

  for (const point of basePoints.value) {
    const neighbors = displayed.filter(
      (other) => Math.hypot(other.x - point.x, other.y - point.y) < separation,
    )
    const angle = -Math.PI / 2 + neighbors.length * (Math.PI * 2 / Math.max(3, neighbors.length + 1))
    displayed.push({
      ...point,
      markerX: point.x + (neighbors.length ? Math.cos(angle) * offset : 0),
      markerY: point.y + (neighbors.length ? Math.sin(angle) * offset : 0),
      radius: 7 * scale,
      coreRadius: 3 * scale,
      hasLeader: neighbors.length > 0,
    })
  }
  return displayed
})

function openPoem(poem) {
  if (poem) router.push({ name: 'poem', params: { id: poem.id } })
}

</script>

<template>
  <main class="map-page">
    <header class="page-heading">
      <p class="eyebrow">游戏 · 山河寻踪</p>
      <h1>诗词地图</h1>
      <p>循着有地点依据的诗句，看看诗人笔下的山河。</p>
    </header>

    <section class="map-toolbar">
      <label for="dynasty-select">选择朝代</label>
      <select id="dynasty-select" v-model="selectedDynasty">
        <option v-for="dynasty in dynasties" :key="dynasty" :value="dynasty">
          {{ dynasty }} · {{ poems.filter((poem) => poem.dynasty === dynasty && isMappable(poem)).length }} 处
        </option>
      </select>
      <span class="map-count">已标注 {{ locatedPoems.length }} 首</span>
    </section>

    <figure class="map-figure">
      <svg
        class="poem-map"
        :viewBox="viewBox"
        role="group"
        aria-label="按经纬度标注的诗词地点示意图"
      >
        <defs>
          <pattern id="map-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#718071" stroke-opacity=".14" stroke-width=".7" />
          </pattern>
        </defs>
        <rect x="-32" y="-23" width="704" height="506" fill="#eef2e9" />
        <rect x="-32" y="-23" width="704" height="506" fill="url(#map-grid)" />
        <path
          v-if="!focusLocations"
          class="china-outline"
          d="M34 189 48 169 68 159 84 141 103 131 122 117 151 97 178 91 207 94 231 78 258 83 283 91 312 77 346 84 374 68 409 64 438 77 461 91 490 100 518 95 548 108 578 126 606 139 594 159 574 169 571 191 551 200 536 216 516 223 501 237 512 254 501 277 485 296 474 320 460 338 437 349 421 366 394 373 379 354 360 349 341 360 320 354 301 340 283 333 266 340 248 328 235 310 216 306 199 314 177 305 158 295 139 286 119 279 102 264 86 256 73 240 60 223 44 207Z"
        />
        <g v-if="!focusLocations">
          <path class="china-island" d="M470 365c9-7 16 1 13 13-2 10-9 20-14 17-6-4-5-21 1-30Z" />
          <path class="china-island" d="M414 393c10-4 18 2 14 9-5 8-20 8-24 2-3-4 3-9 10-11Z" />
          <path class="map-river" d="M177 249 228 253 273 265 315 272 357 270 402 268 444 275 480 289" />
          <path class="map-river" d="M202 227 244 230 281 226 315 215 354 218 388 204 427 199" />
          <text class="map-label river-label" x="408" y="286">长江</text>
          <text class="map-label river-label" x="356" y="209">黄河</text>
          <text class="map-label map-title" x="320" y="36">诗词地理 · 中国示意图</text>
          <text class="map-label map-caption" x="320" y="54">点位按经纬度展示 · 非导航地图</text>
        </g>

        <g
          v-for="point in projectedPoems"
          :key="point.poem.id"
          class="poem-map-point"
          role="button"
          tabindex="0"
          :aria-label="`${point.poem.location.ancientName || point.poem.location.modernName}：《${point.poem.title}》，点击查看诗词详情`"
          @click="openPoem(point.poem)"
          @keydown.enter.prevent="openPoem(point.poem)"
          @keydown.space.prevent="openPoem(point.poem)"
        >
          <title>{{ point.poem.location.ancientName }} · 《{{ point.poem.title }}》</title>
          <line
            v-if="point.hasLeader"
            class="point-leader"
            :x1="point.x"
            :y1="point.y"
            :x2="point.markerX"
            :y2="point.markerY"
          />
          <circle class="point-halo" :cx="point.markerX" :cy="point.markerY" :r="point.radius" />
          <circle class="point-core" :cx="point.markerX" :cy="point.markerY" :r="point.coreRadius" />
        </g>
      </svg>
      <figcaption class="map-caption">
        点击地图上的标记或下方诗词卡片，即可打开诗词详情。
      </figcaption>
    </figure>
    <div class="map-controls">
      <button
        type="button"
        :aria-pressed="!focusLocations"
        @click="focusLocations = false"
      >
        中国全图
      </button>
      <button
        type="button"
        :disabled="!locatedPoems.length"
        :aria-pressed="focusLocations"
        @click="focusLocations = true"
      >
        聚焦{{ selectedDynasty }}地点
      </button>
    </div>
    <p class="map-attribution-note">
      中国轮廓为本地绘制的地理示意，不用于导航。诗词地点仅展示有依据的数据；相近标记用引线错开，坐标可能为古地名附近的近似位置。
    </p>

    <section v-if="locatedPoems.length" class="location-list" aria-label="本朝代诗词地点">
      <RouterLink
        v-for="poem in locatedPoems"
        :key="poem.id"
        class="location-card"
        :to="{ name: 'poem', params: { id: poem.id } }"
      >
        <span class="location-place">{{ poem.location.ancientName || poem.location.modernName }}</span>
        <span class="location-title">《{{ poem.title }}》</span>
        <span class="location-author">{{ poem.author }}</span>
      </RouterLink>
    </section>
    <section v-else class="map-empty">
      <strong>{{ selectedDynasty }} · 地点资料正在整理</strong>
      <p>目前没有可核验的地点坐标，不会用猜测位置代替真实标注。</p>
    </section>
  </main>
</template>

<style>
.map-page {
  width: min(100%, 920px);
  margin: 0 auto;
}

.page-heading {
  margin-bottom: 1.6rem;
  text-align: center;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: var(--accent, #65846c);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
}

.page-heading h1 {
  margin: 0 0 0.55rem;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: clamp(2rem, 5vw, 2.6rem);
}

.page-heading > p:last-child,
.map-attribution-note,
.map-caption {
  color: var(--text-secondary, #718071);
  font-size: 0.82rem;
  line-height: 1.7;
}

.map-toolbar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.8rem;
  color: var(--text-secondary, #718071);
  font-size: 0.85rem;
}

.map-toolbar select {
  min-width: 10rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.18));
  border-radius: 0.65rem;
  color: var(--text, #28382e);
  background: var(--card-surface, #fffefa);
  font: inherit;
}

.map-controls {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.7rem;
}

.map-controls button {
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.16));
  border-radius: 999px;
  color: var(--accent, #65846c);
  background: var(--card-surface, #fffefa);
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
}

.map-controls button[aria-pressed="true"] {
  border-color: var(--accent, #65846c);
  color: #fff;
  background: var(--accent, #65846c);
}

.map-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.map-count {
  margin-left: auto;
}

.map-figure {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.14));
  border-radius: 1.15rem;
  background: #eef2e9;
}

.poem-map {
  display: block;
  width: 100%;
  height: clamp(340px, 55vh, 560px);
  background: #eef2e9;
}

.china-outline {
  fill: #dce8d8;
  stroke: #8ca58c;
  stroke-width: 2;
  stroke-linejoin: round;
}

.china-island {
  fill: #dce8d8;
  stroke: #8ca58c;
  stroke-width: 1.3;
}

.map-river {
  fill: none;
  stroke: #8ab1bd;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.8;
}

.map-label {
  fill: #65796b;
  font-family: var(--poem-font, "Songti SC", serif);
  text-anchor: middle;
  pointer-events: none;
}

.river-label {
  fill: #567e89;
  font-size: 10px;
}

.poem-map-point {
  cursor: pointer;
  outline: none;
}

.point-halo {
  fill: #fffefa;
  stroke: var(--accent, #65846c);
  stroke-width: 2;
  transition: r 150ms ease, fill 150ms ease;
}

.point-core {
  fill: var(--accent, #65846c);
}

.point-leader {
  stroke: var(--accent, #65846c);
  stroke-width: 1;
  stroke-dasharray: 2 2;
  opacity: 0.8;
  pointer-events: none;
}

.poem-map-point:hover .point-halo,
.poem-map-point:focus .point-halo {
  fill: #e7ae6a;
}

.map-attribution-note,
.map-caption {
  margin-top: 0.65rem;
}

.map-caption {
  padding: 0.7rem 0.9rem;
  border-top: 1px solid var(--border, rgba(47, 63, 49, 0.1));
}

.location-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 0.7rem;
  margin-top: 1rem;
}

.location-card {
  display: grid;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 0.8rem;
  color: var(--text, #28382e);
  background: var(--card-surface, #fffefa);
  text-decoration: none;
}

.location-card:hover {
  border-color: color-mix(in srgb, var(--accent, #65846c) 45%, transparent);
}

.location-place {
  color: var(--accent, #65846c);
  font-size: 0.72rem;
}

.location-title {
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1rem;
}

.location-author {
  color: var(--text-secondary, #718071);
  font-size: 0.75rem;
}

.map-empty {
  margin-top: 1rem;
  padding: 1.5rem;
  border: 1px dashed var(--border, rgba(47, 63, 49, 0.2));
  border-radius: 0.9rem;
  color: var(--text-secondary, #718071);
  text-align: center;
}

.map-empty strong {
  display: block;
  margin-bottom: 0.45rem;
  color: var(--text, #28382e);
}

.map-empty p {
  font-size: 0.82rem;
  line-height: 1.6;
}

@media (max-width: 520px) {
  .map-toolbar {
    flex-wrap: wrap;
  }

  .map-count {
    width: 100%;
    margin-left: 0;
  }
}
</style>
