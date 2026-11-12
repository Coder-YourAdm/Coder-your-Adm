<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getPoemAudio, getPoemById } from '../api/poems'
import { useFavoritesStore } from '../stores/favorites'

const route = useRoute()
const favorites = useFavoritesStore()
const poem = computed(() => getPoemById(String(route.params.id || '')))
const audioUnavailable = ref(false)
const isFavorite = computed(() => poem.value ? favorites.has(poem.value.id) : false)

const poemLines = computed(() => {
  const content = poem.value?.content
  if (Array.isArray(content)) return content.filter((line) => String(line).trim())
  if (typeof content === 'string') return content.split(/\r?\n/).filter((line) => line.trim())
  return []
})

const detailSections = computed(() => {
  if (!poem.value) return []
  return [
    { key: 'translation', title: '译文' },
    { key: 'notes', title: '注释' },
    { key: 'background', title: '创作背景' },
    { key: 'analysis', title: '作品赏析' },
    { key: 'appreciation', title: '艺术赏析' },
    { key: 'artisticConcept', title: '意境解读' },
  ].filter(({ key }) => hasContent(poem.value[key]))
})

const audioSrc = computed(() => {
  if (!poem.value) return ''
  const path = getPoemAudio(poem.value.id)
  return path ? `${import.meta.env.BASE_URL}${path}` : ''
})

watch(
  () => route.params.id,
  () => {
    audioUnavailable.value = false
  },
)

function hasContent(value) {
  if (Array.isArray(value)) return value.some((item) => String(item).trim())
  return typeof value === 'string' && Boolean(value.trim())
}

function readableText(value) {
  return Array.isArray(value) ? value.join('\n') : value
}

function toggleFavorite() {
  if (poem.value) favorites.toggle(poem.value.id)
}
</script>

<template>
  <article v-if="poem" class="poem-detail">
    <RouterLink class="back-link" :to="{ name: 'home' }">返回首页</RouterLink>

    <header class="poem-header">
      <p class="eyebrow">诗词详情</p>
      <h1>{{ poem.title }}</h1>
      <div class="poem-meta">
        <span v-if="poem.author">{{ poem.author }}</span>
        <span v-if="poem.dynasty" class="meta-badge">{{ poem.dynasty }}</span>
        <span v-if="poem.form" class="meta-badge">{{ poem.form }}</span>
      </div>
      <div v-if="hasContent(poem.theme) || (Array.isArray(poem.tags) && poem.tags.length)" class="poem-tags">
        <span v-if="hasContent(poem.theme)" class="poem-tag">{{ poem.theme }}</span>
        <span v-for="tag in poem.tags" :key="tag" class="poem-tag">{{ tag }}</span>
      </div>
      <button
        class="favorite-button"
        :class="{ active: isFavorite }"
        type="button"
        :aria-pressed="isFavorite"
        @click="toggleFavorite"
      >
        {{ isFavorite ? '★ 已收藏' : '☆ 收藏' }}
      </button>
    </header>

    <section class="poem-body" aria-label="诗词正文">
      <p v-for="(line, index) in poemLines" :key="index">{{ line }}</p>
      <p v-if="!poemLines.length" class="muted">暂无正文内容</p>
    </section>

    <section v-if="audioSrc && !audioUnavailable" class="audio-section" aria-label="诗词朗读">
      <h2>诗词朗读</h2>
      <audio controls preload="none" :src="audioSrc" @error="audioUnavailable = true">
        您的浏览器不支持音频播放。
      </audio>
    </section>
    <p v-else class="audio-unavailable" role="status">暂无朗读音频</p>

    <section v-if="detailSections.length" class="details-list" aria-label="诗词解读">
      <details v-for="section in detailSections" :key="section.key" class="detail-section">
        <summary>{{ section.title }}</summary>
        <p>{{ readableText(poem[section.key]) }}</p>
      </details>
    </section>
  </article>

  <section v-else class="not-found" role="status">
    <p class="eyebrow">未找到诗词</p>
    <h1>这首诗暂时不在诗库中</h1>
    <RouterLink class="back-link" :to="{ name: 'home' }">返回首页</RouterLink>
  </section>
</template>

<style scoped>
.poem-detail,
.not-found {
  width: min(100%, 760px);
  margin: 0 auto;
}

.back-link {
  display: inline-flex;
  margin-bottom: 1.5rem;
  color: var(--accent, #65846c);
  font-size: 0.9rem;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.poem-header {
  padding: clamp(1.5rem, 5vw, 3rem);
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 16%, transparent);
  border-radius: 1.25rem;
  background: var(--card-surface, #fffefa);
  text-align: center;
}

.eyebrow {
  margin: 0 0 0.65rem;
  color: var(--accent, #65846c);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
}

h1 {
  margin: 0;
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: clamp(1.8rem, 5vw, 2.7rem);
  line-height: 1.45;
}

.poem-meta,
.poem-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  margin-top: 1rem;
  color: var(--muted, #777b70);
  font-size: 0.85rem;
}

.favorite-button {
  margin-top: 1rem;
  padding: 0.55rem 1rem;
  border: 1px solid var(--accent, #65846c);
  border-radius: 999px;
  color: var(--accent, #65846c);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
}

.favorite-button.active {
  color: #fff;
  background: var(--accent, #65846c);
}

.meta-badge,
.poem-tag {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  color: var(--accent, #65846c);
  background: color-mix(in srgb, var(--accent, #65846c) 10%, transparent);
}

.poem-body {
  margin: 1.25rem 0;
  padding: clamp(1.5rem, 5vw, 2.5rem);
  border-radius: 1.25rem;
  background: var(--card-surface, #fffefa);
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: var(--poem-font-size, 22px);
  line-height: 2;
  text-align: center;
}

.poem-body p {
  margin: 0.15rem 0;
}

.muted,
.audio-unavailable {
  color: var(--muted, #777b70);
}

.audio-section,
.details-list {
  margin-top: 1.25rem;
}

.audio-section h2 {
  margin: 0 0 0.7rem;
  font-size: 1rem;
}

.audio-section audio {
  width: 100%;
}

.audio-unavailable {
  margin: 1.25rem 0;
  padding: 1rem 1.2rem;
  border-radius: 0.9rem;
  background: var(--card-surface, #fffefa);
  font-size: 0.9rem;
}

.detail-section {
  margin-top: 0.7rem;
  padding: 1rem 1.2rem;
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 14%, transparent);
  border-radius: 0.9rem;
  background: var(--card-surface, #fffefa);
}

.detail-section summary {
  color: var(--text, #28382e);
  cursor: pointer;
  font-weight: 650;
}

.detail-section p {
  margin: 0.85rem 0 0;
  color: var(--text, #28382e);
  line-height: 1.9;
  white-space: pre-line;
}
</style>