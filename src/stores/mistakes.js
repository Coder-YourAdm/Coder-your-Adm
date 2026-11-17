import { defineStore } from 'pinia'
import { getPoemById } from '@/api/poems'

// 背诗卡（错题库）：记录游戏(飞花令/填空等)中答错的诗词 id。
// 仅保存 id 与时间/来源，详情经 getPoemById 解析，避免数据冗余。
// 持久化 key 与收藏/用户态区分开。
const STORAGE_KEY = 'shiyun-mistakes'

function readMistakes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (Array.isArray(data)) {
        return data
          .filter((m) => m && typeof m.id === 'string')
          .map((m) => ({ id: m.id, type: m.type || '游戏', at: m.at || Date.now() }))
      }
    }
  } catch (e) {
    /* 忽略损坏数据 */
  }
  return []
}

export const useMistakesStore = defineStore('mistakes', {
  state: () => ({ items: readMistakes() }),
  getters: {
    // 原始记录条数（含重复，即总答错次数）
    totalCount: (state) => state.items.length,
    // 去重后的薄弱诗词：带答错次数、来源类型集合、最近答错时间，按最近优先排序
    list: (state) => {
      const byId = new Map()
      for (const m of state.items) {
        if (!byId.has(m.id)) {
          byId.set(m.id, { id: m.id, count: 0, types: new Set(), lastAt: 0 })
        }
        const entry = byId.get(m.id)
        entry.count += 1
        entry.types.add(m.type)
        entry.lastAt = Math.max(entry.lastAt, m.at || 0)
      }
      const result = []
      for (const e of byId.values()) {
        const poem = getPoemById(e.id)
        if (!poem) continue // null_guard：诗词可能被移除，跳过
        result.push({
          ...poem,
          mistakeCount: e.count,
          mistakeTypes: [...e.types],
          mistakeLastAt: e.lastAt,
        })
      }
      return result.sort((a, b) => b.mistakeLastAt - a.mistakeLastAt)
    },
    has: (state) => (id) => state.items.some((m) => m.id === id),
  },
  actions: {
    add(id, type = '游戏') {
      if (!id) return
      this.items.push({ id, type, at: Date.now() })
      this.persist()
    },
    remove(id) {
      this.items = this.items.filter((m) => m.id !== id)
      this.persist()
    },
    clear() {
      this.items = []
      this.persist()
    },
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
      } catch (e) {
        /* 忽略写入失败 */
      }
    },
  },
})
