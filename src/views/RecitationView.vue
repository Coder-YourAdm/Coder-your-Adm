<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getAllPoems } from '@/api/poems'
import { useAudioStore } from '@/stores/audio'
import { useMistakesStore } from '@/stores/mistakes'
import { useRecitationStore } from '@/stores/recitation'

const poems = getAllPoems().filter(
  (poem) => Array.isArray(poem.content) && poem.content.some((line) => String(line || '').trim()),
)
const selectedId = ref(poems[0]?.id || '')
const currentPoem = computed(() => poems.find((poem) => poem.id === selectedId.value))
const targetLines = computed(() =>
  (currentPoem.value?.content || []).filter((line) => String(line || '').trim()).slice(0, 2),
)
const targetText = computed(() => targetLines.value.join(''))

const audioStore = useAudioStore()
const mistakesStore = useMistakesStore()
const recitationStore = useRecitationStore()
const recording = ref(false)
const hasRecording = ref(false)
const elapsedSeconds = ref(0)
const transcript = ref('')
const status = ref('选择一首诗，允许麦克风后开始朗诵。')
const errorMessage = ref('')
const audioMessage = ref('')
const scoreResult = ref(null)
const recordingUrl = ref('')
const speechRecognitionAvailable = ref(false)

let mediaRecorder = null
let speechRecognition = null
let mediaStream = null
let chunks = []
let timerId = null
let startedAt = 0
let isUnmounting = false
let recorderStopped = false
let recognitionEnded = false

const soundSource = `${import.meta.env.BASE_URL}audio/gugugaga.mp3`
const recentResults = computed(() => recitationStore.results.slice(0, 5))

function normalizeText(text) {
  return Array.from(String(text || '').replace(/[\s，。！？、；：,.!?;:"“”‘’（）()《》【】…—\-]/g, ''))
}

function calculateAccuracy(expected, actual) {
  const left = normalizeText(expected)
  const right = normalizeText(actual)
  if (!left.length) return 0

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row]
    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + substitutionCost,
      )
    }
    previous = current
  }

  return Math.max(0, Math.round((1 - previous[right.length] / Math.max(left.length, right.length)) * 100))
}

function closeStream() {
  if (!mediaStream) return
  mediaStream.getTracks().forEach((track) => track.stop())
  mediaStream = null
}

function finishRecording() {
  hasRecording.value = true
  recording.value = false
  clearInterval(timerId)
  timerId = null
  closeStream()

  if (chunks.length) {
    const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
    if (recordingUrl.value) URL.revokeObjectURL(recordingUrl.value)
    recordingUrl.value = URL.createObjectURL(blob)
  }

  mediaRecorder = null
  speechRecognition = null

  if (transcript.value.trim()) {
    scoreRecording()
  } else {
    status.value = speechRecognitionAvailable.value
      ? '录音完成，未识别到诗句；可编辑识别文本后手动评分。'
      : '录音完成；此浏览器没有语音识别，请填写识别文本后评分。'
  }
}

