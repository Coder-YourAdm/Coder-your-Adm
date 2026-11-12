<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  getAllAuthors,
  getAllDynasties,
  getAllForms,
  getAllThemes,
  getPoemsByFilters,
} from '../api/poems'

const router = useRouter()

// 参与顶部筛选的维度（作者维度不进筛选栏，只保留卡片直达）
const DIMENSIONS = [
  { key: 'dynasty', label: '朝代' },
  { key: 'form', label: '体裁' },
  { key: 'theme', label: '主题' },
]

// 当前生效的筛选条件，空串代表该维度未选；维度之间取「且」
const filters = ref({ dynasty: '', form: '', theme: '' })

const hasFilter = computed(() => DIMENSIONS.some((d) => Boolean(filters.value[d.key])))

// 下拉选项的数量与卡片组同一套逻辑：在「排除自身维度」的其余条件下统计。
// 已选「唐」后，体裁下拉显示的就是唐代内部各体裁的数量，随筛选实时联动。
const options = computed(() =>
  DIMENSIONS.reduce((acc, dim) => {
    const values =
      dim.key === 'dynasty'
        ? getAllDynasties()
        : dim.key === 'form'
          ? getAllForms()
          : getAllThemes()

    const others = { ...filters.value }
    delete others[dim.key]

    acc[dim.key] = values
      .filter((v) => typeof v === 'string' && v.trim())
      .map((v) => ({ value: v, count: getPoemsByFilters({ ...others, [dim.key]: v }).length }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'zh'))
    return acc
  }, {}),
)

const GROUPS_META = [
  { type: 'dynasty', title: '按朝代', description: '循着历史长河，品读各朝风雅' },
  { type: 'form', title: '按体裁', description: '从诗词曲赋中，感受体式之别' },
  { type: 'theme', title: '按主题', description: '从诗意主题中，遇见心之所向' },
  { type: 'author', title: '按作者', description: '走近诗人词家的生平与作品' },
]

function valuesOf(type) {
  if (type === 'dynasty') return getAllDynasties()
  if (type === 'form') return getAllForms()
  if (type === 'theme') return getAllThemes()
  return getAllAuthors()
}

// 导航卡片：数量在「排除自身维度」的其余条件下统计。
// 这样选中「唐」后，朝代卡片仍展示全部朝代供切换，
// 而体裁 / 主题卡片显示的是唐代内部的分布，形成多维度联动。
const groups = computed(() =>
  GROUPS_META.map((meta) => {
    const others = { ...filters.value }
    delete others[meta.type]

    return {
      ...meta,
      entries: valuesOf(meta.type)
        .filter((v) => typeof v === 'string' && v.trim())
        .map((value) => ({
          value,
          count: getPoemsByFilters({ ...others, [meta.type]: value }).length,
        }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'zh')),
    }
  }),
)

const resultCount = computed(() => getPoemsByFilters(filters.value).length)

// 只把非空条件拼进 query，避免 URL 上挂一串空参数
function toQuery(condition) {
  const query = {}
  for (const key of ['dynasty', 'form', 'theme', 'author']) {
    const value = String(condition[key] ?? '').trim()
    if (value) query[key] = value
  }
  return query
}

function openCategory(type, value) {
  router.push({
    name: 'categoryList',
    params: { type },
    query: toQuery({ ...filters.value, [type]: value }),
  })
}

function viewResults() {
  router.push({
    name: 'categoryList',
    params: { type: 'all' },
    query: toQuery(filters.value),
  })
}

function resetFilters() {
  filters.value = { dynasty: '', form: '', theme: '' }
}
</script>

<template>
  <div class="category-page">
    <header class="page-heading">
      <p class="eyebrow">探索诗词</p>
      <h1>诗词分类</h1>
      <p>以朝代、体裁、主题或作者为引，发现诗词之美。</p>
    </header>

    <section class="filter-bar" aria-label="多维度筛选">
      <div class="filter-fields">
        <label v-for="dim in DIMENSIONS" :key="dim.key" class="filter-field">
          <span class="filter-label">{{ dim.label }}</span>
          <select v-model="filters[dim.key]" :aria-label="`按${dim.label}筛选`">
            <option value="">全部{{ dim.label }}</option>
            <option v-for="opt in options[dim.key]" :key="opt.value" :value="opt.value">
              {{ opt.value }}（{{ opt.count }}）
            </option>
          </select>
        </label>
      </div>

      <div class="filter-actions">
        <p class="filter-summary">
          <template v-if="hasFilter">
            当前条件命中 <strong>{{ resultCount }}</strong> 首
          </template>
          <template v-else>
            共 <strong>{{ resultCount }}</strong> 首诗词，选择条件即可组合筛选
          </template>
        </p>
        <div class="filter-buttons">
          <button v-if="hasFilter" class="ghost-btn" type="button" @click="resetFilters">
            重置
          </button>
          <button
            class="primary-btn"
            type="button"
            :disabled="!resultCount"
            @click="viewResults"
          >
            查看这 {{ resultCount }} 首
          </button>
        </div>
      </div>
    </section>

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
          :class="{
            'is-active': filters[group.type] === entry.value,
            'is-empty': entry.count === 0,
          }"
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
  margin-bottom: 2.5rem;
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

/* ---------- 多维度筛选栏 ---------- */
.filter-bar {
  margin-bottom: 2.75rem;
  padding: 1.15rem 1.35rem;
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 18%, transparent);
  border-radius: 1rem;
  background: var(--card-surface, #fffefa);
}

.filter-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
  gap: 0.85rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-label {
  color: var(--muted, #777b70);
  font-size: 0.78rem;
}

.filter-field select {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--layout-border, #e3e6dd);
  border-radius: 0.6rem;
  background: var(--layout-surface, #fff);
  color: var(--text, #28382e);
  font-size: 0.9rem;
  cursor: pointer;
}

.filter-field select:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent, #65846c) 45%, transparent);
  outline-offset: 1px;
}

.filter-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  margin-top: 1rem;
  padding-top: 0.9rem;
  border-top: 1px dashed color-mix(in srgb, var(--accent, #65846c) 20%, transparent);
}

.filter-summary {
  margin: 0;
  color: var(--muted, #777b70);
  font-size: 0.86rem;
}

.filter-summary strong {
  color: var(--accent, #65846c);
  font-size: 1.05rem;
}

.filter-buttons {
  display: flex;
  gap: 0.6rem;
}

.primary-btn,
.ghost-btn {
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  font-size: 0.86rem;
  cursor: pointer;
  transition: opacity 160ms ease, background 160ms ease;
}

.primary-btn {
  border: none;
  background: var(--accent, #65846c);
  color: #fff;
}

.primary-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ghost-btn {
  border: 1px solid var(--layout-border, #e3e6dd);
  background: transparent;
  color: var(--muted, #777b70);
}

.ghost-btn:hover {
  background: color-mix(in srgb, var(--accent, #65846c) 8%, transparent);
}

/* ---------- 导航卡片 ---------- */
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

/* 当前已选中的筛选值 */
.category-card.is-active {
  border-color: var(--accent, #65846c);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent, #65846c) 22%, transparent);
}

/* 在当前组合下无作品，弱化但仍可点击，方便切换条件 */
.category-card.is-empty {
  opacity: 0.5;
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
