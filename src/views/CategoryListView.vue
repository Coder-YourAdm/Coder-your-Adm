<template>
  <div class="category-page">
    <div class="header">
      <h2>{{ title }}：<span class="highlight">{{ value }}</span></h2>
      <p>共 {{ total }} 首</p>
    </div>

    <!-- 诗词列表区 -->
    <div v-if="poems.length > 0" class="poem-grid">
      <PoemCard 
        v-for="poem in poems" 
        :key="poem.id"
        :title="poem.title"
        :author="poem.author"
        :dynasty="poem.dynasty"
        :excerpt="poem.content ? poem.content[0] : ''"
        :tags="poem.tags"
        @open="$router.push('/poem/' + poem.id)"
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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// 引入徐潇写的分页函数和分类筛选函数
import { getPagedPoems, getByDynasty, getByTheme, getByAuthor } from '@/api/poems'
import PoemCard from '@/components/PoemCard.vue'

const route = useRoute()
const router = useRouter()

// 变量定义
const poems = ref([])
const total = ref(0)
const totalPages = ref(0)
const currentPage = ref(Number(route.query.page) || 1)
const pageSize = 9// 每页 10 首

const title = ref('分类')
const value = ref('')

// 核心逻辑：获取数据
const fetchData = () => {
  const type = route.params.type // 比如 'dynasty', 'theme', 'author'
  value.value = route.query.value || '' // 比如 '唐', '婉约', '李白'

  // 1. 先根据分类拿到所有符合条件的数据
  let allFiltered = []
  if (type === 'dynasty') {
    title.value = '朝代'
    allFiltered = getByDynasty(value.value)
  } else if (type === 'theme') {
    title.value = '主题'
    allFiltered = getByTheme(value.value)
  } else if (type === 'author') {
    title.value = '作者'
    allFiltered = getByAuthor(value.value)
  }

  // 2. 手动做本地分页（因为徐潇的 getPagedPoems 是针对全部数据的，这里我们根据分类结果自己切）
  total.value = allFiltered.length
  totalPages.value = Math.ceil(total.value / pageSize)
  
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  poems.value = allFiltered.slice(start, end)
}

// 翻页逻辑
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  // 把页码同步到网址上，方便刷新
  router.push({ query: { ...route.query, page } })
  fetchData()
}

onMounted(fetchData)
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
.highlight {
  color: #5aa56a;
  font-weight: bold;
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