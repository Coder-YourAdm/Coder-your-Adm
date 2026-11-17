import { defineStore } from 'pinia'
import { ref } from 'vue'

const ENABLED_KEY = 'shiyun-audio-enabled'
const VOLUME_KEY = 'shiyun-audio-volume'

function readPreference(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value
  } catch (error) {
    console.warn(`无法读取音频设置 ${key}`, error)
    return fallback
  }
}

function writePreference(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.error(`无法保存音频设置 ${key}`, error)
  }
}

export const useAudioStore = defineStore('audio', () => {
  const enabled = ref(readPreference(ENABLED_KEY, 'false') === 'true')
  const volume = ref(Math.min(1, Math.max(0, Number(readPreference(VOLUME_KEY, '0.28')) || 0)))
  const soundEffectsEnabled = ref(readPreference('shiyun-sfx-enabled', 'true') !== 'false')

  function setEnabled(value) {
    enabled.value = Boolean(value)
    writePreference(ENABLED_KEY, String(enabled.value))
  }

  function setVolume(value) {
    volume.value = Math.min(1, Math.max(0, Number(value)))
    writePreference(VOLUME_KEY, String(volume.value))
  }

  function setSoundEffectsEnabled(value) {
    soundEffectsEnabled.value = Boolean(value)
    writePreference('shiyun-sfx-enabled', String(soundEffectsEnabled.value))
  }

  return {
    enabled,
    volume,
    soundEffectsEnabled,
    setEnabled,
    setVolume,
    setSoundEffectsEnabled,
  }
})
