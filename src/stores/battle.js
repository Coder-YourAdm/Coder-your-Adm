import { defineStore } from 'pinia'
import { getPoemsByContent } from '@/api/poems'
import { isSupabaseConfigured, getSupabase } from '@/supabase/client'

// 联网对战背诗（S3-T05）：飞花令接力。
// 三种通道：bot（人机，单人可玩）/ local（同浏览器两个标签页真实对战）
//            / online（Supabase Realtime，未配置时自动降级到 local）。
// 规则：整局共用一个令字，双方轮流各说一句含该字的诗句，
//       说不出 / 超时 / 重复 即判负，对方胜。

const CHAR_POOL = ['花', '月', '风', '雪', '山', '水', '春', '秋', '云', '雨', '江', '日', '柳', '人', '夜', '红']
const TURN_SECONDS = 30
const RECORD_KEY = 'shiyun-battle-record'

function readRecord() {
  try {
    const raw = localStorage.getItem(RECORD_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (d && typeof d.wins === 'number') return d
    }
  } catch (e) {
    /* 忽略损坏数据 */
  }
  return { wins: 0, losses: 0, draws: 0 }
}

function randChar() {
  return CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)]
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function createLocalTransport(selfId) {
  const bc = new BroadcastChannel('shiyun-battle')
  return {
    send: (msg) => bc.postMessage(msg),
    on: (cb) => { bc.onmessage = (e) => cb(e.data) },
    close: () => bc.close(),
  }
}

