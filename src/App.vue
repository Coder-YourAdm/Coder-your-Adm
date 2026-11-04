<script setup>
import { ref, onMounted } from 'vue'
import { useDisplayStore } from './stores/display'
import AppLayout from './layout/AppLayout.vue'

// 初始化全局主题和字体状态（这是张雅萱写的，不能动）
useDisplayStore()

// 控制启动动画的变量
const showSplash = ref(true)

onMounted(() => {
  // 2.5 秒后关闭启动动画
  setTimeout(() => {
    showSplash.value = false
  }, 2500)
})
</script>

<template>
  <!-- 启动动画遮罩层 -->
  <Transition name="splash">
    <div v-if="showSplash" class="splash-screen">
      <div class="splash-content">
        <div class="logo-circle">韵</div>
        <h1 class="splash-title">诗韵</h1>
        <p class="splash-subtitle">在诗词里，遇见中国</p>
      </div>
    </div>
  </Transition>

  <!-- 原本的全局布局壳子（包含四季背景、顶栏、底部导航） -->
  <AppLayout />
</template>

<style>
/* ===== 启动动画样式 ===== */
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.splash-content {
  text-align: center;
  animation: fadeInUp 1.5s ease-out forwards;
}

.logo-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #5aa56a;
  color: white;
  font-size: 40px;
  font-family: var(--poem-font, serif);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 20px rgba(90, 165, 106, 0.3);
}

.splash-title {
  font-size: 36px;
  color: #2c5e36;
  letter-spacing: 8px;
  margin: 0 0 10px 0;
  font-family: var(--poem-font, serif);
}

.splash-subtitle {
  font-size: 16px;
  color: #5aa56a;
  letter-spacing: 2px;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.splash-leave-active {
  transition: opacity 0.8s ease;
}
.splash-leave-to {
  opacity: 0;
}
</style>