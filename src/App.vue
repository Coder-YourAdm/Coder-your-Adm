<script setup>
import { useDisplayStore } from './stores/display'

// 初始化全局主题和字体状态
useDisplayStore()
</script>

<template>
  <router-view />
</template>