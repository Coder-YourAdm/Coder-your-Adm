import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// 全局状态（Pinia）与路由（Vue Router 4）在此统一挂载
app.use(createPinia())
app.use(router)

app.mount('#app')
