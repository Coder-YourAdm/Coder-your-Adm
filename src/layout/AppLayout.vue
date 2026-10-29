<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplayStore } from '../stores/display'
import { getRandomPoems } from '../api/poems'

const route = useRoute()
const router = useRouter()
const displayStore = useDisplayStore()

// 注意：搜索结果页 SearchView 读取的是 route.query.kw，
// 参数名必须统一为 kw（此前误用 q 导致顶栏搜索永远查不到结果）
const searchQuery = ref(typeof route.query.kw === 'string' ? route.query.kw : '')
const showSuggestions = ref(false)
let hideTimer = null

// 推荐搜索：每次进入应用随机取 5 条名句作为搜索建议
const suggestions = ref([])
function buildSuggestions() {
  suggestions.value = getRandomPoems(5).map((p) => {
    const raw = (p.content && p.content[0]) || p.title
    return {
      id: p.id,
      query: raw,
      display: raw.length > 16 ? `${raw.slice(0, 16)}…` : raw,
      hint: `${p.dynasty}·${p.author}`,
    }
  })
}
buildSuggestions()

const tabs = [
  { label: '首页', to: '/', icon: 'home' },
  { label: '分类', to: '/category', icon: 'category' },
  { label: '游戏', to: '/game', icon: 'game' },
  { label: '我的', to: '/profile', icon: 'profile' },
]

watch(
  () => route.query.kw,
  (query) => {
    searchQuery.value = typeof query === 'string' ? query : ''
  },
)

function isActive(path) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}

function submitSearch() {
  const kw = searchQuery.value.trim()
  if (!kw) return
  showSuggestions.value = false
  router.push({ path: '/search', query: { kw } })
}

function onSearchFocus() {
  clearTimeout(hideTimer)
  showSuggestions.value = true
}