export const useBattleStore = defineStore('battle', {
  state: () => ({
    mode: '',          // 'bot' | 'local' | 'online'
    phase: 'lobby',    // 'lobby' | 'matching' | 'playing' | 'result'
    char: '',          // 当前令字
    turn: 0,           // 0 = 玩家A先手, 1 = 玩家B
    selfPlayer: 0,     // 本窗口扮演的玩家编号
    moves: [],         // [{ by: 0|1, text, ok }]
    usedLines: [],     // 已用诗句文本（去重）
    usedIds: [],       // 已用诗词 id（机器人避免重复选诗）
    timer: 0,
    timerId: null,
    status: '',
    winner: null,      // 0 / 1 / 'draw' / null
    round: 0,
    selfId: Math.random().toString(36).slice(2),
    transport: null,   // 本地 BroadcastChannel 封装
    channel: null,     // Supabase Realtime channel
    record: readRecord(),
    note: '',
    waitingOpponent: false,
    _matchTimer: null,
    _botTimer: null,
  }),

  getters: {
    isMyTurn: (s) => s.turn === s.selfPlayer,
    myMoves: (s) => s.moves.filter((m) => m.by === s.selfPlayer),
    oppMoves: (s) => s.moves.filter((m) => m.by !== s.selfPlayer),
    isOver: (s) => s.phase === 'result',
  },

  actions: {
    reset() {
      this.clearTimer()
      if (this._botTimer) { clearTimeout(this._botTimer); this._botTimer = null }
      if (this._matchTimer) { clearTimeout(this._matchTimer); this._matchTimer = null }
      if (this.transport) { this.transport.close(); this.transport = null }
      if (this.channel) { try { this.channel.unsubscribe() } catch (e) {} this.channel = null }
      this.mode = ''
      this.phase = 'lobby'
      this.char = ''
      this.turn = 0
      this.selfPlayer = 0
      this.moves = []
      this.usedLines = []
      this.usedIds = []
      this.timer = 0
      this.status = ''
      this.winner = null
      this.round = 0
      this.note = ''
      this.waitingOpponent = false
    },

    async start(mode) {
      this.reset()
      this.mode = mode
      if (mode === 'bot') return this.startBot()
      if (mode === 'local') return this.startLocal()
      if (mode === 'online') return this.startOnline()
    },

    // —— bot 模式：与本地 AI 对战 ——
    startBot() {
      this.selfPlayer = 0
      this.char = randChar()
      this.turn = 0
      this.phase = 'playing'
      this.status = `你先手，说出含「${this.char}」的诗句`
      this.startTimer()
    },

    // —— local 模式：同设备两个标签页对战 ——
    async startLocal() {
      this.phase = 'matching'
      this.waitingOpponent = true
      this.status = '正在等待另一窗口加入…（请在新标签页打开本页并选择「同设备双开对战」）'
      this.transport = createLocalTransport(this.selfId)
      this.transport.on((msg) => this.onRemote(msg))
      this.transport.send({ type: 'hello', id: this.selfId })
      this._matchTimer = setTimeout(() => {
        if (this.phase === 'matching') {
          this.status = '仍未检测到对手窗口。请再开一个本页标签页并选择「同设备双开对战」。'
        }
      }, 8000)
    },

    // —— online 模式：Supabase Realtime；未配置则降级 local ——
    async startOnline() {
      if (!isSupabaseConfigured) {
        this.note = '未检测到 Supabase 配置，已切换到「同设备双开对战」（开两个标签页即可联网对战）。'
        return this.startLocal()
      }
      const sb = await getSupabase()
      if (!sb) {
        this.note = 'Supabase 加载失败，已切换到同设备双开模式。'
        return this.startLocal()
      }
      this.phase = 'matching'
      this.waitingOpponent = true
      this.status = '正在通过 Supabase Realtime 匹配对手…'
      const ch = sb.channel('shiyun-battle-main', { config: { broadcast: { self: false } } })
      this.channel = ch
      ch.on('broadcast', { event: 'msg' }, ({ payload }) => this.onRemote(payload))
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          ch.send({ type: 'broadcast', event: 'msg', payload: { type: 'hello', id: this.selfId } })
        }
      })
    },

    // —— 远程消息（local / online 共用）——
    onRemote(msg) {
      if (msg.type === 'hello') {
        if (this._matchTimer) { clearTimeout(this._matchTimer); this._matchTimer = null }
        // id 较大者为房主（玩家A，先手）
        const iAmHost = this.selfId > msg.id
        this.selfPlayer = iAmHost ? 0 : 1
        if (iAmHost) {
          this.char = randChar()
          this.turn = 0
          this.phase = 'playing'
          this.waitingOpponent = false
          this.status = (this.selfPlayer === 0 ? '你先手' : '对手先手') + `，说出含「${this.char}」的诗句`
          this.broadcastState()
          this.startTimer()
        } else {
          // 客人回 hello，等待房主广播 state
          this.transport && this.transport.send({ type: 'hello', id: this.selfId })
          this.channel && this.channel.send({ type: 'broadcast', event: 'msg', payload: { type: 'hello', id: this.selfId } })
        }
      } else if (msg.type === 'state') {
        this.applyState(msg.state)
      } else if (msg.type === 'result') {
        this.applyResult(msg.winner)
      }
    },

    broadcastState() {
      const state = {
        char: this.char,
        turn: this.turn,
        moves: this.moves,
        usedLines: this.usedLines,
        usedIds: this.usedIds,
        round: this.round,
        winner: this.winner,
        status: this.status,
      }
      if (this.transport) this.transport.send({ type: 'state', state })
      if (this.channel) this.channel.send({ type: 'broadcast', event: 'msg', payload: { type: 'state', state } })
    },

    applyState(s) {
      if (this.phase === 'matching') {
        this.phase = 'playing'
        this.waitingOpponent = false
      }
      this.char = s.char
      this.turn = s.turn
      this.moves = s.moves
      this.usedLines = s.usedLines
      this.usedIds = s.usedIds
      this.round = s.round
      this.winner = s.winner
      this.status = s.status
      if (this.winner == null && this.isMyTurn) this.startTimer()
      else this.clearTimer()
    },

    // —— 计时 ——
    startTimer() {
      this.clearTimer()
      this.timer = TURN_SECONDS
      this.timerId = setInterval(() => {
        this.timer -= 1
        if (this.timer <= 0) {
          this.clearTimer()
          this.timeout()
        }
      }, 1000)
    },
    clearTimer() {
      if (this.timerId) { clearInterval(this.timerId); this.timerId = null }
    },

    // —— 我方提交 ——
    submit(text) {
      if (this.phase !== 'playing') return
      if (!this.isMyTurn) { this.status = '还没轮到你哦'; return }
      const t = (text || '').trim()
      if (!t) { this.status = '请先输入一句诗'; return }
      if (!t.includes(this.char)) { this.status = `这句里没有「${this.char}」`; return }
      if (this.usedLines.includes(t)) { this.status = '这句已经用过了'; return }
      this.commitMove(this.selfPlayer, t)
    },

    commitMove(by, text) {
      this.moves.push({ by, text, ok: true })
      this.usedLines.push(text)
      this.turn = (this.turn + 1) % 2
      this.round += 1
      this.broadcastState()
      // 回合切换后的处理
      if (this.mode === 'bot' && this.turn === 1) {
        this.scheduleBot()
      } else if (this.turn === this.selfPlayer) {
        this.status = '轮到你了，说出含「' + this.char + '」的诗句'
        this.startTimer()
      } else {
        this.status = '对手思考中…'
        this.clearTimer()
      }
    },

    scheduleBot() {
      this.clearTimer()
      const delay = 800 + Math.floor(Math.random() * 1200)
      this._botTimer = setTimeout(() => this.botMove(), delay)
    },

    botMove() {
      if (this.phase !== 'playing' || this.turn !== 1) return
      const line = this.pickBotLine()
      if (!line) {
        // 机器人接不上 → 我方胜
        this.endGame(0)
        return
      }
      this.moves.push({ by: 1, text: line, ok: true })
      this.usedLines.push(line)
      this.turn = 0
      this.round += 1
      this.status = '轮到你了，说出含「' + this.char + '」的诗句'
      this.broadcastState()
      this.startTimer()
    },

    pickBotLine() {
      const cands = getPoemsByContent(this.char).filter((p) => !this.usedIds.includes(p.id))
      for (const p of shuffle(cands)) {
        const line = p.content.find(
          (l) => l.includes(this.char) && !this.usedLines.includes(l),
        )
        if (line) {
          this.usedIds.push(p.id)
          return line
        }
      }
      return null
    },

    timeout() {
      // 当前回合玩家超时判负
      const loser = this.turn
      const winner = loser === 0 ? 1 : 0
      this.endGame(winner)
    },

    endGame(winner) {
      this.clearTimer()
      if (this._botTimer) { clearTimeout(this._botTimer); this._botTimer = null }
      this.winner = winner
      this.phase = 'result'
      const iWon = winner === this.selfPlayer
      this.status = iWon ? '🎉 你赢了！' : (winner === 'draw' ? '平局' : '惜败，再接再厉～')
      if (iWon) this.record.wins += 1
      else if (winner !== 'draw') this.record.losses += 1
      this.persistRecord()
      if (this.transport) this.transport.send({ type: 'result', winner })
      if (this.channel) this.channel.send({ type: 'broadcast', event: 'msg', payload: { type: 'result', winner } })
    },

    applyResult(winner) {
      if (this.phase === 'playing') {
        this.winner = winner
        this.phase = 'result'
        this.clearTimer()
        const iWon = winner === this.selfPlayer
        this.status = iWon ? '🎉 你赢了！' : (winner === 'draw' ? '平局' : '惜败，再接再厉～')
      }
    },

    persistRecord() {
      try {
        localStorage.setItem(RECORD_KEY, JSON.stringify(this.record))
      } catch (e) {
        /* 忽略写入失败 */
      }
    },
  },
})
