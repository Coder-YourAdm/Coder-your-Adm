<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { getPoemsByContent } from '@/api/poems'

// 飞花令字库（常用且诗词中出现频率高）
const CHAR_POOL = [
  '花', '月', '风', '雪', '山', '水', '春', '秋',
  '云', '雨', '江', '日', '柳', '人', '夜', '红',
]

const score = ref(0)
const round = ref(0)
const currentChar = ref('')
const references = ref([])
const input = ref('')
const feedback = ref('')
const timer = ref(30)
const gameActive = ref(false)
let timerId = null

const timeColor = computed(() =>
  timer.value <= 10 ? '#c0392b' : 'var(--accent, #65846c)',
)

function startTimer() {
  clearInterval(timerId)
  timerId = setInterval(() => {
    timer.value -= 1
    if (timer.value <= 0) {
      clearInterval(timerId)
      gameActive.value = false
      feedback.value = `时间到！含「${currentChar.value}」的参考诗句见下方。`
    }
  }, 1000)
}

function startRound() {
  currentChar.value = CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)]
  // 取含该字的诗句作为参考答案（最多 6 条）
  references.value = getPoemsByContent(currentChar.value).slice(0, 6)
  input.value = ''
  feedback.value = ''
  timer.value = 30
  round.value += 1
  gameActive.value = true
  startTimer()
}

function checkAnswer() {
  const text = input.value.trim()
  if (!text) {
    feedback.value = '请先输入一句诗。'
    return
  }
  if (!text.includes(currentChar.value)) {
    feedback.value = `这句里没有「${currentChar.value}」哦，再试试。`
    return
  }
  score.value += 1
  feedback.value = '答对啦！+1 分'
  clearInterval(timerId)
  gameActive.value = false
}

function nextRound() {
  startRound()
}

function showHint() {
  if (references.value.length) {
    const pick = references.value[Math.floor(Math.random() * references.value.length)]
    feedback.value = `提示：${pick.author}《${pick.title}》— ${pick.content.join('')}`
  } else {
    feedback.value = '暂无可参考的诗句，换个字试试。'
  }
}

function restart() {
  score.value = 0
  round.value = 0
  clearInterval(timerId)
  startRound()
}

onUnmounted(() => clearInterval(timerId))
</script>

<template>
  <main class="feihua-page">
    <header class="fh-header">
      <h1>飞花令</h1>
      <p>说出一句含有指定字的诗，限时 30 秒，答对得分。</p>
    </header>

    <section class="fh-board">
      <div class="fh-stat">
        <span class="fh-num">{{ score }}</span><span class="fh-label">得分</span>
      </div>
      <div class="fh-stat">
        <span class="fh-num">{{ round }}</span><span class="fh-label">回合</span>
      </div>
      <div class="fh-stat">
        <span class="fh-num" :style="{ color: timeColor }">{{ timer }}</span>
        <span class="fh-label">秒</span>
      </div>
    </section>

    <section v-if="gameActive || currentChar" class="fh-play">
      <p class="fh-char-line">
        请说出含 <span class="fh-char">「{{ currentChar }}」</span> 的诗句
      </p>

      <form class="fh-form" @submit.prevent="checkAnswer">
        <input
          v-model="input"
          type="text"
          :disabled="!gameActive"
          placeholder="在此输入一句诗…"
          class="fh-input"
        />
        <button type="submit" class="fh-btn" :disabled="!gameActive">提交</button>
      </form>

      <div class="fh-actions">
        <button type="button" class="fh-btn ghost" @click="showHint">提示</button>
        <button type="button" class="fh-btn ghost" :disabled="gameActive" @click="nextRound">
          下一字
        </button>
        <button type="button" class="fh-btn ghost" @click="restart">重新开始</button>
      </div>

      <p v-if="feedback" class="fh-feedback">{{ feedback }}</p>
    </section>

    <section v-else class="fh-start">
      <button type="button" class="fh-btn primary" @click="restart">开始游戏</button>
    </section>

    <section v-if="references.length" class="fh-refs">
      <h2>参考答案</h2>
      <ul>
        <li v-for="(p, i) in references" :key="i">
          <span class="ref-line">{{ p.content.join('') }}</span>
          <span class="ref-meta">— {{ p.author }}《{{ p.title }}》</span>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.feihua-page {
  width: min(100%, 720px);
  margin: 0 auto;
}
.fh-header h1 {
  margin: 0 0 0.4rem;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.9rem;
}
.fh-header p {
  margin: 0 0 1.6rem;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}
.fh-board {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.8rem;
}
.fh-stat {
  flex: 1;
  display: grid;
  justify-items: center;
  gap: 0.2rem;
  padding: 1rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 1rem;
  background: var(--card-surface, #fffefa);
}
.fh-num {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--accent, #65846c);
}
.fh-label {
  font-size: 0.75rem;
  color: var(--text-secondary, #718071);
}
.fh-play {
  padding: 1.6rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 1.2rem;
  background: var(--card-surface, #fffefa);
}
.fh-char-line {
  margin: 0 0 1.2rem;
  font-size: 1.1rem;
  text-align: center;
}
.fh-char {
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.6rem;
  color: var(--accent, #65846c);
}
.fh-form {
  display: flex;
  gap: 0.6rem;
}
.fh-input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.18));
  border-radius: 0.7rem;
  font: inherit;
  outline: none;
}
.fh-input:focus {
  border-color: var(--accent, #65846c);
  box-shadow: 0 0 0 3px rgba(101, 132, 108, 0.12);
}
.fh-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}
.fh-btn {
  padding: 0.7rem 1.2rem;
  border: 0;
  border-radius: 0.7rem;
  color: #fff;
  background: var(--accent, #65846c);
  font: inherit;
  cursor: pointer;
  transition: filter 160ms ease;
}
.fh-btn:hover:not(:disabled) {
  filter: brightness(0.94);
}
.fh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.fh-btn.ghost {
  background: transparent;
  color: var(--accent, #65846c);
  border: 1px solid var(--accent, #65846c);
}
.fh-btn.primary {
  display: block;
  margin: 0 auto;
  padding: 0.9rem 2.4rem;
  font-size: 1.05rem;
}
.fh-feedback {
  margin: 1rem 0 0;
  text-align: center;
  color: var(--text, #28382e);
}
.fh-refs {
  margin-top: 1.8rem;
}
.fh-refs h2 {
  font-size: 1rem;
  color: var(--text-secondary, #718071);
}
.fh-refs ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}
.fh-refs li {
  padding: 0.7rem 1rem;
  border-radius: 0.6rem;
  background: var(--card-surface, #fffefa);
  border: 1px solid var(--border, rgba(47, 63, 49, 0.1));
}
.ref-line {
  font-family: var(--poem-font, "Songti SC", serif);
}
.ref-meta {
  margin-left: 0.5rem;
  color: var(--text-secondary, #718071);
  font-size: 0.8rem;
}
</style>
