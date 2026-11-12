<template>
  <div class="baike-card">
    <div class="baike-icon">📖</div>
    <div class="baike-content">
      <h3>想要了解更多？</h3>
      <p>去百度百科查看《{{ title }}》的详尽解析</p>
    </div>
    <a :href="baikeUrl" target="_blank" rel="noopener noreferrer" class="baike-btn">
      前往百科
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  }
})

// 动态拼接百度百科的搜索链接
const baikeUrl = computed(() => {
  // 用诗名作为搜索关键词，并进行 URL 编码，防止特殊字符导致链接失效
  const keyword = encodeURIComponent(props.title)
  return `https://baike.baidu.com/search/word?word=${keyword}`
})
</script>

<style scoped>
.baike-card {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 16px 20px;
  margin: 20px 0;
  transition: box-shadow 0.3s ease;
}

.baike-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.baike-icon {
  font-size: 32px;
  margin-right: 16px;
}

.baike-content {
  flex: 1;
}

.baike-content h3 {
  margin: 0 0 6px 0;
  font-size: 16px;
  color: #333;
}

.baike-content p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.baike-btn {
  background: #2b6cb0; /* 百度百科的品牌蓝 */
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s ease;
  white-space: nowrap;
}

.baike-btn:hover {
  background: #1a4971;
}
</style>