<script setup>
defineProps({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  dynasty: {
    type: String,
    required: true,
  },
  excerpt: {
    type: String,
    default: '',
  },
  tags: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['open'])
</script>

<template>
  <button
    class="poem-card"
    type="button"
    :aria-label="`查看诗词：${title}`"
    @click="emit('open', id)"
  >
    <span class="card-heading">
      <span class="poem-title">{{ title }}</span>
      <span class="dynasty">{{ dynasty }}</span>
    </span>
    <span class="poem-author">{{ author }}</span>
    <span v-if="excerpt" class="poem-excerpt">{{ excerpt }}</span>
    <span v-if="tags.length" class="poem-tags" aria-label="诗词标签">
      <span v-for="tag in tags" :key="tag" class="poem-tag">{{ tag }}</span>
    </span>
    <span class="card-action" aria-hidden="true">
      <span>品读诗词</span>
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M4 10h11m-4-4 4 4-4 4" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.poem-card {
  --card-accent: var(--accent, #65846c);
  --card-text: var(--text, #28382e);
  display: flex;
  width: 100%;
  min-height: 12rem;
  box-sizing: border-box;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.5rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--card-accent) 16%, transparent);
  border-radius: 1.1rem;
  color: var(--card-text);
  background:
    radial-gradient(ellipse at 100% 0%, color-mix(in srgb, var(--card-accent) 9%, transparent), transparent 60%),
    var(--card-surface, #fffefa);
  box-shadow: 0 12px 32px rgba(39, 52, 40, 0.045);
  text-align: left;
  cursor: pointer;
  font: inherit;
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.poem-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--card-accent) 38%, transparent);
  box-shadow: 0 16px 36px rgba(39, 52, 40, 0.1);
}

.poem-card:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--card-accent) 45%, transparent);
  outline-offset: 3px;
}

.card-heading {
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.poem-title {
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.45;
}

.dynasty {
  flex-shrink: 0;
  padding: 0.18rem 0.55rem;
  border: 1px solid color-mix(in srgb, var(--card-accent) 24%, transparent);
  border-radius: 999px;
  color: var(--card-accent);
  font-size: 0.72rem;
}

.poem-author {
  margin-top: 0.25rem;
  color: var(--card-accent);
  font-size: 0.82rem;
}

.poem-excerpt {
  display: -webkit-box;
  margin-top: 1rem;
  overflow: hidden;
  color: color-mix(in srgb, var(--card-text) 82%, transparent);
  font-family: var(--poem-font, "Songti SC", "SimSun", serif);
  font-size: 0.95rem;
  line-height: 1.8;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.poem-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.9rem;
}

.poem-tag {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  color: color-mix(in srgb, var(--card-accent) 88%, #28382e);
  background: color-mix(in srgb, var(--card-accent) 9%, transparent);
  font-size: 0.7rem;
}

.card-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: auto;
  padding-top: 1rem;
  color: var(--card-accent);
  font-size: 0.75rem;
}

.card-action svg {
  width: 1rem;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
  transition: transform 180ms ease;
}

.poem-card:hover .card-action svg {
  transform: translateX(3px);
}

@media (max-width: 480px) {
  .poem-card {
    min-height: 11rem;
    padding: 1.2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .poem-card,
  .card-action svg {
    transition: none;
  }
}
</style>
