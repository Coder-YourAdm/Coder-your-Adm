
import { defineStore } from 'pinia'
import { getPoemById } from '@/api/poems'

// 浏览历史最多保存 50 条
const STORAGE_KEY = 'shiyun-poem-history'
const MAX_HISTORY = 50

// 从 localStorage 读取浏览历史
function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []

    const seen = new Set()

    return data.filter((item) => {
      if (
        !item ||
        typeof item.id !== 'string' ||
        !Number.isFinite(item.visitedAt) ||
        !getPoemById(item.id) ||
        seen.has(item.id)
      ) {
        return false
      }

      seen.add(item.id)
      return true
    }).slice(0, MAX_HISTORY)
  } catch (error) {
    // 本地数据损坏时回退为空列表
    return []
  }
}

export const usePoemHistoryStore = defineStore('poemHistory', {
  state: () => ({
    records: readHistory(),
  }),

  getters: {
    // 将诗词 ID 解析为完整诗词对象，并附带访问时间
    list: (state) =>
      state.records
        .map((record) => {
          const poem = getPoemById(record.id)

          return poem
            ? { ...poem, visitedAt: record.visitedAt }
            : null
        })
        .filter(Boolean),

    count: (state) => state.records.length,
  },

  actions: {
    // 记录一次诗词访问
    recordVisit(id) {
      if (typeof id !== 'string') return

      // 只记录诗库中真实存在的诗词
      if (!getPoemById(id)) return

      // 再次访问时移到最前面，并更新访问时间
      this.records = [
        {
          id,
          visitedAt: Date.now(),
        },
        ...this.records.filter((item) => item.id !== id),
      ].slice(0, MAX_HISTORY)

      this.persist()
    },

    // 清空浏览历史
    clearHistory() {
      this.records = []
      this.persist()
    },

    // 保存到本地
    persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(this.records),
        )
      } catch (error) {
        // 忽略本地存储写入失败
      }
    },
  },
})
