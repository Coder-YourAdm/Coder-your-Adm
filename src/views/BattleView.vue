<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useBattleStore } from '@/stores/battle'

const battle = useBattleStore()
const input = ref('')

const modes = [
  { key: 'bot', icon: '🤖', title: '人机对战', desc: '与本地 AI 飞花令接力，单人即可练习。' },
  { key: 'local', icon: '💻', title: '同设备双开', desc: '开两个标签页实时对战，演示实时通信。' },
  { key: 'online', icon: '🌐', title: '联网对战', desc: '经 Supabase Realtime 联网匹配真人。' },
]

const timeColor = computed(() =>
  battle.timer <= 10 ? '#c0392b' : 'var(--accent, #65846c)',
)

function choose(mode) {
  input.value = ''
  battle.start(mode)
}

function submit() {
  battle.submit(input.value)
  input.value = ''
}

function again() {
  input.value = ''
  battle.start(battle.mode)
}

function backToLobby() {
  battle.reset()
}

onUnmounted(() => battle.reset())
</script>

<template>
  <main class="battle-page">
    <!-- 大厅 / 匹配 -->
    <template v-if="battle.phase === 'lobby' || battle.phase === 'matching'">
      <header class="page-header">
        <h1>联网对战背诗</h1>
        <p class="sub">飞花令接力：轮流说出含指定字的诗句，接不上即负。</p>
      </header>

      <section v-if="battle.phase === 'lobby'" class="mode-grid">
        <button
          v-for="m in modes"
          :key="m.key"
          type="button"
          class="mode-card"
          @click="choose(m.key)"
        >
          <span class="mode-icon" aria-hidden="true">{{ m.icon }}</span>
          <span class="mode-title">{{ m.title }}</span>
          <span class="mode-desc">{{ m.desc }}</span>
        </button>
      </section>

      <section v-else class="matching-panel">
        <span class="spinner" aria-hidden="true"></span>
        <p class="match-status">{{ battle.status }}</p>
        <button type="button" class="ghost-btn" @click="backToLobby">取消</button>
      </section>

      <p v-if="battle.note" class="note">{{ battle.note }}</p>

      <section class="record-panel">
        <h2>我的战绩</h2>
        <div class="record-row">
          <span class="rec win">胜 {{ battle.record.wins }}</span>
          <span class="rec loss">负 {{ battle.record.losses }}</span>
        </div>
      </section>
    </template>

    <!-- 对战 -->
    <template v-else-if="battle.phase === 'playing'">
      <header class="play-header">
        <button type="button" class="ghost-btn small" @click="backToLobby">‹ 退出</button>
        <div class="char-box">
          <span class="char-label">令</span>
          <span class="char">{{ battle.char }}</span>
        </div>
        <span class="round">第 {{ battle.round + 1 }} 回合</span>
      </header>

      <p class="turn-tip" :class="{ mine: battle.isMyTurn }">
        {{ battle.isMyTurn ? '轮到你了' : '对手回合' }}
        <span class="timer" :style="{ color: timeColor }">⏱ {{ battle.timer }}s</span>
      </p>

      <section class="board">
        <div class="col mine">
          <h3>我方</h3>
          <ul>
            <li v-for="(m, i) in battle.myMoves" :key="'me' + i">{{ m.text }}</li>
            <li v-if="!battle.myMoves.length" class="empty">—</li>
          </ul>
        </div>
        <div class="col opp">
          <h3>对手</h3>
          <ul>
            <li v-for="(m, i) in battle.oppMoves" :key="'op' + i">{{ m.text }}</li>
            <li v-if="!battle.oppMoves.length" class="empty">—</li>
          </ul>
        </div>
      </section>

      <p v-if="battle.status" class="status">{{ battle.status }}</p>

      <form class="play-form" @submit.prevent="submit">
        <input
          v-model="input"
          type="text"
          :disabled="!battle.isMyTurn"
          :placeholder="battle.isMyTurn ? '说出含「' + battle.char + '」的诗句…' : '等待对手…'"
          class="play-input"
          aria-label="输入诗句"
        />
        <button type="submit" class="play-btn" :disabled="!battle.isMyTurn">提交</button>
      </form>
    </template>

    <!-- 结算 -->
    <template v-else-if="battle.phase === 'result'">
      <header class="page-header">
        <h1 class="result-title" :class="{ win: battle.winner === battle.selfPlayer, loss: battle.winner !== battle.selfPlayer && battle.winner !== 'draw' }">
          {{ battle.status }}
        </h1>
      </header>

      <section class="result-panel">
        <p>共进行 <strong>{{ battle.round }}</strong> 个回合</p>
        <p class="rec-line">战绩：胜 {{ battle.record.wins }} · 负 {{ battle.record.losses }}</p>
      </section>

      <div class="result-actions">
        <button type="button" class="play-btn" @click="again">再来一局</button>
        <button type="button" class="ghost-btn" @click="backToLobby">返回大厅</button>
      </div>
    </template>
  </main>
</template>

