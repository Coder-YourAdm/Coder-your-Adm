<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useFavoritesStore } from '@/stores/favorites'
import PoemCard from '@/components/PoemCard.vue'

const router = useRouter()
const user = useUserStore()
const favorites = useFavoritesStore()

const favList = computed(() => favorites.list)

function goPoem(id) {
  router.push({ name: 'poem', params: { id } })
}
function goLogin() {
  router.push({ name: 'login', query: { redirect: '/profile' } })
}
function logout() {
  user.logout()
}
</script>

<template>
  <main class="profile-page">
    <header class="page-header">
      <h1>我的</h1>
    </header>

    <section class="profile-card">
      <template v-if="user.isLoggedIn">
        <div class="user-row">
          <span class="avatar">{{ user.username.slice(0, 1) }}</span>
          <div class="user-info">
            <p class="uname">{{ user.username }}</p>
            <p class="usub">已登录</p>
          </div>
          <button class="logout-btn" type="button" @click="logout">退出</button>
        </div>
      </template>
      <template v-else>
        <div class="login-prompt">
          <p>登录后可收藏喜欢的诗词，记录你的阅读足迹。</p>
          <button class="login-btn" type="button" @click="goLogin">去登录</button>
        </div>
      </template>
    </section>

    <section class="fav-section">
      <h2>我的收藏 <span class="fav-count">{{ favList.length }}</span></h2>
      <div v-if="favList.length" class="fav-grid">
        <PoemCard
          v-for="p in favList"
          :key="p.id"
          :id="p.id"
          :title="p.title"
          :author="p.author"
          :dynasty="p.dynasty"
          :excerpt="p.content.join('')"
          :tags="p.tags || []"
          @open="goPoem"
        />
      </div>
      <p v-else class="fav-empty">
        还没有收藏，去诗词详情页点 ☆ 收藏你喜欢的诗吧。
      </p>
    </section>

    <section class="profile-card setting-entry">
      <div class="entry-info">
        <h2>个性化设置</h2>
        <p>更换四季主题，切换诗词字体。</p>
      </div>
      <button class="setting-button" type="button" @click="router.push('/settings')">
        前往设置 ›
      </button>
    </section>
  </main>
</template>

<style scoped>
.profile-page {
  width: min(100%, 760px);
  margin: 0 auto;
}
.page-header {
  margin-bottom: 1.8rem;
}
.page-header h1 {
  margin: 0;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.9rem;
}
.profile-card {
  padding: 1.4rem 1.6rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.14));
  border-radius: 1.1rem;
  background: var(--card-surface, #fffefa);
  margin-bottom: 1.8rem;
}
.user-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.avatar {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--accent, #65846c);
  color: #fff;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.4rem;
}
.user-info {
  flex: 1;
}
.uname {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text, #28382e);
}
.usub {
  margin: 0.1rem 0 0;
  font-size: 0.8rem;
  color: var(--text-secondary, #718071);
}
.logout-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.2));
  border-radius: 999px;
  background: transparent;
  color: var(--text, #28382e);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}
.login-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.login-prompt p {
  margin: 0;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}
.login-btn {
  flex-shrink: 0;
  padding: 0.6rem 1.2rem;
  border: 0;
  border-radius: 999px;
  background: var(--accent, #65846c);
  color: #fff;
  font: inherit;
  cursor: pointer;
}
.fav-section h2 {
  font-size: 1.15rem;
  margin: 0 0 1rem;
  color: var(--text, #28382e);
}
.fav-count {
  color: var(--accent, #65846c);
  font-size: 0.9rem;
}
.fav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.fav-empty {
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}
.setting-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.entry-info h2 {
  margin: 0 0 0.3rem;
  font-size: 1.05rem;
  color: var(--text, #28382e);
}
.entry-info p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary, #718071);
}
.setting-button {
  flex-shrink: 0;
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--accent, #65846c);
  border-radius: 999px;
  background: transparent;
  color: var(--accent, #65846c);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}
</style>
