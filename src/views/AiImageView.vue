<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  AI_IMAGE_STYLES,
  generatePoemImage,
  isAiImageMockMode,
  pickRandomPoemId,
} from '@/api/aiImage'
import { getPoemById, searchPoems } from '@/api/poems'

const route = useRoute()

// ── 选诗 ──────────────────────────────────────────────
const keyword = ref('')
const searchResults = ref([])
const selectedId = ref('')
const selectedPoem = computed(() => (selectedId.value ? getPoemById(selectedId.value) : null))

function doSearch() {
  const kw = keyword.value.trim()
  searchResults.value = kw ? searchPoems(kw).slice(0, 8) : []
}

function selectPoem(poem) {
  selectedId.value = poem.id
  searchResults.value = []
  keyword.value = ''
}

function pickRandom() {
  selectedId.value = pickRandomPoemId()
}

// 支持从诗词详情页跳转携带 ?poemId=
onMounted(() => {
  const fromQuery = String(route.query.poemId ?? '').trim()
  selectedId.value = fromQuery || pickRandomPoemId()
})

watch(
  () => route.query.poemId,
  (v) => {
    const id = String(v ?? '').trim()
    if (id) selectedId.value = id
  },
)

// ── 风格与生成状态 ────────────────────────────────────
const style = ref('ink')
const loading = ref(false)
const result = ref(null) // { imageUrl, prompt, model }
const error = ref(null) // { code, message }
const lastParams = ref(null)

async function generate() {
  if (!selectedPoem.value || loading.value) return
  loading.value = true
  error.value = null
  result.value = null
  lastParams.value = { poemId: selectedId.value, style: style.value }
  try {
    result.value = await generatePoemImage(lastParams.value)
  } catch (err) {
    error.value = { code: err.code || 'UNKNOWN', message: err.message || '生成失败' }
  } finally {
    loading.value = false
  }
}

async function retry() {
  if (lastParams.value) {
    selectedId.value = lastParams.value.poemId
    style.value = lastParams.value.style
  }
  await generate()
}

const showMockBanner = isAiImageMockMode()
const busyHint = computed(() => {
  const title = selectedPoem.value?.title ?? '诗词'
  return `正在为《${title}》构思画面…`
})
</script>

<template>
  <div class="ai-image-page">
    <header class="page-heading">
      <p class="eyebrow">诗画交融</p>
      <h1>AI 诗画</h1>
      <p>选一首诗，AI 依它的意境，为你生成一幅专属画卷。</p>
    </header>

    <p v-if="showMockBanner" class="mock-banner">
      演示模式：生成服务尚未接入，目前展示本地占位图。后端就绪后配置环境变量即自动切换。
    </p>

    <section class="panel" aria-label="选择诗词">
      <h2 class="panel-title">一 · 选择诗词</h2>

      <div class="search-row">
        <input
          v-model="keyword"
          class="search-input"
          type="search"
          placeholder="搜索标题、作者或诗句…"
          aria-label="搜索诗词"
          @keyup.enter="doSearch"
        />
        <button class="btn ghost" type="button" @click="doSearch">搜索</button>
        <button class="btn ghost" type="button" @click="pickRandom">随机一首</button>
      </div>

      <ul v-if="searchResults.length" class="result-list">
        <li v-for="poem in searchResults" :key="poem.id">
          <button type="button" class="result-item" @click="selectPoem(poem)">
            <span class="result-title">{{ poem.title }}</span>
            <span class="result-meta">{{ poem.dynasty }} · {{ poem.author }}</span>
          </button>
        </li>
      </ul>

      <div v-if="selectedPoem" class="poem-card">
        <p class="poem-title">{{ selectedPoem.title }}</p>
        <p class="poem-meta">{{ selectedPoem.dynasty }} · {{ selectedPoem.author }}</p>
        <p
          v-for="(line, i) in selectedPoem.content.slice(0, 4)"
          :key="i"
          class="poem-line"
        >
          {{ line }}
        </p>
      </div>
    </section>

    <section class="panel" aria-label="选择画面风格">
      <h2 class="panel-title">二 · 画面风格</h2>
      <div class="style-chips" role="radiogroup" aria-label="画面风格">
        <button
          v-for="s in AI_IMAGE_STYLES"
          :key="s.value"
          type="button"
          class="style-chip"
          :class="{ active: style === s.value }"
          role="radio"
          :aria-checked="style === s.value"
          @click="style = s.value"
        >
          {{ s.label }}
        </button>
      </div>
    </section>

    <div class="action-row">
      <button
        class="btn primary"
        type="button"
        :disabled="!selectedPoem || loading"
        @click="generate"
      >
        {{ loading ? '生成中…' : '生成画面' }}
      </button>
    </div>

    <section v-if="loading" class="panel status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <p>{{ busyHint }}</p>
      <p class="hint">真实模式约需 10~30 秒（先写画面描述，再作画）。</p>
    </section>

    <section v-else-if="error" class="panel status error" aria-live="polite">
      <p class="error-title">生成失败（{{ error.code }}）</p>
      <p>{{ error.message }}</p>
      <button class="btn ghost" type="button" @click="retry">重试</button>
    </section>

    <section v-else-if="result" class="panel result" aria-live="polite">
      <img
        class="result-image"
        :src="result.imageUrl"
        :alt="`${selectedPoem ? selectedPoem.title : '诗词'}生成的画面`"
      />
      <div class="result-info">
        <p class="prompt-text">{{ result.prompt || '（服务未返回提示词）' }}</p>
        <div class="result-actions">
          <a class="btn ghost" :href="result.imageUrl" :download="`诗画-${selectedPoem?.title ?? '图'}.png`">保存图片</a>
          <button class="btn ghost" type="button" @click="generate">换一种风格再生成</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ai-image-page {
  width: min(100%, 900px);
  margin: 0 auto;
}

