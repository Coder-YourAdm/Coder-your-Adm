<template>
  <div class="search-page">
    <!-- 顶部显示搜索的关键词和结果数量 -->
    <div class="search-header">
      <h2>搜索结果：<span class="keyword">{{ keyword }}</span></h2>
      <p class="result-count">共找到 {{ poems.length }} 首相关诗词</p>
    </div>

    <!-- 如果找到了结果（结果数量大于 0） -->
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
    
    <!-- 如果没找到结果（结果数量为 0） -->
    <div v-else class="empty-state">
      <p>未找到相关诗词，换个关键词试试吧~</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
// 引入徐潇写的搜索函数
import { searchPoems } from '@/api/poems'
// 引入刘庭彰写的卡片组件
import PoemCard from '@/components/PoemCard.vue'

const route = useRoute()
const keyword = ref('')
const poems = ref([])

// 核心逻辑：从网址里把关键词拿出来，去搜数据
const doSearch = () => {
  // 比如网址是 /search?kw=月，这里拿到的就是 "月"
  keyword.value = route.query.kw || ''
  
  if (keyword.value) {
    // 如果有词，就调徐潇的接口去搜
    poems.value = searchPoems(keyword.value)
  } else {
    // 如果没词，就是空数组
    poems.value = []
  }
}

// 页面一加载，马上搜一次
onMounted(doSearch)

// 如果用户在别的页面又搜了新词，跳回这个页面时，要重新搜
watch(() => route.query.kw, () => {
  doSearch()
})
</script>

<style scoped>
.search-page {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.search-header {
  margin-bottom: 30px;
}
.keyword {
  color: #5aa56a;
}
.result-count {
  color: #666;
  font-size: 14px;
}
.poem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.empty-state {
  text-align: center;
  padding: 50px 0;
  color: #999;
}
</style>