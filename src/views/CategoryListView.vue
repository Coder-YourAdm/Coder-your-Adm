<template>
  <div class="category-page">
    <div class="header">
      <h2>
        <template v-if="chips.length">
          <span
            v-for="chip in chips"
            :key="chip.key"
            class="chip"
          >
            {{ chip.label }}：<span class="highlight">{{ chip.value }}</span>
            <button
              class="chip-remove"
              type="button"
              :aria-label="`移除${chip.label}条件`"
              @click="removeChip(chip.key)"
            >
              ×
            </button>
          </span>
        </template>
        <template v-else>全部分类</template>
      </h2>
      <p>共 {{ total }} 首</p>
    </div>

    <!-- 诗词列表区 -->
    <div v-if="poems.length > 0" class="poem-grid">
      <PoemCard
        v-for="poem in poems"
        :key="poem.id"
        :id="poem.id"
        :title="poem.title"
        :author="poem.author"
        :dynasty="poem.dynasty"
        :excerpt="poem.content ? poem.content[0] : ''"
        :tags="poem.tags"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>该分类下暂无诗词数据。</p>
    </div>

    <!-- 分页控制区（只有当总页数大于 1 时才显示） -->
    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
      <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
      <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPoemsByFilters } from '@/api/poems'
import PoemCard from '@/components/PoemCard.vue'

const route = useRoute()
const router = useRouter()

const pageSize = 9 // 每页 9 首，三列网格下正好 3 行
const currentPage = ref(Number(route.query.page) || 1)

const LABELS = { dynasty: '朝代', form: '体裁', theme: '主题', author: '作者' }

// 同时兼容两种链接形式：
//   新版（组合筛选）：/category/all?dynasty=唐&form=诗
//   旧版（单维度）  ：/category/dynasty?value=唐
const filters = computed(() => {
  const q = route.query
  const legacyType = route.params.type === 'all' ? '' : String(route.params.type ?? '')
  const pick = (key) =>
    String(q[key] ?? '').trim() || (legacyType === key ? String(q.value ?? '').trim() : '')

  return {
    dynasty: pick('dynasty'),
    form: pick('form'),
    theme: pick('theme'),
    author: pick('author'),
  }
})

const chips = computed(() =>
  Object.entries(filters.value)
    .filter(([, value]) => value)
    .map(([key, value]) => ({ key, label: LABELS[key], value })),
)

const allFiltered = computed(() => getPoemsByFilters(filters.value))
const total = computed(() => allFiltered.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const poems = computed(() => {
  // 页码越界时钳回合法范围，避免手动改 URL 出现空白列表
  const page = Math.min(Math.max(currentPage.value, 1), totalPages.value)
  const start = (page - 1) * pageSize
  return allFiltered.value.slice(start, start + pageSize)
})

// URL 变化或结果集大小变化时，同步并校正当前页码
watch(
  [() => route.fullPath, totalPages],
  () => {
    const page = Number(route.query.page) || 1
    currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
  },
  { immediate: true },
)

function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  router.push({ query: { ...route.query, page } })
}

// 移除某个筛选条件，保留其余条件并回到第 1 页
function removeChip(key) {
  const query = { ...route.query }
  delete query[key]
  delete query.page
  // 旧式链接的条件挂在 value 上，需要一并清掉
  if (route.params.type === key) delete query.value
  router.push({ params: route.params, query })
}
</script>

<style scoped>
.category-page {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.header {
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
.header h2 {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.highlight {
  color: #5aa56a;
  font-weight: bold;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid #d8e4da;
  border-radius: 999px;
  background: #f4f8f4;
  font-size: 0.9rem;
  font-weight: 400;
}
.chip-remove {
  border: none;
  background: transparent;
  color: #8a9088;
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
}
.chip-remove:hover {
  color: #5aa56a;
}
.poem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
.empty-state {
  text-align: center;
  padding: 50px 0;
  color: #999;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}
.pagination button {
  padding: 8px 16px;
  background-color: #5aa56a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.pagination button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
