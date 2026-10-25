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

    <section class="profile-card fav-section">
  <div class="fav-heading">
    <h2 class="fav-title">
      我的收藏
      <span class="fav-count-badge">{{ favList.length }}</span>
    </h2>

    <span class="fav-total">
      共收藏 {{ favList.length }} 首
    </span>
  </div>

  <div class="fav-divider" aria-hidden="true"></div>

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
    />
  </div>

  <div v-else class="fav-empty-panel">
    <svg
      class="fav-empty-icon"
      viewBox="0 0 24 24"
      width="34"
      height="34"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 7v14" />
      <path
        d="M3 18V5a2 2 0 0 1 2-2h2a5 5 0 0 1 5 5 5 5 0 0 1 5-5h2a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1h-3a5 5 0 0 0-5 2 5 5 0 0 0-5-2H4a1 1 0 0 1-1-1z"
      />
    </svg>

    <p class="fav-empty-title">还没有收藏诗词</p>

    <p class="fav-empty-hint">
      去诗词详情页点 ☆，收藏你喜欢的诗吧
    </p>
  </div>
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
/* 收藏区域：与个人中心其他卡片保持统一 */
.fav-section {
  text-align: left;
}

/* 标题与收藏总数 */
.fav-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.2rem;
}

.fav-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  color: var(--text, #28382e);
  font-size: 1.25rem;
  line-height: 1.4;
}

.fav-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.2rem;
  height: 2.2rem;
  padding: 0 0.55rem;
  box-sizing: border-box;
  border-radius: 999px;
  background: rgba(90, 165, 106, 0.14);
  color: var(--accent, #5aa56a);
  font-size: 0.95rem;
  font-weight: 700;
}

.fav-total {
  color: var(--text-secondary, #718071);
  font-size: 0.95rem;
  white-space: nowrap;
}

/* 标题与内容之间的细分隔线 */
.fav-divider {
  width: 100%;
  height: 1px;
  margin-bottom: 1.5rem;
  background: var(--border, rgba(47, 63, 49, 0.12));
}

/* 没有收藏时的空状态面板 */
.fav-empty-panel {
  box-sizing: border-box;
  min-height: 12rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 2rem 1.25rem;
  border: 1px solid rgba(47, 63, 49, 0.12);
  border-radius: 1.35rem;
  background: rgba(255, 254, 250, 0.78);
}

.fav-empty-icon {
  flex-shrink: 0;
  margin-bottom: 0.15rem;
  color: rgba(101, 132, 108, 0.75);
}

.fav-empty-title {
  margin: 0;
  color: var(--text, #28382e);
  font-size: 1.1rem;
  font-weight: 500;
}

.fav-empty-hint {
  margin: 0;
  color: var(--text-secondary, #718071);
  font-size: 0.95rem;
  line-height: 1.6;
  text-align: center;
}

/* 小屏幕适配 */
@media (max-width: 600px) {
  .fav-heading {
    align-items: flex-start;
    gap: 0.5rem;
  }

  .fav-title {
    font-size: 1.12rem;
  }

  .fav-empty-panel {
    min-height: 10.5rem;
    padding: 1.5rem 0.75rem;
  }

  .fav-empty-hint {
    font-size: 0.9rem;
  }
}
/* 登录卡片：文字与按钮自然对齐 */
.login-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  text-align: left;
}

.login-prompt p {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
  line-height: 1.65;
}

/* 登录和设置按钮统一尺寸与交互 */
.login-btn,
.setting-button {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-height: 2.65rem;
  box-sizing: border-box;
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  font-family: inherit;
  font-size: 0.88rem;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.login-btn {
  border: 1px solid var(--accent, #65846c);
  background: var(--accent, #65846c);
  color: #fff;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 12px rgba(47, 63, 49, 0.12);
}

/* 个性化设置：文字左对齐，按钮稳定靠右 */
.setting-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  text-align: left;
}

.entry-info {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.entry-info h2 {
  margin: 0 0 0.35rem;
  color: var(--text, #28382e);
  font-size: 1.14rem;
  line-height: 1.45;
  font-weight: 500;
}

.entry-info p {
  margin: 0;
  color: var(--text-secondary, #718071);
  font-size: 0.88rem;
  line-height: 1.65;
}

.setting-button {
  border: 1px solid var(--accent, #65846c);
  background: rgba(90, 165, 106, 0.06);
  color: var(--accent, #65846c);
}

.setting-button:hover {
  transform: translateY(-1px);
  background: var(--accent, #65846c);
  color: #fff;
  box-shadow: 0 5px 12px rgba(47, 63, 49, 0.1);
}

/* 键盘焦点仍然清晰可见 */
.login-btn:focus-visible,
.setting-button:focus-visible {
  outline: 3px solid rgba(90, 165, 106, 0.28);
  outline-offset: 3px;
}

/* 小屏幕布局 */
@media (max-width: 600px) {
  .login-prompt,
  .setting-entry {
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .login-prompt p,
  .entry-info {
    flex-basis: 100%;
  }

  .login-btn,
  .setting-button {
    margin-left: auto;
  }
}
</style>
