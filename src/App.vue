<script setup>
import { useDisplayStore } from './stores/display'
import AppLayout from './layout/AppLayout.vue'

// 初始化全局主题和字体状态
useDisplayStore()
</script>

<template>
  <AppLayout />
</template>
