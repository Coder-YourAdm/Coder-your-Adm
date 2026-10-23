<script setup>
import { useRouter } from 'vue-router'
import {
  getAllDynasties,
  getAllThemes,
  getAllAuthors,
  getByDynasty,
  getByTheme,
  getByAuthor,
} from '@/api/poems'

const router = useRouter()

const dynasties = getAllDynasties().map((d) => ({
  name: d,
  count: getByDynasty(d).length,
}))
const themes = getAllThemes().map((t) => ({
  name: t,
  count: getByTheme(t).length,
}))
const authors = getAllAuthors().map((a) => ({
  name: a,
  count: getByAuthor(a).length,
}))

function go(type, value) {
  router.push({ name: 'categoryList', params: { type }, query: { value } })
}
</script>

<template>
  <main class="category-page">
    <h1 class="cat-title">分类浏览</h1>
    <p class="cat-desc">按朝代、主题或作者，找到你想读的诗。</p>

    <section class="cat-group">
      <h2>按朝代</h2>
      <div class="cat-grid">
        <button
          v-for="d in dynasties"
          :key="d.name"
          class="cat-card"
          type="button"
          @click="go('dynasty', d.name)"
        >
          <span class="cat-name">{{ d.name }}</span>
          <span class="cat-count">{{ d.count }} 首</span>
        </button>
      </div>
    </section>

    <section class="cat-group">
      <h2>按主题</h2>
      <div class="cat-grid">
        <button
          v-for="t in themes"
          :key="t.name"
          class="cat-card"
          type="button"
          @click="go('theme', t.name)"
        >
          <span class="cat-name">{{ t.name }}</span>
          <span class="cat-count">{{ t.count }} 首</span>
        </button>
      </div>
    </section>

    <section class="cat-group">
      <h2>按作者</h2>
      <div class="cat-grid">
        <button
          v-for="a in authors"
          :key="a.name"
          class="cat-card"
          type="button"
          @click="go('author', a.name)"
        >
          <span class="cat-name">{{ a.name }}</span>
          <span class="cat-count">{{ a.count }} 首</span>
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.category-page {
  width: min(100%, 900px);
  margin: 0 auto;
}
.cat-title {
  margin: 0 0 0.3rem;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.9rem;
}
.cat-desc {
  margin: 0 0 2rem;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}
.cat-group {
  margin-bottom: 2.2rem;
}
.cat-group h2 {
  font-size: 1.1rem;
  margin: 0 0 1rem;
  color: var(--text, #28382e);
}
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.8rem;
}
.cat-card {
  display: grid;
  justify-items: center;
  gap: 0.3rem;
  padding: 1.1rem 0.6rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.14));
  border-radius: 1rem;
  background: var(--card-surface, #fffefa);
  cursor: pointer;
  font: inherit;
  transition: all 160ms ease;
}
.cat-card:hover {
  border-color: var(--accent, #65846c);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(39, 52, 40, 0.08);
}
.cat-name {
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.2rem;
  color: var(--text, #28382e);
}
.cat-count {
  font-size: 0.72rem;
  color: var(--accent, #65846c);
}
</style>
