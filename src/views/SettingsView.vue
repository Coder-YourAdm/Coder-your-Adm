<script setup>
import { useDisplayStore } from '../stores/display'

const displayStore = useDisplayStore()
</script>

<template>
  <main class="settings-page">
    <header class="page-header">
      <h1>个性化设置</h1>
      <p>选择你喜欢的阅读风格，让诗词阅读更有韵味。</p>
    </header>

    <section class="setting-card">
      <div class="setting-info">
        <h2>四季主题</h2>
        <p>更换页面背景，感受不同季节的诗意。</p>
      </div>

      <div class="option-list">
        <button
          v-for="item in displayStore.themes"
          :key="item.value"
          type="button"
          class="option-button"
          :class="{ active: displayStore.theme === item.value }"
          :aria-pressed="displayStore.theme === item.value"
          @click="displayStore.setTheme(item.value)"
        >
          <span class="option-dot" :class="`dot-${item.value}`"></span>
          <span>{{ item.label }}</span>
          <span v-if="displayStore.theme === item.value" class="check-mark">✓</span>
        </button>
      </div>
    </section>

    <section class="setting-card">
      <div class="setting-info">
        <h2>诗词字体</h2>
        <p>切换字体，体验不同的传统书法风格。</p>
      </div>

      <div class="option-list">
        <button
          v-for="item in displayStore.fonts"
          :key="item.value"
          type="button"
          class="option-button font-option"
          :class="{ active: displayStore.poemFont === item.value }"
          :aria-pressed="displayStore.poemFont === item.value"
          @click="displayStore.setPoemFont(item.value)"
        >
          <span>{{ item.label }}</span>
          <span v-if="displayStore.poemFont === item.value" class="check-mark">✓</span>
        </button>
      </div>

      <div class="font-preview">
        <p class="preview-label">字体预览</p>
        <p class="preview-poem">春眠不觉晓，处处闻啼鸟。</p>
        <p class="preview-author">—— 孟浩然《春晓》</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.settings-page {
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

.page-header p,
.setting-info p {
  margin: 0;
  color: var(--text-secondary, #85796d);
  font-size: 14px;
  line-height: 1.8;
}

.setting-card {
  margin-bottom: 20px;
  padding: 24px;
  border: 1px solid var(--border, rgba(120, 100, 75, 0.18));
  border-radius: 16px;
  background: var(--card-bg, rgba(255, 255, 255, 0.78));
  box-sizing: border-box;
}

.setting-info {
  margin-bottom: 18px;
}

.setting-info h2 {
  margin: 0 0 8px;
  color: var(--text-primary, #493d32);
  font-size: 19px;
  font-weight: 600;
}

.option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.option-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 78px;
  padding: 10px 15px;
  border: 1px solid var(--border, #ded5c8);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.65);
  color: var(--text-primary, #493d32);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.option-button:hover {
  border-color: var(--accent, #9b8057);
}

.option-button.active {
  border-color: var(--accent, #9b8057);
  background: var(--accent-bg, rgba(195, 166, 119, 0.16));
}

.option-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-spring {
  background: #a5bd91;
}

.dot-summer {
  background: #7daeb5;
}

.dot-autumn {
  background: #c99060;
}

.dot-winter {
  background: #a8bacd;
}

.check-mark {
  color: var(--accent, #9b8057);
  font-weight: 700;
}

.font-preview {
  margin-top: 24px;
  padding: 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.45);
}

.preview-label {
  margin: 0 0 14px;
  color: var(--text-secondary, #85796d);
  font-size: 12px;
}

.preview-poem {
  margin: 0 0 12px;
  color: var(--text-primary, #493d32);
  font-family: var(--poem-font, serif);
  font-size: 25px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.preview-author {
  margin: 0;
  color: var(--text-secondary, #85796d);
  font-size: 13px;
  text-align: right;
}

@media (max-width: 480px) {
  .settings-page {
    padding: 24px 16px 36px;
  }

  .setting-card {
    padding: 18px;
  }

  .page-header h1 {
    font-size: 24px;
  }

  .preview-poem {
    font-size: 21px;
  }
}
</style>