async function startRecording() {
  if (!currentPoem.value || !targetText.value) {
    errorMessage.value = '当前没有可朗诵的诗句。'
    return
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    errorMessage.value = '录音需要安全上下文（HTTPS 或 localhost）及支持 MediaRecorder 的浏览器。'
    return
  }

  errorMessage.value = ''
  audioMessage.value = ''
  scoreResult.value = null
  transcript.value = ''
  chunks = []
  hasRecording.value = false
  recorderStopped = false
  recognitionEnded = false
  elapsedSeconds.value = 0
  speechRecognitionAvailable.value = Boolean(
    window.SpeechRecognition || window.webkitSpeechRecognition,
  )

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : ''
    mediaRecorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data)
    }
    mediaRecorder.onstop = () => {
      if (isUnmounting) {
        closeStream()
        mediaRecorder = null
      } else {
        recorderStopped = true
        if (!speechRecognition || recognitionEnded) finishRecording()
      }
    }
    mediaRecorder.onerror = () => {
      errorMessage.value = '录音过程中发生错误，请检查麦克风后重试。'
      if (mediaRecorder?.state !== 'inactive') mediaRecorder?.stop()
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (Recognition) {
      speechRecognition = new Recognition()
      speechRecognition.lang = 'zh-CN'
      speechRecognition.continuous = true
      speechRecognition.interimResults = true
      speechRecognition.onend = () => {
        if (isUnmounting) return
        recognitionEnded = true
        if (recorderStopped) finishRecording()
      }
      speechRecognition.onresult = (event) => {
        transcript.value = Array.from(event.results)
          .map((result) => result[0]?.transcript || '')
          .join('')
      }
      speechRecognition.onerror = (event) => {
        const messages = {
          'not-allowed': '语音识别未获授权；录音仍可继续，结束后可手动填写识别文本。',
          'no-speech': '暂未识别到语音，请继续朗诵或停止录音。',
          network: '语音识别服务暂不可用；录音仍可继续，之后可手动填写文本。',
        }
        status.value = messages[event.error] || `语音识别提示：${event.error}`
      }
    }

    mediaRecorder.start()
    recording.value = true
    startedAt = Date.now()
    timerId = setInterval(() => {
      elapsedSeconds.value = Math.floor((Date.now() - startedAt) / 1000)
    }, 250)

    if (speechRecognition) {
      try {
        speechRecognition.start()
        status.value = '正在录音并识别普通话；请朗诵屏幕上的诗句。'
      } catch (error) {
        speechRecognition = null
        status.value = '语音识别无法启动；录音仍可继续，结束后可手动填写文本。'
      }
    } else {
      status.value = '正在录音；当前浏览器不支持自动识别，结束后可手动填写文本。'
    }
  } catch (error) {
    closeStream()
    mediaRecorder = null
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      errorMessage.value = '麦克风权限被拒绝，请在浏览器地址栏的站点设置中允许麦克风。'
    } else if (error.name === 'NotFoundError') {
      errorMessage.value = '没有找到可用麦克风，请连接设备后重试。'
    } else {
      errorMessage.value = `无法开始录音：${error.message || '未知错误'}`
    }
  }
}

function stopRecording() {
  if (!recording.value) return
  speechRecognition?.stop()
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
}

function playSoundEffect() {
  if (!audioStore.soundEffectsEnabled) return
  const audio = new Audio(soundSource)
  audio.volume = Math.min(0.5, audioStore.volume)
  audio.play().catch((error) => {
    audioMessage.value = error.name === 'NotAllowedError'
      ? '浏览器暂未允许播放音效；点击页面后再试。'
      : '趣味音效播放失败，请检查音频文件。'
  })
}

function scoreRecording() {
  if (!hasRecording.value) {
    errorMessage.value = '请先完成录音，再提交识别文本评分。'
    return
  }

  const spoken = transcript.value.trim()
  if (!spoken) {
    errorMessage.value = '请先录音并等待识别，或手动填写识别文本。'
    return
  }

  errorMessage.value = ''
  const accuracy = calculateAccuracy(targetText.value, spoken)
  const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
  const charactersPerSecond = normalizeText(spoken).length / duration
  const fluency = Math.max(0, Math.round(100 - Math.min(100, Math.abs(charactersPerSecond - 3) * 18)))
  const total = Math.round(accuracy * 0.8 + fluency * 0.2)

  scoreResult.value = { total, accuracy, fluency }
  status.value = accuracy < 80
    ? '本次有些字句还不够准确，已加入背诗卡，练熟后再来挑战。'
    : '朗诵完成，继续保持。'
  recitationStore.add({
    poemId: currentPoem.value.id,
    score: total,
    accuracy,
    fluency,
    duration,
    transcript: spoken,
  })
  if (accuracy < 80) mistakesStore.add(currentPoem.value.id, '朗诵')
  playSoundEffect()
}

