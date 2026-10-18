<template>
  <div>
    <p>TODO: 首页</p>
    <!-- 数据接入层连通性验证（徐潇 feature/data）：能显示总数即证明 poems.js 接口通 -->
    <p>已加载诗词 {{ total }} 首</p>
  </div>
</template>

<script setup>
import { getAllPoems } from '@/api/poems'

const total = getAllPoems().length
console.log('[HomeView] 已加载诗词总数：', total)
</script>
