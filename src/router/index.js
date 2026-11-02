import { createRouter, createWebHistory } from 'vue-router'

// 使用懒加载方式引入页面，加快首屏加载速度
const HomeView         = () => import('../views/HomeView.vue')
const CategoryView     = () => import('../views/CategoryView.vue')
const CategoryListView = () => import('../views/CategoryListView.vue')
const PoemView         = () => import('../views/PoemView.vue')
const SearchView       = () => import('../views/SearchView.vue')
const GameView         = () => import('../views/GameView.vue')
const FeihuaView       = () => import('../views/FeihuaView.vue')
const FillView         = () => import('../views/FillView.vue')
const ProfileView      = () => import('../views/ProfileView.vue')
const LoginView        = () => import('../views/LoginView.vue')
const SettingsView     = () => import('../views/SettingsView.vue')

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/category', name: 'category', component: CategoryView },

  {
    path: '/category/:type',
    name: 'categoryList',
    component: CategoryListView,
    meta: { showBack: true, backFallback: '/category' },
  },
  {
    path: '/poem/:id',
    name: 'poem',
    component: PoemView,
    meta: { showBack: true, backFallback: '/' },
  },
  {
    path: '/search',
    name: 'search',
    component: SearchView,
    meta: { showBack: true, backFallback: '/' },
  },

  { path: '/game', name: 'game', component: GameView },
  {
    path: '/game/feihua',
    name: 'feihua',
    component: FeihuaView,
    meta: { showBack: true, backFallback: '/game' },
  },
  {
    path: '/game/fill',
    name: 'fill',
    component: FillView,
    meta: { showBack: true, backFallback: '/game' },
  },

  { path: '/profile', name: 'profile', component: ProfileView },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { showBack: true, backFallback: '/profile' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { showBack: true, backFallback: '/profile' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// App 内部访问记录，不直接依赖浏览器后退
const appRouteStack = []

let isAppBackNavigation = false
let isBrowserHistoryNavigation = false

// 识别浏览器原生前进/后退，保持内部记录同步
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    isBrowserHistoryNavigation = true
  })
}

// 记录正常的 App 内页面跳转
router.afterEach((to, from, failure) => {
  if (failure) {
    isAppBackNavigation = false
    isBrowserHistoryNavigation = false
    return
  }

  // 用户使用浏览器原生前进/后退时，同步内部访问记录
  if (isBrowserHistoryNavigation) {
    isBrowserHistoryNavigation = false

    let previousIndex = -1

    for (let i = appRouteStack.length - 1; i >= 0; i--) {
      if (appRouteStack[i] === to.fullPath) {
        previousIndex = i
        break
      }
    }

    if (previousIndex >= 0) {
      appRouteStack.splice(previousIndex + 1)
    } else {
      appRouteStack.push(to.fullPath)
    }

    return
  }

  // 自定义返回操作不应再次加入访问记录
  if (isAppBackNavigation) {
    isAppBackNavigation = false
    return
  }

  // 记录应用首次进入的页面
  if (from.matched.length === 0) {
    appRouteStack.push(to.fullPath)
    return
  }

  if (to.fullPath !== from.fullPath) {
    appRouteStack.push(to.fullPath)

    // 限制记录数量，避免无限增长
    if (appRouteStack.length > 50) {
      appRouteStack.shift()
    }
  }
})

// App 内统一返回方法
export function goAppBack(fallback = '/') {
  const currentRoute = router.currentRoute.value
  const currentIndex = appRouteStack.lastIndexOf(currentRoute.fullPath)

  // 优先返回 App 内上一个访问过的页面
  if (currentIndex > 0) {
    const previousRoute = appRouteStack[currentIndex - 1]

    appRouteStack.splice(currentIndex)
    isAppBackNavigation = true

    return router.push(previousRoute)
  }

  // 没有可用的内部历史记录时，使用页面预设的返回位置
  const fallbackRoute = currentRoute.meta.backFallback || fallback

  if (fallbackRoute === currentRoute.fullPath) {
    return Promise.resolve()
  }

  appRouteStack.splice(0, appRouteStack.length, fallbackRoute)
  isAppBackNavigation = true

  return router.push(fallbackRoute)
}

export default router