<style scoped>
.battle-page {
  width: min(100%, 720px);
  margin: 0 auto;
}
.page-header h1 {
  margin: 0 0 0.4rem;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.9rem;
}
.sub {
  margin: 0 0 1.6rem;
  color: var(--text-secondary, #718071);
  font-size: 0.9rem;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}
.mode-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1.4rem;
  border: 1px solid color-mix(in srgb, var(--accent, #65846c) 16%, transparent);
  border-radius: 1.1rem;
  background: var(--card-surface, #fffefa);
  color: var(--text, #28382e);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.mode-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--accent, #65846c) 40%, transparent);
  box-shadow: 0 16px 36px rgba(39, 52, 40, 0.1);
}
.mode-icon {
  font-size: 1.8rem;
}
.mode-title {
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 1.25rem;
  font-weight: 700;
}
.mode-desc {
  color: var(--text-secondary, #718071);
  font-size: 0.85rem;
  line-height: 1.6;
}

.matching-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2.5rem 1rem;
}
.spinner {
  width: 2.4rem;
  height: 2.4rem;
  border: 3px solid color-mix(in srgb, var(--accent, #65846c) 25%, transparent);
  border-top-color: var(--accent, #65846c);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.match-status {
  margin: 0;
  color: var(--text, #28382e);
  text-align: center;
}

.note {
  margin: 1.2rem 0 0;
  padding: 0.8rem 1rem;
  border-radius: 0.7rem;
  background: rgba(101, 132, 108, 0.1);
  color: var(--accent, #65846c);
  font-size: 0.85rem;
}

.record-panel {
  margin-top: 2rem;
  padding: 1.2rem 1.4rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.14));
  border-radius: 1.1rem;
  background: var(--card-surface, #fffefa);
}
.record-panel h2 {
  margin: 0 0 0.8rem;
  font-size: 1.1rem;
}
.record-row {
  display: flex;
  gap: 1rem;
}
.rec {
  padding: 0.3rem 0.9rem;
  border-radius: 999px;
  font-size: 0.9rem;
}
.rec.win { color: #2e7d32; background: rgba(46, 125, 50, 0.12); }
.rec.loss { color: #c0392b; background: rgba(192, 57, 43, 0.1); }

.ghost-btn {
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--accent, #65846c);
  border-radius: 999px;
  background: rgba(90, 165, 106, 0.06);
  color: var(--accent, #65846c);
  font: inherit;
  cursor: pointer;
}
.ghost-btn.small {
  padding: 0.35rem 0.8rem;
  font-size: 0.82rem;
}

.play-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.char-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.char-label {
  padding: 0.2rem 0.6rem;
  border-radius: 0.5rem;
  background: var(--accent, #65846c);
  color: #fff;
  font-size: 0.8rem;
}
.char {
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent, #65846c);
}
.round {
  color: var(--text-secondary, #718071);
  font-size: 0.85rem;
}

.turn-tip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 1.2rem;
  color: var(--text-secondary, #718071);
  font-size: 0.95rem;
}
.turn-tip.mine {
  color: var(--accent, #65846c);
  font-weight: 600;
}
.timer {
  font-variant-numeric: tabular-nums;
}

.board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.2rem;
}
.col {
  padding: 1rem 1.2rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 1rem;
  background: var(--card-surface, #fffefa);
  min-height: 8rem;
}
.col h3 {
  margin: 0 0 0.8rem;
  font-size: 0.95rem;
  color: var(--text, #28382e);
}
.col.mine h3 { color: var(--accent, #65846c); }
.col ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.5rem;
}
.col li {
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: 0.95rem;
  line-height: 1.6;
}
.col li.empty {
  color: var(--text-secondary, #718071);
}

.status {
  margin: 0 0 1rem;
  text-align: center;
  color: var(--text, #28382e);
  font-size: 0.9rem;
}

.play-form {
  display: flex;
  gap: 0.6rem;
}
.play-input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.18));
  border-radius: 0.7rem;
  font: inherit;
  outline: none;
}
.play-input:focus {
  border-color: var(--accent, #65846c);
  box-shadow: 0 0 0 3px rgba(101, 132, 108, 0.12);
}
.play-btn {
  padding: 0.8rem 1.6rem;
  border: 0;
  border-radius: 0.7rem;
  color: #fff;
  background: var(--accent, #65846c);
  font: inherit;
  cursor: pointer;
  transition: filter 160ms ease;
}
.play-btn:hover:not(:disabled) { filter: brightness(0.94); }
.play-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.result-title.win { color: #2e7d32; }
.result-title.loss { color: #c0392b; }
.result-panel {
  padding: 1.6rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 1.1rem;
  background: var(--card-surface, #fffefa);
  text-align: center;
}
.result-panel p { margin: 0.3rem 0; }
.rec-line { color: var(--text-secondary, #718071); }
.result-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: center;
  margin-top: 1.6rem;
}

@media (max-width: 520px) {
  .board { grid-template-columns: 1fr; }
}
</style>