function handlePoemChange() {
  scoreResult.value = null
  transcript.value = ''
  hasRecording.value = false
  status.value = '选择一首诗，允许麦克风后开始朗诵。'
  if (recordingUrl.value) URL.revokeObjectURL(recordingUrl.value)
  recordingUrl.value = ''
}

onBeforeUnmount(() => {
  isUnmounting = true
  clearInterval(timerId)
  speechRecognition?.abort()
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
  closeStream()
  if (recordingUrl.value) URL.revokeObjectURL(recordingUrl.value)
})
</script>

<template>
  <main class="recitation-page">
    <header class="page-heading">
      <p class="eyebrow">游戏 · 朗诵练习</p>
      <h1>把诗句读给春风听</h1>
      <p>使用浏览器语音识别比对字句，并按朗诵节奏估算流畅度。</p>
    </header>

    <section class="recitation-card">
      <label class="poem-select-label" for="recitation-poem">选择练习诗词</label>
      <select id="recitation-poem" v-model="selectedId" :disabled="recording" @change="handlePoemChange">
        <option v-for="poem in poems" :key="poem.id" :value="poem.id">
          {{ poem.dynasty }} · {{ poem.author }}《{{ poem.title }}》
        </option>
      </select>

      <div v-if="currentPoem && targetLines.length" class="recitation-target">
        <p class="poem-meta">{{ currentPoem.author }} · {{ currentPoem.dynasty }} · {{ currentPoem.title }}</p>
        <p v-for="(line, index) in targetLines" :key="index" class="target-line">{{ line }}</p>
        <p class="target-hint">先练前两句；识别结果可手动修正后评分。</p>
      </div>

      <div class="record-actions">
        <button v-if="!recording" class="primary-button" type="button" @click="startRecording">
          开始录音
        </button>
        <button v-else class="stop-button" type="button" @click="stopRecording">
          停止录音 · {{ elapsedSeconds }} 秒
        </button>
        <button
          class="sound-button"
          type="button"
          :aria-pressed="audioStore.soundEffectsEnabled"
          @click="audioStore.setSoundEffectsEnabled(!audioStore.soundEffectsEnabled)"
        >
          趣味音效：{{ audioStore.soundEffectsEnabled ? '开' : '关' }}
        </button>
      </div>

      <label class="transcript-label" for="recitation-transcript">识别文本（可编辑）</label>
      <textarea
        id="recitation-transcript"
        v-model="transcript"
        rows="3"
        :disabled="recording"
        placeholder="录音后会显示语音识别结果；若浏览器不支持自动识别，也可在此手动填写。"
      />
      <button
        class="score-button"
        type="button"
        :disabled="recording || !hasRecording || !transcript.trim() || !currentPoem"
        @click="scoreRecording"
      >
        计算朗诵得分
      </button>

      <audio v-if="recordingUrl" class="recording-preview" controls :src="recordingUrl">
        当前浏览器无法播放此录音。
      </audio>

      <p class="status-message" role="status">{{ status }}</p>
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
      <p v-if="audioMessage" class="error-message" role="status">{{ audioMessage }}</p>

      <section v-if="scoreResult" class="score-result" aria-live="polite">
        <div class="score-main">
          <strong>{{ scoreResult.total }}</strong>
          <span>综合分</span>
        </div>
        <div class="score-part"><strong>{{ scoreResult.accuracy }}%</strong><span>字句准确度</span></div>
        <div class="score-part"><strong>{{ scoreResult.fluency }}%</strong><span>节奏流畅度估算</span></div>
      </section>

      <p class="score-note">
        评分基于浏览器识别文本与原诗的字句相似度；流畅度仅按录音时长估算，不代表专业语音测评。
        语音识别能力取决于浏览器，可能需要网络连接。
      </p>
    </section>

    <section v-if="recentResults.length" class="history-section">
      <h2>最近练习</h2>
      <ul>
        <li v-for="(result, index) in recentResults" :key="`${result.poemId}-${result.at}-${index}`">
          <span>{{ poems.find((poem) => poem.id === result.poemId)?.title || '诗词' }}</span>
          <span>综合 {{ result.score }} · 准确 {{ result.accuracy }}%</span>
        </li>
      </ul>
    </section>

    <RouterLink class="back-link" :to="{ name: 'game' }">返回游戏中心</RouterLink>
  </main>
