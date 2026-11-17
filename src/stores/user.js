
import { defineStore } from 'pinia'

// 用户登录态和头像信息统一保存在 shiyun-user 中
const STORAGE_KEY = 'shiyun-user'

function readUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (raw) {
      const data = JSON.parse(raw)

      if (data && typeof data.username === 'string') {
        return {
          isLoggedIn: !!data.isLoggedIn,
          username: data.username,
          avatar: typeof data.avatar === 'string' ? data.avatar : '',
        }
      }
    }
  } catch (e) {
    // 本地数据损坏时忽略，回退到未登录态
  }

  return {
    isLoggedIn: false,
    username: '',
    avatar: '',
  }
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

    setAvatar(avatar) {
      this.avatar = avatar || ''
      this.persist()
    },

    removeAvatar() {
      this.avatar = ''
      this.persist()
    },

    persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            isLoggedIn: this.isLoggedIn,
            username: this.username,
            avatar: this.avatar,
          }),
        )
      } catch (e) {
        // 存储空间不足或浏览器限制时，不影响其他用户状态
      }
    },
  },
})
