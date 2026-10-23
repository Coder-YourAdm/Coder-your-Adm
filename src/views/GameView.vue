<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const games = [
  { name: '飞花令', desc: '限时说出含指定字的诗句', to: 'feihua', icon: '❀' },
  { name: '诗词填空', desc: '补全句中缺失的一个字', to: 'fill', icon: '✎' },
]
</script>

<template>
  <main class="game-page">
    <h1 class="game-title">游戏中心</h1>
    <p class="game-desc">在诗词里玩起来，边玩边记。</p>

    <div class="game-grid">
      <button
        v-for="g in games"
        :key="g.to"
        class="game-card"
        type="button"
        @click="router.push({ name: g.to })"
      >
        <span class="game-icon" aria-hidden="true">{{ g.icon }}</span>
        <span class="game-name">{{ g.name }}</span>
        <span class="game-card-desc">{{ g.desc }}</span>
      </button>
    </div>
  </main>
</template>

<style scoped>
.game-page {
  width: min(100%, 720px);
  margin: 0 auto;
}
.game-title {
  margin: 0 0 0.3rem;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.9rem;
}
.game-desc {
  margin: 0 0 2rem;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}
.game-card {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.14));
  border-radius: 1.2rem;
  background: var(--card-surface, #fffefa);
  cursor: pointer;
  font: inherit;
  transition: all 160ms ease;
}
.game-card:hover {
  border-color: var(--accent, #65846c);
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(39, 52, 40, 0.1);
}
.game-icon {
  font-size: 2.4rem;
  color: var(--accent, #65846c);
}
.game-name {
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.4rem;
  color: var(--text, #28382e);
}
.game-card-desc {
  font-size: 0.82rem;
  color: var(--text-secondary, #718071);
}
</style>
