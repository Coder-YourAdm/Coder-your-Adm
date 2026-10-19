```vue
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <main class="profile-page">
    <header class="page-header">
      <h1>我的</h1>
      <p>在这里管理你的阅读偏好。</p>
    </header>

    <section class="profile-card">
      <div class="setting-entry">
        <div class="entry-info">
          <h2>个性化设置</h2>
          <p>更换四季主题，切换诗词字体。</p>
        </div>

        <button
          type="button"
          class="setting-button"
          @click="router.push('/settings')"
        >
          前往设置
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.profile-page {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 28px;
}

.page-header h1 {
  margin: 0 0 10px;
  color: var(--text-primary, #493d32);
  font-size: 28px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: var(--text-secondary, #85796d);
  font-size: 14px;
  line-height: 1.8;
}

.profile-card {
  padding: 24px;
  border: 1px solid var(--border, rgba(120, 100, 75, 0.18));
  border-radius: 16px;
  background: var(--card-bg, rgba(255, 255, 255, 0.78));
}

.setting-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.entry-info h2 {
  margin: 0 0 8px;
  color: var(--text-primary, #493d32);
  font-size: 18px;
  font-weight: 600;
}

.entry-info p {
  margin: 0;
  color: var(--text-secondary, #85796d);
  font-size: 14px;
  line-height: 1.8;
}

.setting-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 10px 16px;
  border: 1px solid var(--accent, #9b8057);
  border-radius: 10px;
  background: var(--accent-bg, rgba(195, 166, 119, 0.16));
  color: var(--text-primary, #493d32);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.setting-button:hover {
  background: rgba(195, 166, 119, 0.3);
}

.setting-button span {
  font-size: 20px;
  line-height: 1;
}

@media (max-width: 480px) {
  .profile-page {
    padding: 24px 16px 36px;
  }

  .profile-card {
    padding: 18px;
  }

  .setting-entry {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>