.page-heading {
  margin-bottom: 2.2rem;
  text-align: center;
}

.eyebrow {
  margin: 0 0 0.55rem;
  color: var(--accent, #65846c);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
}

.page-heading h1 {
  margin: 0 0 0.55rem;
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: clamp(2rem, 5vw, 2.8rem);
}

.page-heading > p:last-child {
  margin: 0;
  color: var(--muted, #777b70);
  font-size: 0.9rem;
}

.mock-banner {
  margin: 0 0 1.6rem;
  padding: 0.75rem 1rem;
  border: 1px dashed color-mix(in srgb, var(--accent, #65846c) 40%, transparent);
  border-radius: 0.75rem;
  color: var(--muted, #777b70);
  font-size: 0.82rem;
  text-align: center;
}

.panel {
  margin-bottom: 1.6rem;
  padding: clamp(1.2rem, 4vw, 1.8rem);
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 16%, transparent);
  border-radius: 1.25rem;
  background:
    radial-gradient(ellipse at 100% 0%, color-mix(in srgb, var(--accent, #65846c) 8%, transparent), transparent 65%),
    var(--card-surface, #fffefa);
  box-shadow: 0 12px 32px rgba(39, 52, 40, 0.045);
}

.panel-title {
  margin: 0 0 1rem;
  color: var(--accent, #65846c);
  font-size: 0.95rem;
  font-weight: 650;
  letter-spacing: 0.06em;
}

.search-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 220px;
  padding: 0.7rem 1rem;
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 25%, transparent);
  border-radius: 0.75rem;
  font-size: 0.95rem;
  outline: none;
  background: var(--card-surface, #fffefa);
  color: var(--text, #28382e);
}

.search-input:focus {
  border-color: var(--accent, #65846c);
}

.btn {
  padding: 0.7rem 1.3rem;
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 35%, transparent);
  border-radius: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.btn.ghost {
  background: transparent;
  color: var(--accent, #65846c);
}

.btn.ghost:hover {
  background: color-mix(in srgb, var(--accent, #65846c) 10%, transparent);
}

.btn.primary {
  background: var(--accent, #65846c);
  border-color: var(--accent, #65846c);
  color: #fff;
}

.btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-list {
  margin: 0.9rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.5rem;
}

.result-item {
  display: flex;
  width: 100%;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0.9rem;
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 14%, transparent);
  border-radius: 0.6rem;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.result-item:hover {
  border-color: var(--accent, #65846c);
  background: color-mix(in srgb, var(--accent, #65846c) 6%, transparent);
}

.result-title {
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 1rem;
  color: var(--text, #28382e);
}

.result-meta {
  color: var(--muted, #777b70);
  font-size: 0.8rem;
}

.poem-card {
  margin-top: 1.1rem;
  padding: 1.1rem 1.3rem;
  border-left: 3px solid var(--accent, #65846c);
  border-radius: 0.6rem;
  background: color-mix(in srgb, var(--accent, #65846c) 6%, transparent);
}

.poem-title {
  margin: 0;
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 1.25rem;
  color: var(--text, #28382e);
}

.poem-meta {
  margin: 0.2rem 0 0.6rem;
  color: var(--muted, #777b70);
  font-size: 0.8rem;
}

.poem-line {
  margin: 0.15rem 0;
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 0.95rem;
  color: var(--text, #28382e);
  line-height: 1.9;
}

.style-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.style-chip {
  padding: 0.5rem 1.1rem;
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 30%, transparent);
  border-radius: 999px;
  background: transparent;
  color: var(--muted, #777b70);
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 160ms ease;
}

.style-chip:hover {
  border-color: var(--accent, #65846c);
  color: var(--accent, #65846c);
}

.style-chip.active {
  background: var(--accent, #65846c);
  border-color: var(--accent, #65846c);
  color: #fff;
}

.action-row {
  display: flex;
  justify-content: center;
  margin-bottom: 1.6rem;
}

.status {
  text-align: center;
  color: var(--muted, #777b70);
  font-size: 0.95rem;
}

.status p {
  margin: 0.4rem 0;
}

.status .hint {
  font-size: 0.78rem;
  opacity: 0.8;
}

.error-title {
  color: #a3552d;
  font-weight: 650;
}

.spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid color-mix(in srgb, var(--accent, #65846c) 25%, transparent);
  border-top-color: var(--accent, #65846c);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-image {
  display: block;
  width: 100%;
  max-height: 460px;
  object-fit: contain;
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--accent, #65846c) 5%, transparent);
}

.result-info {
  margin-top: 1rem;
}

.prompt-text {
  margin: 0 0 1rem;
  color: var(--muted, #777b70);
  font-size: 0.85rem;
  line-height: 1.7;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation-duration: 2.4s; }
  .btn, .style-chip, .result-item { transition: none; }
}
</style>
