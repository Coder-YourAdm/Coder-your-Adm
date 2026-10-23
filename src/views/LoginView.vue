<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const error = ref('')

function login() {
  const name = username.value.trim()
  if (!name) {
    error.value = '请输入一个昵称再登录～'
    return
  }
  userStore.login(name)
  const redirect =
    typeof route.query.redirect === 'string' ? route.query.redirect : '/profile'
  router.replace(redirect)
}

function guest() {
  userStore.login('游客')
  router.replace('/profile')
}
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <h1 class="login-title">登录诗韵</h1>
      <p class="login-sub">
        输入昵称即可开启你的诗词之旅（无密码，纯本地体验，数据只存在本机）。
      </p>

      <form class="login-form" @submit.prevent="login">
        <label class="field">
          <span class="field-label">昵称</span>
          <input
            v-model="username"
            type="text"
            maxlength="20"
            placeholder="如：修睿"
            @input="error = ''"
          />
        </label>
        <p v-if="error" class="login-error">{{ error }}</p>
        <button class="login-button" type="submit">登录</button>
      </form>

      <button class="guest-button" type="button" @click="guest">
        游客浏览 ›
      </button>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  place-items: center;
  min-height: 62vh;
}
.login-card {
  width: min(100%, 420px);
  padding: 2.4rem 2rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 1.2rem;
  background: var(--card-surface, #fffefa);
  box-shadow: 0 12px 32px rgba(39, 52, 40, 0.06);
}
.login-title {
  margin: 0 0 0.4rem;
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 1.8rem;
}
.login-sub {
  margin: 0 0 1.6rem;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
  line-height: 1.7;
}
.field {
  display: grid;
  gap: 0.5rem;
}
.field-label {
  font-size: 0.85rem;
  color: var(--text, #28382e);
}
.field input {
  padding: 0.8rem 1rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.18));
  border-radius: 0.7rem;
  font: inherit;
  outline: none;
}
.field input:focus {
  border-color: var(--accent, #65846c);
  box-shadow: 0 0 0 3px rgba(101, 132, 108, 0.12);
}
.login-error {
  margin: 0.6rem 0 0;
  color: #c0392b;
  font-size: 0.85rem;
}
.login-button {
  width: 100%;
  margin-top: 1.2rem;
  padding: 0.85rem;
  border: 0;
  border-radius: 0.7rem;
  color: #fff;
  background: var(--accent, #65846c);
  font: inherit;
  font-size: 1rem;
  cursor: pointer;
  transition: filter 160ms ease;
}
.login-button:hover {
  filter: brightness(0.94);
}
.guest-button {
  width: 100%;
  margin-top: 0.8rem;
  padding: 0.6rem;
  border: 0;
  background: transparent;
  color: var(--accent, #65846c);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
}
</style>
