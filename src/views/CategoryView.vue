<script setup>
import { getAllAuthors, getAllDynasties, getAllThemes, getByAuthor, getByDynasty, getByTheme } from '../api/poems'
import { useRouter } from 'vue-router'

const router = useRouter()

function buildEntries(values, getPoems) {
  return values
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => ({
      value,
      count: getPoems(value).length,
    }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'zh'))
}

const groups = [
  {
    type: 'dynasty',
    title: '按朝代',
    description: '循着历史长河，品读各朝风雅',
    entries: buildEntries(getAllDynasties(), getByDynasty),
  },
  {
    type: 'theme',
    title: '按主题',
    description: '从诗意主题中，遇见心之所向',
    entries: buildEntries(getAllThemes(), getByTheme),
  },
  {
    type: 'author',
    title: '按作者',
    description: '走近诗人词家的生平与作品',
    entries: buildEntries(getAllAuthors(), getByAuthor),
  },
]

function openCategory(type, value) {
  router.push({
    name: 'categoryList',
    params: { type },
    query: { value },
  })
}
</script>

<template>
  <div class="category-page">
    <header class="page-heading">
      <p class="eyebrow">探索诗词</p>
      <h1>诗词分类</h1>
      <p>以朝代、主题或作者为引，发现诗词之美。</p>
    </header>

    <section v-for="group in groups" :key="group.type" class="category-group">
      <div class="group-heading">
        <div>
          <h2>{{ group.title }}</h2>
          <p>{{ group.description }}</p>
        </div>
        <span class="group-count">{{ group.entries.length }} 项</span>
      </div>

      <div v-if="group.entries.length" class="category-grid">
        <button
          v-for="entry in group.entries"
          :key="entry.value"
          class="category-card"
          type="button"
          @click="openCategory(group.type, entry.value)"
        >
          <span class="category-name">{{ entry.value }}</span>
          <span class="poem-count">{{ entry.count }} 首作品</span>
          <span class="card-arrow" aria-hidden="true">→</span>
        </button>
      </div>
      <p v-else class="empty-state">暂无可浏览的分类。</p>
    </section>
  </div>
</template>

<style scoped>
.category-page {
  width: min(100%, 1040px);
  margin: 0 auto;
}

.page-heading {
  margin-bottom: 3rem;
  text-align: center;
}

.eyebrow {
  margin: 0 0 0.55rem;
  color: var(--accent, #65846c);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
}

h1,
h2,
p {
  margin-top: 0;
}

.page-heading h1 {
  margin-bottom: 0.5rem;
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: clamp(2rem, 5vw, 2.8rem);
}

.page-heading > p:last-child,
.group-heading p {
  margin-bottom: 0;
  color: var(--muted, #777b70);
  font-size: 0.9rem;
}

.category-group + .category-group {
  margin-top: 2.75rem;
}

.group-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.group-heading h2 {
  margin-bottom: 0.3rem;
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 1.45rem;
}

.group-count {
  color: var(--muted, #777b70);
  font-size: 0.8rem;
  white-space: nowrap;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 190px), 1fr));
  gap: 0.85rem;
}

.category-card {
  position: relative;
  display: flex;
  min-height: 6.5rem;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.45rem;
  padding: 1.15rem 2.7rem 1.15rem 1.25rem;
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 15%, transparent);
  border-radius: 1rem;
  color: var(--text, #28382e);
  background: var(--card-surface, #fffefa);
  text-align: left;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.category-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent, #65846c) 40%, transparent);
  box-shadow: 0 10px 24px rgba(39, 52, 40, 0.08);
}

.category-card:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--accent, #65846c) 45%, transparent);
  outline-offset: 3px;
}

.category-name {
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 1.08rem;
  font-weight: 700;
}

.poem-count {
  color: var(--muted, #777b70);
  font-size: 0.78rem;
}

.card-arrow {
  position: absolute;
  top: 50%;
  right: 1rem;
  color: var(--accent, #65846c);
  font-size: 1.2rem;
  transform: translateY(-50%);
}

.empty-state {
  padding: 1.2rem;
  border-radius: 0.9rem;
  color: var(--muted, #777b70);
  background: var(--card-surface, #fffefa);
}

@media (prefers-reduced-motion: reduce) {
  .category-card {
    transition: none;
  }
}
</style>