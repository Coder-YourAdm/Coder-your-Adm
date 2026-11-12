
<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useFavoritesStore } from '@/stores/favorites'
import PoemCard from '@/components/PoemCard.vue'

const favorites = useFavoritesStore()

const poems = computed(() => favorites.list)
const totalCount = computed(() => favorites.count)

// 获取诗词正文摘要
function excerptOf(poem) {
  const content = poem.content

  if (Array.isArray(content)) {
    return content.slice(0, 2).join(' ')
  }

  if (typeof content === 'string') {
    return content.split(/\r?\n/).slice(0, 2).join(' ')
  }

  return ''
}
</script>

<template>
  <main class="favorites-page">
    <header class="page-header">
      <h1>我的收藏</h1>
      <p class="sub">收藏喜欢的诗词，让每一份心动都值得再次品读。</p>
    </header>

    <!-- 收藏统计 -->
    <section v-if="totalCount" class="favorites-summary">
      <div class="sum-item">
        <span class="sum-num">{{ totalCount }}</span>
        <span class="sum-label">珍藏诗词</span>
      </div>
      <span class="summary-tip">点击诗词卡片即可再次品读</span>
    </section>

    <!-- 收藏诗词列表 -->
    <section v-if="poems.length" class="poem-grid">
      <PoemCard
        v-for="poem in poems"
        :key="poem.id"
        :id="poem.id"
        :title="poem.title || '未命名诗词'"
        :author="poem.author || '佚名'"
        :dynasty="poem.dynasty || '未知'"
        :excerpt="excerptOf(poem)"
        :tags="poem.tags || []"
      />
    </section>

    <!-- 空状态 -->
    <section v-else class="favorites-empty">
      <p class="empty-title">还没有收藏的诗词</p>
      <p class="empty-hint">
        遇见喜欢的诗词时，点击详情页的收藏按钮，把它们留在这里吧。
      </p>
      <RouterLink class="go-category" :to="{ name: 'category' }">
        去探索诗词 ›
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.favorites-page {
  width: min(100%, 900px);
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.8rem;
}

.page-header h1 {
  margin: 0 0 0.4rem;
  color: var(--text, #28382e);
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.9rem;
}

.sub {
  margin: 0;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
  line-height: 1.6;
}

.favorites-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem 1.4rem;
  margin-bottom: 1.5rem;
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
  margin-left: auto;
  color: var(--text-secondary, #718071);
  font-size: 0.82rem;
}

.poem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.favorites-empty {
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
  max-width: 25rem;
  margin: 0;
  color: var(--text-secondary, #718071);
  font-size: 0.92rem;
  line-height: 1.7;
}

.go-category {
  margin-top: 0.4rem;
  color: var(--accent, #65846c);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 600px) {
  .favorites-summary {
    flex-wrap: wrap;
  }

  .summary-tip {
    flex-basis: 100%;
    margin-left: 0;
  }

  .poem-grid {
    grid-template-columns: 1fr;
  }
}
</style>
