<template>
  <div class="profile-page">
    <!-- 1. 用户信息区 -->
    <div class="user-card">
      <div v-if="userStore.isLoggedIn">
        <h2>欢迎你，{{ userStore.username }}</h2>
        <button class="logout-btn" @click="userStore.logout()">退出登录</button>
      </div>
      <div v-else>
        <h2>你还没有登录哦~</h2>
        <button class="login-btn" @click="$router.push('/login')">去登录</button>
      </div>
    </div>

    <!-- 2. 学习统计区 -->
    <div class="stats-card">
      <div class="stat-item">
        <span class="stat-num">{{ favStore.count }}</span>
        <span class="stat-label">已收藏</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">0</span>
        <span class="stat-label">已学诗词</span>
      </div>
    </div>

    <!-- 3. 我的收藏列表 -->
    <h3>❤️ 我的收藏</h3>
    <div v-if="favStore.list.length > 0" class="poem-grid">
      <PoemCard 
        v-for="poem in favStore.list" 
        :key="poem.id"
        :title="poem.title"
        :author="poem.author"
        :dynasty="poem.dynasty"
        :excerpt="poem.content ? poem.content[0] : ''"
        :tags="poem.tags"
        @open="$router.push('/poem/' + poem.id)"
      />
    </div>
    <div v-else class="empty-state">
      <p>暂无收藏，快去探索诗词吧~</p>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useFavoritesStore } from '@/stores/favorites'
import PoemCard from '@/components/PoemCard.vue'

const userStore = useUserStore()
const favStore = useFavoritesStore()
</script>

<style scoped>
.profile-page { padding: 20px; max-width: 1000px; margin: 0 auto; }
.user-card { background: #fff; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.login-btn, .logout-btn { margin-top: 15px; padding: 10px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
.login-btn { background-color: #5aa56a; color: white; }
.logout-btn { background-color: #f0f0f0; color: #333; }
.stats-card { display: flex; gap: 20px; margin-bottom: 30px; }
.stat-item { flex: 1; background: #fff; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.stat-num { display: block; font-size: 24px; font-weight: bold; color: #5aa56a; }
.stat-label { color: #666; font-size: 14px; }
.poem-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.empty-state { text-align: center; padding: 40px; background: #fff; border-radius: 12px; color: #999; }
</style>