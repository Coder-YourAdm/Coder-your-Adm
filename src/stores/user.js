import { defineStore } from 'pinia'

// 用户登录态：纯前端模拟，无后端。
// 持久化 key 与张雅萱的 shiyun-display 区分开，避免互相覆盖。
const STORAGE_KEY = 'shiyun-user'

function readUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data && typeof data.username === 'string') {
        return { isLoggedIn: !!data.isLoggedIn, username: data.username }
      }
    }
  } catch (e) {
    /* 本地数据损坏时忽略，回退到未登录态 */
  }
  return { isLoggedIn: false, username: '' }
}

export const useUserStore = defineStore('user', {
  state: () => readUser(),
  actions: {
    login(username) {
      const name = (username || '').trim() || '游客'
      this.username = name
      this.isLoggedIn = true
      this.persist()
    },
    logout() {
      this.isLoggedIn = false
      this.username = ''
      this.persist()
    },
    persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ isLoggedIn: this.isLoggedIn, username: this.username }),
        )
      } catch (e) {
        /* 隐私模式等无法写入时静默忽略 */
      }
    },
  },
})
