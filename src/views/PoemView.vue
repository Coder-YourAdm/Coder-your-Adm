<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPoemById, getPoemAudio } from '@/api/poems'
import { useFavoritesStore } from '@/stores/favorites'

const route = useRoute()
const router = useRouter()
const favorites = useFavoritesStore()

const poem = computed(() => getPoemById(route.params.id))
const audioSrc = computed(() => (poem.value ? getPoemAudio(poem.value.id) : ''))
const audioMissing = ref(false)
const audioEl = ref(null)

const isFav = computed(() =>
  poem.value ? favorites.has(poem.value.id) : false,
)

// 可选长文区块：字段为空则不渲染
const blocks = computed(() => {
  if (!poem.value) return []
  const p = poem.value
  return [
    { key: 'translation', label: '译文', value: p.translation },
    { key: 'notes', label: '注释', value: p.notes },
    { key: 'background', label: '创作背景', value: p.background },
    { key: 'analysis', label: '赏析', value: p.analysis },
    { key: 'appreciation', label: '鉴赏', value: p.appreciation },
    { key: 'artisticConcept', label: '艺术特色', value: p.artisticConcept },
  ].filter((b) => b.value && String(b.value).trim())
})

function toggleFav() {
  if (poem.value) favorites.toggle(poem.value.id)
}

function playAudio() {
  audioMissing.value = false
  const el = audioEl.value
  if (!el) return
  el.play().catch(() => {
    audioMissing.value = true
  })
}
</script>

<template>
  <main v-if="poem" class="poem-page">
    <button class="back-btn" type="button" @click="router.back()">‹ 返回</button>

    <header class="poem-head">
      <h1 class="poem-title">{{ poem.title }}</h1>
      <div class="poem-meta">
        <span class="badge">{{ poem.dynasty }}</span>
        <span class="poem-author">{{ poem.author }}</span>
        <span v-if="poem.form" class="badge outline">{{ poem.form }}</span>
      </div>

      <div class="poem-actions">
        <button class="act-btn" type="button" @click="playAudio">🔊 朗读</button>
        <button
          class="act-btn"
          :class="{ active: isFav }"
          type="button"
          @click="toggleFav"
        >
          {{ isFav ? '★ 已收藏' : '☆ 收藏' }}
        </button>
      </div>
      <audio
        ref="audioEl"
        :src="audioSrc"
        preload="none"
        hidden
        @error="audioMissing = true"
      ></audio>
      <p v-if="audioMissing" class="audio-tip">暂无朗读音频</p>
    </header>

    <section class="poem-content">
      <p v-for="(line, i) in poem.content" :key="i" class="poem-line">{{ line }}</p>
    </section>

    <div v-if="poem.tags && poem.tags.length" class="poem-tags">
      <span v-for="t in poem.tags" :key="t" class="poem-tag">{{ t }}</span>
    </div>

    <section v-for="b in blocks" :key="b.key" class="poem-block">
      <details open>
        <summary>{{ b.label }}</summary>
        <p class="block-text">{{ b.value }}</p>
      </details>
    </section>

    <p v-if="!blocks.length" class="no-extra">本诗暂无详细注解。</p>
  </main>

  <main v-else class="poem-empty">
    <p>未找到该诗词。</p>
    <RouterLink to="/" class="back-link">返回首页</RouterLink>
  </main>
</template>

<style scoped>
.poem-page {
  width: min(100%, 720px);
  margin: 0 auto;
}
.back-btn {
  border: 0;
  background: transparent;
  color: var(--accent, #65846c);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1rem;
}
.poem-head {
  border-bottom: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  padding-bottom: 1.2rem;
  margin-bottom: 1.6rem;
}
.poem-title {
  margin: 0 0 0.8rem;
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 2rem;
  font-weight: 700;
}
.poem-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.badge {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: var(--accent, #65846c);
  color: #fff;
  font-size: 0.78rem;
}
.badge.outline {
  background: transparent;
  color: var(--accent, #65846c);
  border: 1px solid var(--accent, #65846c);
}
.poem-author {
  color: var(--accent, #65846c);
  font-size: 0.95rem;
}
.poem-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 1.2rem;
}
.act-btn {
  padding: 0.6rem 1.1rem;
  border: 1px solid var(--accent, #65846c);
  border-radius: 999px;
  background: transparent;
  color: var(--accent, #65846c);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 160ms ease;
}
.act-btn.active {
  background: var(--accent, #65846c);
  color: #fff;
}
.audio-tip {
  margin: 0.6rem 0 0;
  color: var(--text-secondary, #718071);
  font-size: 0.85rem;
}
.poem-content {
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
}
.poem-line {
  margin: 0 0 0.9rem;
  font-size: 1.25rem;
  line-height: 1.9;
  letter-spacing: 0.05em;
  color: var(--text, #28382e);
  text-align: center;
}
.poem-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 1.4rem 0;
}
.poem-tag {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  color: var(--accent, #65846c);
  background: rgba(101, 132, 108, 0.1);
  font-size: 0.75rem;
}
.poem-block {
  margin-bottom: 0.8rem;
}
.poem-block details {
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 0.8rem;
  background: var(--card-surface, #fffefa);
  padding: 0.4rem 1rem;
}
.poem-block summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--accent, #65846c);
  padding: 0.5rem 0;
}
.block-text {
  margin: 0.4rem 0 0.8rem;
  line-height: 1.9;
  color: var(--text, #28382e);
}
.no-extra {
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}
.poem-empty {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-secondary, #718071);
}
.back-link {
  color: var(--accent, #65846c);
}
</style>