function onSearchBlur() {
  // 延迟收起，给建议项的 mousedown 留出触发时间
  hideTimer = setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

function applySuggestion(item) {
  searchQuery.value = item.query
  submitSearch()
}
</script>

<template>
  <div
    class="app-layout"
    :data-theme="displayStore.theme"
    :data-font="displayStore.poemFont"
    :data-font-size="displayStore.fontSize"
  >
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="诗韵首页">
        <span class="brand-mark" aria-hidden="true">韵</span>
        <span class="brand-copy">
          <span class="brand-name">诗韵</span>
          <span class="brand-caption">在诗词里，遇见中国</span>
        </span>
      </RouterLink>

      <form class="search-form" role="search" @submit.prevent="submitSearch">
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 4.2 4.2" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          aria-label="搜索诗词、作者或名句"
          placeholder="搜索诗词、作者或名句"
          @focus="onSearchFocus"
          @blur="onSearchBlur"
        />
        <button class="search-submit" type="submit">搜索</button>

        <div v-if="showSuggestions && suggestions.length" class="search-suggestions">
          <p class="suggestions-title">推荐搜索</p>
          <ul>
            <li v-for="item in suggestions" :key="item.id">
              <button
                type="button"
                class="suggestion-item"
                @mousedown.prevent="applySuggestion(item)"
              >
                <span class="suggestion-text">{{ item.display }}</span>
                <span class="suggestion-hint">{{ item.hint }}</span>
              </button>
            </li>
          </ul>
        </div>
      </form>
    </header>

    <main class="page-content">
      <RouterView />
    </main>

    <nav class="bottom-nav" aria-label="主导航">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        class="nav-tab"
        :class="{ active: isActive(tab.to) }"
        :to="tab.to"
      >
        <svg
          v-if="tab.icon === 'home'"
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="m3.5 10.5 8.5-7 8.5 7v9a1 1 0 0 1-1 1h-5.2v-6h-4.6v6H4.5a1 1 0 0 1-1-1v-9Z" />
        </svg>
        <svg
          v-else-if="tab.icon === 'category'"
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
        <svg
          v-else-if="tab.icon === 'game'"
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M8.2 8h7.6a4.7 4.7 0 0 1 4.6 3.8l.7 3.6a2.4 2.4 0 0 1-4 2.2l-2-1.8H8.9l-2 1.8a2.4 2.4 0 0 1-4-2.2l.7-3.6A4.7 4.7 0 0 1 8.2 8Z" />
          <path d="M8 10.5v4M6 12.5h4m5-1h.01m2 2h.01" />
        </svg>
        <svg
          v-else
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        </svg>
        <span>{{ tab.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.app-layout {
  --layout-surface: #fffefa;
  --layout-muted: #898b80;
  --layout-border: rgba(47, 63, 49, 0.11);
  --layout-accent: var(--accent, #65846c);
  --layout-text: var(--text, #28382e);
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  color: var(--layout-text);
  background: transparent;
  position: relative;
  isolation: isolate;
}

/* 中间雾面背景：边缘渐隐，内容保持清晰 */
.app-layout::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;

  background:
    radial-gradient(
      ellipse at 82% 0%,
      rgba(213, 225, 202, 0.2),
      transparent 38rem
    ),
    color-mix(
      in srgb,
      var(--bg, #f7f7f2) 58%,
      transparent
    );

  -webkit-backdrop-filter: blur(10px) saturate(108%);
  backdrop-filter: blur(10px) saturate(108%);

  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    #000 12%,
    #000 88%,
    transparent 100%
  );

  mask-image: linear-gradient(
    to right,
    transparent 0%,
    #000 12%,
    #000 88%,
    transparent 100%
  );
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  width: min(100% - 3rem, 1120px);
  margin: 0 auto;
  padding: 1.35rem 0;
  border-bottom: 1px solid var(--layout-border);
  /* 保证搜索建议下拉能盖住下方页面内容 */
  position: relative;
  z-index: 5;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: inherit;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-mark {
  display: grid;
  width: 2.8rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--layout-accent) 35%, transparent);
  border-radius: 50% 50% 46% 46%;
  color: var(--layout-accent);
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 1.45rem;
}

.brand-copy {
  display: grid;
  gap: 0.1rem;
}

.brand-name {
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.2;
}

.brand-caption {
  color: var(--layout-muted);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}

.search-form {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: min(100%, 370px);
  padding: 0.35rem 0.4rem 0.35rem 0.9rem;
  border: 1px solid var(--layout-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--layout-surface) 85%, transparent);
  transition: border-color 160ms ease, box-shadow 160ms ease;
  position: relative;
}

.search-suggestions {
  position: absolute;
  top: calc(100% + 0.45rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.55rem 0.4rem 0.4rem;
  border: 1px solid var(--layout-border);
  border-radius: 0.9rem;
  background: var(--layout-surface, #fffefa);
  box-shadow: 0 10px 28px rgba(47, 63, 49, 0.16);
  z-index: 30;
}

.suggestions-title {
  margin: 0 0 0.3rem;
  padding: 0 0.7rem;
  color: var(--layout-muted);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}

.search-suggestions ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 0;
  border-radius: 0.6rem;
  background: transparent;
  color: var(--layout-text);
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  text-align: left;
}

.suggestion-item:hover {
  background: color-mix(in srgb, var(--layout-accent) 10%, transparent);
}

.suggestion-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-hint {
  flex: 0 0 auto;
  color: var(--layout-muted);
  font-size: 0.72rem;
}

.search-form:focus-within {
  border-color: color-mix(in srgb, var(--layout-accent) 55%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--layout-accent) 12%, transparent);
}

.search-icon {
  width: 1.1rem;
  flex: 0 0 auto;
  stroke: var(--layout-muted);
  stroke-width: 1.7;
}

.search-form input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  color: var(--layout-text);
  background: transparent;
  font: inherit;
  font-size: 0.85rem;
}

.search-form input::placeholder {
  color: #a3a49a;
}

.search-submit {
  padding: 0.52rem 0.9rem;
  border: 0;
  border-radius: 999px;
  color: white;
  background: var(--layout-accent);
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  transition: filter 160ms ease;
}

.search-submit:hover {
  filter: brightness(0.92);
}

.page-content {
  width: min(100% - 3rem, 1040px);
  flex: 1;
  margin: 0 auto;
  padding: clamp(2rem, 5vw, 4rem) 0;
}

.bottom-nav {
  position: sticky;
  z-index: 2;
  bottom: 0;
  display: flex;
  justify-content: center;
  gap: clamp(1.4rem, 8vw, 6.5rem);
  padding: 0.75rem 1rem max(0.75rem, env(safe-area-inset-bottom));
  border-top: 1px solid var(--layout-border);
  background: color-mix(in srgb, var(--layout-surface) 92%, transparent);
  backdrop-filter: blur(16px);
}

.nav-tab {
  display: grid;
  min-width: 4rem;
  justify-items: center;
  gap: 0.25rem;
  color: var(--layout-muted);
  font-size: 0.72rem;
  text-decoration: none;
  transition: color 160ms ease, transform 160ms ease;
}

.nav-tab:hover {
  color: var(--layout-text);
}

.nav-tab.active {
  color: var(--layout-accent);
  font-weight: 650;
}

.tab-icon {
  width: 1.35rem;
  height: 1.35rem;
  stroke: currentColor;
  stroke-width: 1.55;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-tab.active .tab-icon {
  stroke-width: 1.9;
}

@media (max-width: 600px) {
  .site-header {
    width: calc(100% - 2rem);
    align-items: flex-start;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0;
  }

  .search-form {
    width: 100%;
    box-sizing: border-box;
  }

  .page-content {
    width: calc(100% - 2rem);
    padding: 2rem 0 2.5rem;
  }

  .bottom-nav {
    justify-content: space-around;
    gap: 0.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
