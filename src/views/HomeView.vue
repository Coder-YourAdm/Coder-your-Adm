<template>
  <div class="home-page">
    <!-- 顶部搜索栏 -->
    <div class="search-box">
      <input 
        v-model="keyword" 
        @keyup.enter="goSearch" 
        placeholder="搜索诗词、作者、朝代..." 
        class="search-input"
      />
      <button @click="goSearch" class="search-btn">搜索</button>
    </div>

    <!-- 推荐诗词网格 -->
    <div class="recommend-section">
      <h2 class="section-title">✨ 为你推荐</h2>
      <div class="poem-grid">
        <PoemCard 
          v-for="poem in recommendPoems" 
          :key="poem.id"
          :id="poem.id"
          :title="poem.title"
          :author="poem.author"
          :dynasty="poem.dynasty"
          :excerpt="poem.content ? poem.content[0] : ''"
          :tags="poem.tags"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRandomPoems } from '@/api/poems'
import PoemCard from '@/components/PoemCard.vue'

const router = useRouter()
const keyword = ref('')
const recommendPoems = ref([])

// 初始化推荐诗词
onMounted(() => {
  recommendPoems.value = getRandomPoems(9)
})

// 搜索跳转逻辑
const goSearch = () => {
  const kw = keyword.value.trim()
  if (kw) {
    router.push({ path: '/search', query: { kw } })
  }
}
</script>

<style scoped>
.home-page {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}
.search-input {
  flex: 1;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  outline: none;
}
.search-input:focus {
  border-color: #5aa56a;
}
.search-btn {
  padding: 12px 24px;
  background-color: #5aa56a;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.section-title {
  font-size: 20px;
  margin-bottom: 20px;
  color: #333;
}
.poem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
</style>