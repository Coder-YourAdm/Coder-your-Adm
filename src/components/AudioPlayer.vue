<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAudioStore } from '@/stores/audio'
import { useDisplayStore } from '@/stores/display'

const route = useRoute()
const audioStore = useAudioStore()
const displayStore = useDisplayStore()
const player = ref(null)
const status = ref('背景音乐已关闭')
const isPaused = ref(true)

const tracks = {
  spring: { file: 'spring.mp3', label: '春日' },
  summer: { file: 'summer.mp3', label: '夏日' },
  autumn: { file: 'autumn.mp3', label: '秋日' },
  winter: { file: 'winter.mp3', label: '冬日' },
  game: { file: 'game.mp3', label: '游戏' },
}

const isGameRoute = computed(() => route.path.startsWith('/game') || route.path === '/battle')
const currentTrack = computed(() =>
  isGameRoute.value ? tracks.game : tracks[displayStore.theme] || tracks.spring,
)
const source = computed(() => `${import.meta.env.BASE_URL}audio/${currentTrack.value.file}`)

async function syncPlayback([nextSource = source.value, enabled = audioStore.enabled, volume = audioStore.volume] = []) {
  if (!player.value) return

  player.value.volume = volume
  if (!enabled) {
    player.value.pause()
    if (player.value.hasAttribute('src')) {
      player.value.removeAttribute('src')
      player.value.load()
    }
    status.value = '背景音乐已关闭'
    return
  }

  if (player.value.src !== new URL(nextSource, window.location.href).href) {
    player.value.pause()
    player.value.currentTime = 0
    player.value.src = nextSource
    player.value.load()
  }

  try {
    await player.value.play()
    status.value = `正在播放${currentTrack.value.label}音乐`
  } catch (error) {
    status.value = error.name === 'NotAllowedError'
      ? '点击播放以启用背景音乐'
      : '背景音乐无法播放，请检查音频文件'
  }
}

watch([source, () => audioStore.enabled, () => audioStore.volume], syncPlayback)
onMounted(() => syncPlayback())

function handleAudioError() {
  status.value = '背景音乐加载失败，请检查音频文件'
}

function handlePlay() {
  isPaused.value = false
}

function handlePause() {
  isPaused.value = true
}

function togglePlayback() {
  if (audioStore.enabled && isPaused.value) {
    syncPlayback([source.value, true, audioStore.volume])
    return
  }

  const enabled = !audioStore.enabled
  audioStore.setEnabled(enabled)
  if (enabled) syncPlayback([source.value, true, audioStore.volume])
}

function disablePlayback() {
  audioStore.setEnabled(false)
}
</script>

<template>
  <div class="audio-player">
    <audio
      ref="player"
      loop
      preload="none"
      @error="handleAudioError"
      @play="handlePlay"
      @pause="handlePause"
    />
    <button
      class="audio-toggle"
      type="button"
      :aria-pressed="audioStore.enabled"
      :aria-label="audioStore.enabled && !isPaused ? '关闭背景音乐' : '开启背景音乐'"
      @click="togglePlayback"
    >
      <span aria-hidden="true">{{ audioStore.enabled && !isPaused ? '♫' : '♪' }}</span>
      <span>{{ audioStore.enabled && !isPaused ? '音乐已开' : audioStore.enabled ? '继续播放' : '开启音乐' }}</span>
    </button>
    <button
      v-if="audioStore.enabled && isPaused"
      class="audio-close"
      type="button"
      aria-label="关闭背景音乐"
      @click="disablePlayback"
    >
      关闭
    </button>
    <label class="volume-control">
      <span class="sr-only">背景音乐音量</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="audioStore.volume"
        :aria-label="`背景音乐音量：${Math.round(audioStore.volume * 100)}%`"
        @input="audioStore.setVolume(Number($event.target.value))"
      />
    </label>
    <span class="audio-status" role="status">{{ status }}</span>
  </div>
</template>

<style scoped>
.audio-player {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  color: var(--layout-muted, #898b80);
  font-size: 0.7rem;
}

.audio-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.48rem 0.68rem;
  border: 1px solid var(--layout-border, rgba(47, 63, 49, 0.11));
  border-radius: 999px;
  color: var(--layout-accent, #65846c);
  background: var(--layout-surface, #fffefa);
  cursor: pointer;
  white-space: nowrap;
}

.audio-toggle span:first-child {
  font-size: 1rem;
}

.audio-close {
  padding: 0.4rem 0.55rem;
  border: 0;
  color: var(--layout-muted, #898b80);
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.volume-control {
  display: flex;
  width: 4.5rem;
}

.volume-control input {
  width: 100%;
  accent-color: var(--layout-accent, #65846c);
}

.audio-status {
  max-width: 8.5rem;
  line-height: 1.35;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (max-width: 600px) {
  .audio-player {
    width: 100%;
  }

  .audio-status {
    max-width: none;
  }
}
</style>
