import { createRouter, createWebHistory } from 'vue-router'

// 骨架阶段：路由表为空占位。
// 陈汝桐将在 feature/router 分支补充完整 11 个页面路由
// （首页 / 分类 / 诗详情 / 搜索 / 游戏 / 飞花令 / 填空 / 我的 / 登录 / 设置 等）。
const routes = []

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
