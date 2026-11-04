<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useMistakesStore } from '@/stores/mistakes'

const mistakes = useMistakesStore()

const cards = computed(() => mistakes.list)
const totalCount = computed(() => mistakes.totalCount)

function fmtTypes(types) {
  return types.join(' · ')
}
function excerptOf(p) {
  const c = Array.isArray(p.content) ? p.content.join('') : (p.content || '')
  return c
}
function clearAll() {
  if (window.confirm('确定要清空全部背诗卡（错题库）吗？此操作不可恢复。')) {
    mistakes.clear()
  }
}
</script>

<template>
  <main class="study-page">
    <header class="page-header">
      <h1>我的学习</h1>
      <p class="sub">收录你在游戏中答错的诗词，常复习，记得更牢。</p>
    </header>

    <section v-if="cards.length" class="study-summary">
      <div class="sum-item">
        <span class="sum-num">{{ cards.length }}</span>
        <span class="sum-label">薄弱诗词</span>
      </div>
      <div class="sum-item">
        <span class="sum-num">{{ totalCount }}</span>
        <span class="sum-label">累计答错</span>
      </div>
      <button type="button" class="clear-btn" @click="clearAll">清空背诗卡</button>
    </section>

    <section v-if="cards.length" class="study-grid">
      <RouterLink
        v-for="p in cards"
        :key="p.id"
        class="study-card"
        :to="{ name: 'poem', params: { id: p.id } }"
        :aria-label="`复习诗词：${p.title}`"
      >
        <span class="card-heading">
          <span class="poem-title">{{ p.title }}</span>
          <span class="dynasty">{{ p.dynasty }}</span>
        </span>
        <span class="poem-author">{{ p.author }}</span>
        <span class="poem-excerpt">{{ excerptOf(p) }}</span>
        <span class="card-foot">
          <span class="badge">答错 {{ p.mistakeCount }} 次</span>
          <span class="types">{{ fmtTypes(p.mistakeTypes) }}</span>
          <span class="review">复习 ›</span>
        </span>
      </RouterLink>
    </section>

    <section v-else class="study-empty">
      <svg
        viewBox="0 0 24 24"
        width="42"
        height="42"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
      <p class="empty-title">还没有答错的诗词</p>
      <p class="empty-hint">去飞花令或诗词填空里挑战一下，答错的诗句会自动收集到这里。</p>
      <RouterLink class="go-game" :to="{ name: 'game' }">去玩游戏 ›</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.study-page {
  width: min(100%, 760px);
  margin: 0 auto;
}
.page-header {
  margin-bottom: 1.8rem;
}
.page-header h1 {
  margin: 0 0 0.4rem;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.9rem;
}
.sub {
  margin: 0;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}

.study-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem 1.4rem;
  margin-bottom: 1.8rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.14));
  border-radius: 1.1rem;
  background: var(--card-surface, #fffefa);
}
.sum-item {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.sum-num {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent, #65846c);
}
.sum-label {
  font-size: 0.75rem;
  color: var(--text-secondary, #718071);
}
.clear-btn {
  margin-left: auto;
  padding: 0.6rem 1.1rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.2));
  border-radius: 999px;
  background: transparent;
  color: var(--text, #28382e);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 160ms ease, color 160ms ease;
}
.clear-btn:hover {
  border-color: #c0392b;
  color: #c0392b;
}

.study-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.study-card {
  --card-accent: var(--accent, #65846c);
  --card-text: var(--text, #28382e);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 12rem;
  padding: 1.4rem;
  box-sizing: border-box;
  border: 1px solid color-mix(in srgb, var(--card-accent) 16%, transparent);
  border-radius: 1.1rem;
  color: var(--card-text);
  text-decoration: none;
  background:
    radial-gradient(ellipse at 100% 0%, color-mix(in srgb, var(--card-accent) 9%, transparent), transparent 60%),
    var(--card-surface, #fffefa);
  box-shadow: 0 12px 32px rgba(39, 52, 40, 0.045);
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}
.study-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--card-accent) 38%, transparent);
  box-shadow: 0 16px 36px rgba(39, 52, 40, 0.1);
}
.card-heading {
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}
.poem-title {
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.45;
}
.dynasty {
  flex-shrink: 0;
  padding: 0.18rem 0.55rem;
  border: 1px solid color-mix(in srgb, var(--card-accent) 24%, transparent);
  border-radius: 999px;
  color: var(--card-accent);
  font-size: 0.72rem;
}
.poem-author {
  margin-top: 0.25rem;
  color: var(--card-accent);
  font-size: 0.82rem;
}
.poem-excerpt {
  display: -webkit-box;
  margin-top: 1rem;
  overflow: hidden;
  color: color-mix(in srgb, var(--card-text) 82%, transparent);
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 0.92rem;
  line-height: 1.8;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.card-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
  margin-top: auto;
  padding-top: 1rem;
}
.badge {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  color: #c0392b;
  background: rgba(192, 57, 43, 0.1);
  font-size: 0.7rem;
}
.types {
  color: var(--card-accent);
  font-size: 0.72rem;
}
.review {
  margin-left: auto;
  color: var(--card-accent);
  font-size: 0.8rem;
  font-weight: 600;
}

.study-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  min-height: 14rem;
  padding: 2rem 1.25rem;
  border: 1px solid rgba(47, 63, 49, 0.12);
  border-radius: 1.35rem;
  background: rgba(255, 254, 250, 0.78);
  color: rgba(101, 132, 108, 0.75);
  text-align: center;
}
.empty-title {
  margin: 0;
  color: var(--text, #28382e);
  font-size: 1.1rem;
  font-weight: 500;
}
.empty-hint {
  margin: 0;
  max-width: 24rem;
  color: var(--text-secondary, #718071);
  font-size: 0.92rem;
  line-height: 1.6;
}
.go-game {
  margin-top: 0.4rem;
  color: var(--accent, #65846c);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 600px) {
  .study-summary {
    flex-wrap: wrap;
  }
  .clear-btn {
    flex-basis: 100%;
    margin-left: 0;
  }
}
</style>
