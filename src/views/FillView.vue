<script setup>
import { ref, computed } from 'vue'
import { getAllPoems } from '@/api/poems'

// 过滤出有足够内容的诗词作为题库
const pool = getAllPoems().filter(
  (p) => Array.isArray(p.content) && p.content.join('').length >= 5,
)

const current = ref(null)
const score = ref(0)
const total = ref(0)
const input = ref('')
const feedback = ref('')
const started = ref(false)

const blankLine = computed(() => {
  if (!current.value) return ''
  const line = current.value.poem.content[current.value.lineIndex]
  const arr = Array.from(line)
  arr[current.value.blankIndex] = '＿'
  return arr.join('')
})

function pickQuestion() {
  if (!pool.length) return
  const poem = pool[Math.floor(Math.random() * pool.length)]
  const lineIndex = Math.floor(Math.random() * poem.content.length)
  const line = poem.content[lineIndex]
  if (line.length < 3) {
    pickQuestion() // 过短的行重抽
    return
  }
  const blankIndex = Math.floor(Math.random() * line.length)
  current.value = { poem, lineIndex, blankIndex, answer: Array.from(line)[blankIndex] }
  input.value = ''
  feedback.value = ''
  total.value += 1
}

function checkAnswer() {
  if (!current.value) return
  const guess = (input.value || '').trim()
  if (!guess) {
    feedback.value = '请填入一个字。'
    return
  }
  if (guess === current.value.answer) {
    score.value += 1
    feedback.value = '答对啦！'
  } else {
    feedback.value = `正确答案：「${current.value.answer}」`
  }
}

function nextQuestion() {
  pickQuestion()
}

function start() {
  score.value = 0
  total.value = 0
  started.value = true
  pickQuestion()
}

const accuracy = computed(() =>
  total.value ? Math.round((score.value / total.value) * 100) : 0,
)
</script>

<template>
  <main class="fill-page">
    <header class="fill-header">
      <h1>诗词填空</h1>
      <p>根据上下文补全句中缺失的一个字。</p>
    </header>

    <section class="fill-board">
      <span>得分 {{ score }}</span>
      <span>已答 {{ total }}</span>
      <span v-if="total">正确率 {{ accuracy }}%</span>
    </section>

    <section v-if="started && current" class="fill-play">
      <p class="fill-meta">{{ current.poem.author }}《{{ current.poem.title }}》</p>
      <p class="fill-line">{{ blankLine }}</p>

      <form class="fill-form" @submit.prevent="checkAnswer">
        <input
          v-model="input"
          maxlength="1"
          class="fill-input"
          placeholder="？"
          aria-label="填入缺失的字"
        />
        <button type="submit" class="fill-btn">提交</button>
      </form>

      <div class="fill-actions">
        <button type="button" class="fill-btn ghost" @click="nextQuestion">下一题</button>
      </div>

      <p v-if="feedback" class="fill-feedback">{{ feedback }}</p>
    </section>

    <section v-else class="fill-start">
      <button type="button" class="fill-btn primary" @click="start">开始</button>
    </section>
  </main>
</template>

<style scoped>
.fill-page {
  width: min(100%, 640px);
  margin: 0 auto;
}
.fill-header h1 {
  margin: 0 0 0.4rem;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.9rem;
}
.fill-header p {
  margin: 0 0 1.6rem;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}
.fill-board {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.8rem;
  font-size: 0.9rem;
  color: var(--text-secondary, #718071);
}
.fill-play {
  padding: 1.8rem;
  text-align: center;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 1.2rem;
  background: var(--card-surface, #fffefa);
}
.fill-meta {
  margin: 0 0 1rem;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}
.fill-line {
  margin: 0 0 1.6rem;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.6rem;
  line-height: 2;
  letter-spacing: 0.1em;
  color: var(--text, #28382e);
}
.fill-form {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
}
.fill-input {
  width: 3.2rem;
  height: 3.2rem;
  text-align: center;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.6rem;
  border: 1px solid var(--accent, #65846c);
  border-radius: 0.7rem;
  outline: none;
}
.fill-input:focus {
  box-shadow: 0 0 0 3px rgba(101, 132, 108, 0.15);
}
.fill-actions {
  margin-top: 1.2rem;
}
.fill-btn {
  padding: 0.7rem 1.6rem;
  border: 0;
  border-radius: 0.7rem;
  color: #fff;
  background: var(--accent, #65846c);
  font: inherit;
  cursor: pointer;
  transition: filter 160ms ease;
}
.fill-btn:hover {
  filter: brightness(0.94);
}
.fill-btn.ghost {
  background: transparent;
  color: var(--accent, #65846c);
  border: 1px solid var(--accent, #65846c);
}
.fill-btn.primary {
  padding: 0.9rem 2.4rem;
  font-size: 1.05rem;
}
.fill-feedback {
  margin: 1.2rem 0 0;
  color: var(--text, #28382e);
}
</style>
