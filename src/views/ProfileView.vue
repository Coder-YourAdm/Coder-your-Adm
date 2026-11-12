
<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useFavoritesStore } from '@/stores/favorites'
import PoemCard from '@/components/PoemCard.vue'
import { usePoemHistoryStore } from '@/stores/poemHistory'

const userStore = useUserStore()
const favStore = useFavoritesStore()
const historyStore = usePoemHistoryStore()

// 格式化浏览时间
function formatVisitedAt(timestamp) {
  const date = new Date(timestamp)

  if (!Number.isFinite(date.getTime())) return ''

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const pad = (value) => String(value).padStart(2, '0')
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`

  if (date.toDateString() === now.toDateString()) {
    return `今天 ${time}`
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${time}`
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${time}`
}

// 头像编辑状态
const avatarFileInput = ref(null)
const showAvatarEditor = ref(false)
const avatarPreview = ref('')
const cropScale = ref(1)
const avatarError = ref('')

let pendingAvatarImage = null

// 打开本地图片选择器
function openAvatarPicker() {
  avatarFileInput.value?.click()
}

// 读取本地图片
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('图片读取失败'))

    reader.readAsDataURL(file)
  })
}

// 加载图片
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))

    image.src = source
  })
}

// 选择并预览头像
async function handleAvatarFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''

  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    avatarError.value = '请选择 JPG、PNG 或 WebP 格式的图片。'
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    avatarError.value = '图片大小不能超过 10 MB。'
    return
  }

  try {
    avatarError.value = ''

    const preview = await readFileAsDataUrl(file)
    const image = await loadImage(preview)

    pendingAvatarImage = image
    avatarPreview.value = preview
    cropScale.value = 1
    showAvatarEditor.value = true
  } catch (error) {
    avatarError.value = '图片读取失败，请重新选择。'
  }
}

// 取消头像编辑
function cancelAvatarEdit() {
  showAvatarEditor.value = false
  avatarPreview.value = ''
  pendingAvatarImage = null
  cropScale.value = 1
}

// 裁剪、压缩并保存头像
function saveAvatar() {
  if (!pendingAvatarImage) return

  try {
    const image = pendingAvatarImage
    const canvas = document.createElement('canvas')
    const size = 256

    canvas.width = size
    canvas.height = size

    const context = canvas.getContext('2d')

    if (!context) {
      avatarError.value = '头像处理失败，请重试。'
      return
    }

    // 居中截取正方形区域
    const cropSize = Math.min(
      image.naturalWidth,
      image.naturalHeight,
    ) / cropScale.value

    const sx = (image.naturalWidth - cropSize) / 2
    const sy = (image.naturalHeight - cropSize) / 2

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    context.drawImage(
      image,
      sx,
      sy,
      cropSize,
      cropSize,
      0,
      0,
      size,
      size,
    )

    // 转换为 WebP，降低 localStorage 占用
    const avatarData = canvas.toDataURL('image/webp', 0.82)

    userStore.setAvatar(avatarData)
    cancelAvatarEdit()
    avatarError.value = ''
  } catch (error) {
    avatarError.value = '保存头像失败，请尝试使用更小的图片。'
  }
}
</script>

<template>
  <div class="profile-page">
    <header class="page-header">
      <h1>我的</h1>
    </header>

    <!-- 1. 用户信息区 -->
    <section class="user-card">
      <div v-if="userStore.isLoggedIn" class="user-row">
        <button
          class="avatar-button"
          type="button"
          aria-label="更换头像"
          @click="openAvatarPicker"
        >
          <img
            v-if="userStore.avatar"
            class="avatar-image"
            :src="userStore.avatar"
            alt="个人头像"
          />

          <span v-else class="avatar-placeholder">
            {{ userStore.username.slice(0, 1) || '诗' }}
          </span>

          <span class="avatar-edit-mark" aria-hidden="true">✎</span>
        </button>

        <input
          ref="avatarFileInput"
          class="avatar-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="handleAvatarFileChange"
        />

        <div class="user-info">
          <h2>欢迎你，{{ userStore.username }}</h2>
          <p>已登录 · 点击头像更换</p>
        </div>

        <button
          class="logout-btn"
          type="button"
          @click="userStore.logout()"
        >
          退出登录
        </button>
      </div>

      <div v-else class="login-prompt">
        <h2>你还没有登录哦~</h2>
        <p>登录后可收藏喜欢的诗词，记录你的学习历程。</p>
        <button
          class="login-btn"
          type="button"
          @click="$router.push('/login')"
        >
          去登录
        </button>
      </div>
    </section>

    <p v-if="avatarError" class="avatar-error" role="alert">
      {{ avatarError }}
    </p>

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

        <!-- 3. 我的足迹入口 -->
    <div
      class="study-entry"
      @click="$router.push('/history')"
    >
      <h3>🕘 我的足迹</h3>
      <p>查看访问过的诗词 · 共 {{ historyStore.count }} 条记录。</p>
      <span class="entry-arrow">前往足迹 ›</span>
    </div>

    <!-- 4. 我的收藏入口 -->
    <div
      class="study-entry"
      @click="$router.push('/favorites')"
    >
      <h3>❤️ 我的收藏</h3>
      <p>珍藏喜欢的诗词 · 共 {{ favStore.count }} 首。</p>
      <span class="entry-arrow">查看收藏 ›</span>
    </div>

    <!-- 5. 我的学习 -->
    <div
      class="study-entry"
      @click="$router.push('/study')"
    >
      <h3>📖 我的学习</h3>
      <p>查看游戏中答错的诗词，背诗卡助你巩固记忆。</p>
      <span class="entry-arrow">前往学习 ›</span>
    </div>

    <!-- 6. 个性化设置 -->
    <div
      class="study-entry"
      @click="$router.push('/settings')"
    >
      <h3>⚙️ 个性化设置</h3>
      <p>自定义四季主题、诗词字体与阅读字号。</p>
      <span class="entry-arrow">前往设置 ›</span>
    </div>

    <!-- 7. 头像裁剪编辑弹窗 -->
    <div
      v-if="showAvatarEditor"
      class="avatar-modal-overlay"
      @click.self="cancelAvatarEdit"
    >
      <section
        class="avatar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-modal-title"
      >
        <button
          class="avatar-modal-close"
          type="button"
          aria-label="关闭"
          @click="cancelAvatarEdit"
        >
          ×
        </button>

        <h2 id="avatar-modal-title">设置个人头像</h2>

        <p class="avatar-modal-desc">
          调整图片大小，预览满意后保存
        </p>

        <div class="avatar-crop-preview">
          <img
            v-if="avatarPreview"
            :src="avatarPreview"
            alt="头像裁剪预览"
            :style="{ transform: `scale(${cropScale})` }"
          />
        </div>

        <div class="avatar-zoom-control">
          <label for="avatar-scale">调整头像缩放</label>

          <input
            id="avatar-scale"
            v-model.number="cropScale"
            type="range"
            min="1"
            max="3"
            step="0.05"
          />

          <span>{{ cropScale.toFixed(2) }}×</span>
        </div>

        <div class="avatar-modal-actions">
          <button
            class="avatar-secondary-btn"
            type="button"
            @click="openAvatarPicker"
          >
            重新选择
          </button>

          <button
            class="avatar-secondary-btn"
            type="button"
            @click="cancelAvatarEdit"
          >
            取消
          </button>

          <button
            class="avatar-primary-btn"
            type="button"
            :disabled="!avatarPreview"
            @click="saveAvatar"
          >
            保存头像
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  width: min(100%, 1000px);
  box-sizing: border-box;
  padding: 20px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
  color: var(--text, #28382e);
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.9rem;
}

/* 用户信息卡片 */
.user-card {
  padding: 30px;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.14));
  border-radius: 12px;
  background: var(--card-surface, #fffefa);
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.user-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info h2 {
  margin: 0;
  color: var(--text, #28382e);
  font-size: 1.2rem;
  font-weight: 600;
}

.user-info p {
  margin: 0.35rem 0 0;
  color: var(--text-secondary, #718071);
  font-size: 0.85rem;
}

/* 头像 */
.avatar-button {
  position: relative;
  display: grid;
  flex: 0 0 4.5rem;
  width: 4.5rem;
  height: 4.5rem;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.avatar-placeholder,
.avatar-image {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  box-sizing: border-box;
  border-radius: 50%;
}

.avatar-placeholder {
  background: var(--accent, #65846c);
  color: #fff;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.7rem;
}

.avatar-image {
  object-fit: cover;
}

.avatar-edit-mark {
  position: absolute;
  right: -0.1rem;
  bottom: -0.1rem;
  display: grid;
  width: 1.4rem;
  height: 1.4rem;
  place-items: center;
  border: 2px solid var(--card-surface, #fffefa);
  border-radius: 50%;
  color: #fff;
  background: var(--accent, #65846c);
  font-size: 0.85rem;
}

.avatar-button:hover {
  filter: brightness(0.95);
}

.avatar-button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--accent, #65846c) 35%, transparent);
  outline-offset: 4px;
}

.avatar-file-input {
  display: none;
}

.avatar-error {
  margin: -0.5rem 0 1rem;
  color: #b54747;
  font-size: 0.85rem;
}

/* 登录与退出按钮 */
.login-prompt {
  text-align: center;
}

.login-prompt h2 {
  margin: 0;
  color: var(--text, #28382e);
  font-size: 1.2rem;
}

.login-prompt p {
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}

.login-btn,
.logout-btn {
  padding: 10px 24px;
  border: 1px solid var(--accent, #65846c);
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
}

.login-btn {
  color: white;
  background: var(--accent, #65846c);
}

.logout-btn {
  color: var(--text, #28382e);
  background: transparent;
}

.login-btn:hover,
.logout-btn:hover {
  filter: brightness(0.94);
}

/* 学习统计 */
.stats-card {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  flex: 1;
  padding: 20px;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 12px;
  background: var(--card-surface, #fffefa);
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-num {
  display: block;
  color: var(--accent, #5aa56a);
  font-size: 24px;
  font-weight: bold;
}

.stat-label {
  color: var(--text-secondary, #718071);
  font-size: 14px;
}


/* 我的足迹 */
.history-section {
  margin-top: 24px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.history-header h3 {
  margin: 0;
  color: var(--text, #28382e);
}

.clear-history-btn {
  padding: 6px 13px;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.16));
  border-radius: 999px;
  color: var(--text-secondary, #718071);
  background: var(--card-surface, #fffefa);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: color 160ms ease, border-color 160ms ease;
}

.clear-history-btn:hover {
  color: #c45b5b;
  border-color: #c45b5b;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 15px 20px;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 12px;
  color: var(--text, #28382e);
  background: var(--card-surface, #fffefa);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 14px rgba(47, 63, 49, 0.1);
}

.history-poem-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.history-poem-title {
  overflow: hidden;
  color: var(--text, #28382e);
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 16px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-poem-meta {
  color: var(--text-secondary, #718071);
  font-size: 13px;
}

.history-visit-info {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.history-visit-time {
  color: var(--text-secondary, #999);
  font-size: 12px;
}

.history-view-link {
  color: var(--accent, #5aa56a);
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 480px) {
  .history-item {
    padding: 13px 14px;
    gap: 8px;
  }

  .history-visit-time {
    font-size: 11px;
  }
}


/* 我的收藏 */
.favorites-section h3 {
  margin: 0 0 1rem;
  color: var(--text, #28382e);
}

.poem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.empty-state {
  padding: 40px;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 12px;
  background: var(--card-surface, #fffefa);
  color: var(--text-secondary, #999);
  text-align: center;
}

/* 我的学习入口 */
.study-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  padding: 20px 24px;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 12px;
  background: var(--card-surface, #fffefa);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.study-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 14px rgba(47, 63, 49, 0.1);
}

.study-entry h3 {
  margin: 0;
  color: var(--text, #28382e);
}

.study-entry p {
  flex: 1;
  margin: 4px 0 0;
  color: var(--text-secondary, #666);
  font-size: 14px;
}

.entry-arrow {
  color: var(--accent, #5aa56a);
  font-weight: 600;
  white-space: nowrap;
}

/* 头像弹窗 */
.avatar-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 1rem;
  background: rgba(25, 35, 28, 0.48);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.avatar-modal {
  position: relative;
  width: min(100%, 420px);
  box-sizing: border-box;
  padding: 2rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.14));
  border-radius: 1.35rem;
  background: var(--card-surface, #fffefa);
  box-shadow: 0 18px 55px rgba(25, 35, 28, 0.2);
  text-align: center;
}

.avatar-modal h2 {
  margin: 0;
  color: var(--text, #28382e);
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.45rem;
}

.avatar-modal-desc {
  margin: 0.55rem 0 1.5rem;
  color: var(--text-secondary, #718071);
  font-size: 0.85rem;
  line-height: 1.6;
}

.avatar-modal-close {
  position: absolute;
  top: 0.8rem;
  right: 0.9rem;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 50%;
  color: var(--text-secondary, #718071);
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
}

/* 圆形头像预览 */
.avatar-crop-preview {
  width: 180px;
  height: 180px;
  margin: 0 auto 1.5rem;
  overflow: hidden;
  border: 3px solid color-mix(in srgb, var(--accent, #65846c) 55%, transparent);
  border-radius: 50%;
  background: rgba(101, 132, 108, 0.08);
}

.avatar-crop-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform-origin: center;
  transition: transform 100ms ease;
}

/* 缩放 */
.avatar-zoom-control {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.7rem;
  color: var(--text, #28382e);
  font-size: 0.83rem;
}

.avatar-zoom-control label {
  white-space: nowrap;
}

.avatar-zoom-control input {
  flex: 1;
  min-width: 0;
  accent-color: var(--accent, #65846c);
  cursor: pointer;
}

.avatar-zoom-control span {
  min-width: 2.8rem;
  color: var(--accent, #65846c);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* 弹窗按钮 */
.avatar-modal-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem;
}

.avatar-secondary-btn,
.avatar-primary-btn {
  min-height: 2.5rem;
  padding: 0.55rem 0.95rem;
  border-radius: 999px;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.avatar-secondary-btn {
  border: 1px solid var(--border, rgba(47, 63, 49, 0.2));
  color: var(--text, #28382e);
  background: transparent;
}

.avatar-secondary-btn:hover {
  border-color: var(--accent, #65846c);
  color: var(--accent, #65846c);
}

.avatar-primary-btn {
  border: 1px solid var(--accent, #65846c);
  color: #fff;
  background: var(--accent, #65846c);
}

.avatar-primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .profile-page {
    padding: 14px;
  }

  .user-card {
    padding: 20px 16px;
  }

  .user-row {
    flex-wrap: wrap;
  }

  .stats-card {
    gap: 10px;
  }

  .study-entry {
    flex-wrap: wrap;
  }

  .avatar-modal {
    padding: 1.6rem 1.1rem;
  }

  .avatar-crop-preview {
    width: 160px;
    height: 160px;
  }

  .avatar-modal-actions {
    gap: 0.45rem;
  }
}
</style>
