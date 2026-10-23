<script setup>
import { RouterLink } from 'vue-router'

const games = [
  {
    name: 'feihua',
    title: '飞花令',
    subtitle: '以诗会友，飞花传令',
    description: '围绕指定诗词令字，接续吟诵含有该字的诗句。',
    symbol: '令',
    action: '开始飞花令',
  },
  {
    name: 'fill',
    title: '诗词填空',
    subtitle: '补全名句，温故知新',
    description: '根据熟悉的诗句补上缺字，在趣味挑战中积累诗词。',
    symbol: '词',
    action: '开始挑战',
  },
]
</script>

<template>
  <div class="game-page">
    <header class="page-heading">
      <p class="eyebrow">寓学于乐</p>
      <h1>诗词游戏中心</h1>
      <p>在轻松的挑战中，重温诗词里的字句与意境。</p>
    </header>

    <section class="game-grid" aria-label="选择游戏">
      <RouterLink
        v-for="game in games"
        :key="game.name"
        class="game-card"
        :to="{ name: game.name }"
      >
        <span class="game-symbol" aria-hidden="true">{{ game.symbol }}</span>
        <span class="game-subtitle">{{ game.subtitle }}</span>
        <span class="game-title">{{ game.title }}</span>
        <span class="game-description">{{ game.description }}</span>
        <span class="game-action">
          {{ game.action }}
          <span aria-hidden="true">→</span>
        </span>
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.game-page {
  width: min(100%, 900px);
  margin: 0 auto;
}

.page-heading {
  margin-bottom: 2.5rem;
  text-align: center;
}

.eyebrow {
  margin: 0 0 0.55rem;
  color: var(--accent, #65846c);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
}

.page-heading h1 {
  margin: 0 0 0.55rem;
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: clamp(2rem, 5vw, 2.8rem);
}

.page-heading > p:last-child {
  margin: 0;
  color: var(--muted, #777b70);
  font-size: 0.9rem;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.1rem;
}

.game-card {
  display: flex;
  min-height: 20rem;
  flex-direction: column;
  align-items: flex-start;
  padding: clamp(1.4rem, 4vw, 2rem);
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 16%, transparent);
  border-radius: 1.25rem;
  color: var(--text, #28382e);
  background:
    radial-gradient(ellipse at 100% 0%, color-mix(in srgb, var(--accent, #65846c) 12%, transparent), transparent 65%),
    var(--card-surface, #fffefa);
  box-shadow: 0 12px 32px rgba(39, 52, 40, 0.045);
  text-decoration: none;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.game-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--accent, #65846c) 42%, transparent);
  box-shadow: 0 16px 36px rgba(39, 52, 40, 0.1);
}

.game-card:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--accent, #65846c) 45%, transparent);
  outline-offset: 3px;
}

.game-symbol {
  display: grid;
  width: 3.5rem;
  aspect-ratio: 1;
  margin-bottom: 1.5rem;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 25%, transparent);
  border-radius: 50%;
  color: var(--accent, #65846c);
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 1.45rem;
}

.game-subtitle {
  color: var(--accent, #65846c);
  font-size: 0.78rem;
}

.game-title {
  margin-top: 0.35rem;
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 1.6rem;
  font-weight: 700;
}

.game-description {
  margin-top: 0.7rem;
  color: var(--muted, #777b70);
  font-size: 0.9rem;
  line-height: 1.8;
}

.game-action {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  margin-top: auto;
  padding-top: 1.5rem;
  color: var(--accent, #65846c);
  font-size: 0.85rem;
  font-weight: 650;
}

.game-action span {
  font-size: 1.1rem;
  transition: transform 180ms ease;
}

.game-card:hover .game-action span {
  transform: translateX(3px);
}

@media (max-width: 620px) {
  .game-grid {
    grid-template-columns: 1fr;
  }

  .game-card {
    min-height: 17rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .game-card,
  .game-action span {
    transition: none;
  }
}
</style>