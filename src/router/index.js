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
  { path: '/',               name: 'home',         component: HomeView },
  { path: '/category',       name: 'category',     component: CategoryView },
  { path: '/category/:type', name: 'categoryList', component: CategoryListView },
  { path: '/poem/:id',       name: 'poem',         component: PoemView },
  { path: '/search',         name: 'search',       component: SearchView },
  { path: '/game',           name: 'game',         component: GameView },
  // 静态子路径放在动态路由前
  { path: '/game/feihua',    name: 'feihua',       component: FeihuaView },
  { path: '/game/fill',      name: 'fill',         component: FillView },
  { path: '/profile',        name: 'profile',      component: ProfileView },
  { path: '/login',          name: 'login',        component: LoginView },
  { path: '/settings',       name: 'settings',     component: SettingsView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router