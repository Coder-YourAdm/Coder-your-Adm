
<script setup>
import { RouterLink } from 'vue-router'
import { usePoemHistoryStore } from '@/stores/poemHistory'

const historyStore = usePoemHistoryStore()

// 格式化浏览时间
function formatVisitedAt(timestamp) {
  const date = new Date(timestamp)

  if (!Number.isFinite(date.getTime())) return ''

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const pad = (value) => String(value).padStart(2, '0')
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`

  if (date.toDateString() === now.toDateString()) {
    return `今天 ${time}`
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${time}`
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${time}`
}

// 清空浏览历史前进行确认
function clearHistory() {
  if (
    window.confirm('确定要清空全部浏览历史吗？此操作不可恢复。')
  ) {
    historyStore.clearHistory()
  }
}
</script>

<template>
  <main class="history-page">
    <header class="page-header">
      <h1>我的足迹</h1>
      <p class="sub">记录每一次诗词相遇，随时回顾读过的作品。</p>
    </header>

    <!-- 浏览历史统计 -->
    <section v-if="historyStore.count" class="history-summary">
      <div class="sum-item">
        <span class="sum-num">{{ historyStore.count }}</span>
        <span class="sum-label">浏览诗词</span>
      </div>

      <span class="summary-tip">最近访问的诗词显示在最前面</span>

      <button
        class="clear-btn"
        type="button"
        @click="clearHistory"
      >
        清空历史
      </button>
    </section>

    <!-- 浏览历史列表 -->
    <section v-if="historyStore.list.length" class="history-list">
      <RouterLink
        v-for="poem in historyStore.list"
        :key="poem.id"
        class="history-item"
        :to="{ name: 'poem', params: { id: poem.id } }"
        :aria-label="`回看诗词：${poem.title}`"
      >
        <span class="history-main">
          <strong class="history-title">{{ poem.title }}</strong>
          <span class="history-meta">
            {{ poem.author || '佚名' }}
            <span v-if="poem.dynasty">· {{ poem.dynasty }}</span>
          </span>
        </span>

        <span class="history-side">
          <span class="history-time">
            {{ formatVisitedAt(poem.visitedAt) }}
          </span>
          <span class="history-review">回看 ›</span>
        </span>
      </RouterLink>
    </section>

    <!-- 空状态 -->
    <section v-else class="history-empty">
      <p class="empty-title">还没有浏览足迹</p>
      <p class="empty-hint">
        去探索几首喜欢的诗词吧，每一次阅读都会被记录下来。
      </p>
      <RouterLink class="go-home" :to="{ name: 'home' }">
        去品读诗词 ›
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.history-page {
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
  color: var(--text, #28382e);
}

.sub {
  margin: 0;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}

.history-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem 1.4rem;
  margin-bottom: 1.4rem;
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
  color: var(--accent, #65846c);
  font-size: 1.6rem;
  font-weight: 700;
}

.sum-label {
  color: var(--text-secondary, #718071);
  font-size: 0.75rem;
}

.summary-tip {
  flex: 1;
  color: var(--text-secondary, #718071);
  font-size: 0.82rem;
}

.clear-btn {
  padding: 0.6rem 1.1rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.2));
  border-radius: 999px;
  color: var(--text, #28382e);
  background: transparent;
  font: inherit;
  font-size: 0.85rem;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 160ms ease, color 160ms ease;
}

.clear-btn:hover {
  border-color: #c0392b;
  color: #c0392b;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.05rem 1.25rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 1rem;
  color: var(--text, #28382e);
  background: var(--card-surface, #fffefa);
  box-shadow: 0 4px 16px rgba(39, 52, 40, 0.04);
  text-decoration: none;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(39, 52, 40, 0.09);
}

.history-item:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--accent, #65846c) 45%, transparent);
  outline-offset: 3px;
}

.history-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.35rem;
}

.history-title {
  overflow: hidden;
  color: var(--text, #28382e);
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-meta {
  color: var(--text-secondary, #718071);
  font-size: 0.82rem;
}

.history-side {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
}

.history-time {
  color: var(--text-secondary, #999);
  font-size: 0.75rem;
}

.history-review {
  color: var(--accent, #65846c);
  font-size: 0.85rem;
  font-weight: 600;
}

.history-empty {
  display: flex;
  min-height: 14rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  padding: 2rem 1.25rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 1.35rem;
  background: var(--card-surface, rgba(255, 254, 250, 0.78));
  text-align: center;
}

.empty-title {
  margin: 0;
  color: var(--text, #28382e);
  font-size: 1.1rem;
  font-weight: 600;
}

.empty-hint {
  max-width: 24rem;
  margin: 0;
  color: var(--text-secondary, #718071);
  font-size: 0.92rem;
  line-height: 1.6;
}

.go-home {
  margin-top: 0.4rem;
  color: var(--accent, #65846c);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 600px) {
  .history-summary {
    flex-wrap: wrap;
  }

  .summary-tip {
    flex-basis: 100%;
    order: 1;
  }

  .history-item {
    padding: 0.9rem 1rem;
    gap: 0.6rem;
  }

  .history-time {
    font-size: 0.68rem;
  }
}
</style>