</template>

<style scoped>
.recitation-page {
  width: min(100%, 760px);
  margin: 0 auto;
}

.page-heading {
  margin-bottom: 1.7rem;
  text-align: center;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: var(--accent, #65846c);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
}

.page-heading h1 {
  margin: 0 0 0.55rem;
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: clamp(1.7rem, 5vw, 2.35rem);
}

.page-heading > p:last-child,
.target-hint,
.score-note {
  color: var(--text-secondary, #718071);
  font-size: 0.82rem;
  line-height: 1.8;
}

.recitation-card,
.history-section {
  padding: clamp(1.1rem, 4vw, 1.8rem);
  border: 1px solid var(--border, rgba(47, 63, 49, 0.12));
  border-radius: 1.2rem;
  background: var(--card-surface, #fffefa);
  box-shadow: 0 12px 32px rgba(39, 52, 40, 0.045);
}

.poem-select-label,
.transcript-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary, #718071);
  font-size: 0.8rem;
}

.recitation-card select,
.recitation-card textarea {
  width: 100%;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--border, rgba(47, 63, 49, 0.18));
  border-radius: 0.7rem;
  color: var(--text, #28382e);
  background: var(--card-surface, #fffefa);
  font: inherit;
}

.recitation-target {
  margin: 1.3rem 0;
  padding: 1.25rem 1rem;
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--accent, #65846c) 7%, transparent);
  text-align: center;
}

.poem-meta {
  margin-bottom: 0.8rem;
  color: var(--text-secondary, #718071);
  font-size: 0.78rem;
}

.target-line {
  font-family: var(--poem-font, "Songti SC", serif);
  font-size: clamp(1.2rem, 4vw, 1.55rem);
  line-height: 1.9;
}

.target-hint {
  margin-top: 0.5rem;
}

.record-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 1.2rem;
}

.primary-button,
.stop-button,
.sound-button,
.score-button {
  min-height: 2.75rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--accent, #65846c);
  border-radius: 0.7rem;
  color: #fff;
  background: var(--accent, #65846c);
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
}

.stop-button {
  border-color: #b84d3f;
  background: #b84d3f;
}

.sound-button {
  color: var(--accent, #65846c);
  background: transparent;
}

.score-button {
  width: 100%;
  margin-top: 0.7rem;
}

.score-button:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.recording-preview {
  width: 100%;
  margin-top: 1rem;
}

.status-message,
.error-message {
  margin-top: 0.8rem;
  color: var(--text-secondary, #718071);
  font-size: 0.82rem;
  line-height: 1.6;
}

.error-message {
  color: #a33b2f;
}

.score-result {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.3rem;
  padding: 1.1rem;
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--accent, #65846c) 8%, transparent);
  text-align: center;
}

.score-result > div {
  display: grid;
  gap: 0.3rem;
}

.score-main strong {
  color: var(--accent, #65846c);
  font-size: 2rem;
}

.score-part strong {
  font-size: 1.2rem;
}

.score-result span {
  color: var(--text-secondary, #718071);
  font-size: 0.72rem;
}

.score-note {
  margin-top: 1rem;
  font-size: 0.72rem;
}

.history-section {
  margin-top: 1rem;
}

.history-section h2 {
  margin: 0 0 0.8rem;
  font-size: 1rem;
}

.history-section ul {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.history-section li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--border, rgba(47, 63, 49, 0.1));
  font-size: 0.8rem;
}

.history-section li span:last-child {
  color: var(--text-secondary, #718071);
  white-space: nowrap;
}

.back-link {
  display: inline-block;
  margin-top: 1.2rem;
  color: var(--accent, #65846c);
  font-size: 0.85rem;
  text-decoration: none;
}
</style>
