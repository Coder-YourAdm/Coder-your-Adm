import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'shiyun-display-settings'

function loadDisplaySettings() {
  const defaults = {
    theme: 'spring',
    poemFont: 'kaiti',
    fontSize: 'medium',
  }

  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '{}',
    )

    return {
      theme: ['spring', 'summer', 'autumn', 'winter'].includes(saved.theme)
        ? saved.theme
        : defaults.theme,

      poemFont: ['kaiti', 'xingkai'].includes(saved.poemFont)
        ? saved.poemFont
        : defaults.poemFont,

      fontSize: ['small', 'medium', 'large'].includes(saved.fontSize)
        ? saved.fontSize
        : defaults.fontSize,
    }
  } catch {
    return defaults
  }
}

// 主题和字体的全局状态管理
export const useDisplayStore = defineStore('display', () => {
  const savedSettings = loadDisplaySettings()

const theme = ref(savedSettings.theme)
const poemFont = ref(savedSettings.poemFont)
const fontSize = ref(savedSettings.fontSize)
const fontSizes = [
  { label: '小', value: 'small', size: '18px' },
  { label: '标准', value: 'medium', size: '22px' },
  { label: '大', value: 'large', size: '26px' },
]

  // 支持的四季主题
  const themes = [
    { label: '春', value: 'spring' },
    { label: '夏', value: 'summer' },
    { label: '秋', value: 'autumn' },
    { label: '冬', value: 'winter' },
  ]

  // 支持的诗词字体
  const fonts = [
    { label: '楷体', value: 'kaiti' },
    { label: '行书', value: 'xingkai' },
  ]

  // 将主题和字体设置应用到网页
  function applyDisplaySettings() {
  if (typeof document === 'undefined') return

  document.documentElement.dataset.theme = theme.value
  document.documentElement.dataset.font = poemFont.value
  document.documentElement.dataset.fontSize = fontSize.value
}

  // 切换主题
  function setTheme(value) {
    const isValid = themes.some((item) => item.value === value)

    if (!isValid) {
      console.warn(`暂不支持主题：${value}`)
      return
    }

    theme.value = value
  }

  // 切换诗词字体
  function setPoemFont(value) {
    const isValid = fonts.some((item) => item.value === value)

    if (!isValid) {
      console.warn(`暂不支持字体：${value}`)
      return
    }

    poemFont.value = value
  }

  function setFontSize(value) {
  const isValid = fontSizes.some((item) => item.value === value)

  if (!isValid) {
    console.warn(`暂不支持字号：${value}`)
    return
  }

  fontSize.value = value
}

  // 状态变化后，自动更新网页
  watch(
  [theme, poemFont, fontSize],
  () => {
    applyDisplaySettings()

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          theme: theme.value,
          poemFont: poemFont.value,
          fontSize: fontSize.value,
        }),
      )
    } catch (error) {
      console.warn('设置保存失败：', error)
    }
  },
  { immediate: true },
)

  return {
  theme,
  poemFont,
  fontSize,
  fontSizes,
  themes,
  fonts,
  setTheme,
  setPoemFont,
  applyDisplaySettings,
  setFontSize,
}
})