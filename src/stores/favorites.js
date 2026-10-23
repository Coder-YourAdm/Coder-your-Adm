import { defineStore } from 'pinia'
import { getPoemById } from '@/api/poems'

// 收藏：仅保存诗词 id 列表，详情通过 getPoemById 解析，避免数据冗余。
// 持久化 key 与用户态区分开。
const STORAGE_KEY = 'shiyun-favorites'

function readFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (Array.isArray(data)) {
        return data.filter((id) => typeof id === 'string')
      }
    }
  } catch (e) {
    /* 忽略损坏数据 */
  }
  return []
}

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({ ids: readFavorites() }),
  getters: {
    count: (state) => state.ids.length,
    // 把收藏的 id 解析成完整诗词对象，供「我的收藏」列表渲染
    list: (state) => state.ids.map((id) => getPoemById(id)).filter(Boolean),
  },
  actions: {
    has(id) {
      return this.ids.includes(id)
    },
    toggle(id) {
      const idx = this.ids.indexOf(id)
      if (idx >= 0) this.ids.splice(idx, 1)
      else this.ids.push(id)
      this.persist()
    },
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.ids))
      } catch (e) {
        /* 忽略写入失败 */
      }
    },
  },
})
