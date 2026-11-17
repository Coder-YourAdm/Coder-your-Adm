<template>
  <div class="home-page">
    
    <!-- 1. 滚动金句区 -->
    <div class="quote-container">
      <Transition name="fade" mode="out-in">
        <div :key="currentQuote" class="quote-box">
          <p class="quote-text">{{ currentQuote }}</p>
        </div>
      </Transition>
    </div>

    <!-- 2. 顶部搜索栏（虽然全局有，但为了防意外，保留你本地的搜索功能） -->
    <div class="search-box">
      <input 
        v-model="keyword" 
        @keyup.enter="goSearch" 
        placeholder="搜索诗词、作者、朝代..." 
        class="search-input"
      />
      <button @click="goSearch" class="search-btn">搜索</button>
    </div>

    <!-- 3. 推荐诗词网格 -->
    <div class="recommend-section">
      <h2 class="section-title">✨ 为你推荐</h2>
      <div class="poem-grid">
        <!-- 适配刘庭彰最新的组件接口：加上了 :id，加上了 @open 跳转 -->
        <PoemCard 
          v-for="poem in recommendPoems" 
          :key="poem.id"
          :id="poem.id"
          :title="poem.title"
          :author="poem.author"
          :dynasty="poem.dynasty"
          :excerpt="poem.content ? poem.content[0] : ''"
          :tags="poem.tags"
          @open="$router.push('/poem/' + poem.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRandomPoems } from '@/api/poems'
import PoemCard from '@/components/PoemCard.vue'

const router = useRouter()
const keyword = ref('')
const recommendPoems = ref([])

// 金句逻辑
const quotes = [
  "大江东去，浪淘尽，千古风流人物。",
  "人生若只如初见，何事秋风悲画扇。",
  "路漫漫其修远兮，吾将上下而求索。",
  "落霞与孤鹜齐飞，秋水共长天一色。"
]
const currentQuote = ref('')
let quoteTimer = null

const changeQuote = () => {
  let newQuote = currentQuote.value
  while (newQuote === currentQuote.value) {
    newQuote = quotes[Math.floor(Math.random() * quotes.length)]
  }
  currentQuote.value = newQuote
}

onMounted(() => {
  // 拉取 9 首推荐
  recommendPoems.value = getRandomPoems(9)
  
  // 开启金句轮播
  changeQuote()
  quoteTimer = setInterval(changeQuote, 5000)
})

onUnmounted(() => {
  if (quoteTimer) clearInterval(quoteTimer)
})

// 搜索跳转
const goSearch = () => {
  const kw = keyword.value.trim()
  if (kw) {
    router.push({ path: '/search', query: { kw } })
  }
}
</script>

<style scoped>
/* 金句区样式 */
.quote-container {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  background: rgba(90, 165, 106, 0.08);
  border-radius: 16px;
  overflow: hidden;
}
.quote-text {
  font-size: 20px;
  color: #5aa56a;
  font-weight: 600;
  font-family: var(--poem-font, serif);
  margin: 0;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.8s ease, transform 0.8s ease; }
.fade-enter-from { opacity: 0; transform: translateY(15px); }
.fade-leave-to { opacity: 0; transform: translateY(-15px); }

/* 原有样式 */
.home-page {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.search-box { display: flex; gap: 10px; margin-bottom: 30px; }
.search-input { flex: 1; padding: 12px; font-size: 16px; border: 1px solid #ccc; border-radius: 8px; outline: none; }
.search-input:focus { border-color: #5aa56a; }
.search-btn { padding: 12px 24px; background-color: #5aa56a; color: white; border: none; border-radius: 8px; cursor: pointer; }
.section-title { font-size: 20px; margin-bottom: 20px; color: #333; }
.poem-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
</style>