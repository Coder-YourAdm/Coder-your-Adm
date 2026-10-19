import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// 主题和字体的全局状态管理
export const useDisplayStore = defineStore('display', () => {
  // 当前主题，默认使用春季
  const theme = ref('spring')

  // 当前诗词字体，默认使用楷体
  const poemFont = ref('kaiti')

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

    // 将当前主题写入 HTML 根元素
    document.documentElement.dataset.theme = theme.value

    // 将当前字体对应的 CSS 类名写入 HTML 根元素
    document.documentElement.dataset.font = poemFont.value
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

  // 状态变化后，自动更新网页
  watch(
    [theme, poemFont],
    applyDisplaySettings,
    { immediate: true },
  )

  return {
    theme,
    poemFont,
    themes,
    fonts,
    setTheme,
    setPoemFont,
    applyDisplaySettings,
  }
})