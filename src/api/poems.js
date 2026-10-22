// 诗韵·古诗库 — 数据接入层
// 自动加载 src/data/poems/ 下所有 JSON 文件，统一对外提供查询接口
// 其他页面直接 import 这些函数即可，无需关心底层文件结构

// Vite 自动导入：加载 data/poems 目录下所有 .json 文件
const modules = import.meta.glob('../data/poems/*.json', { eager: true })

// 将所有文件的诗词数组合并成一个总列表
const ALL = Object.values(modules).flatMap(m => m.default)

// 开发期自检：ID 唯一性
// 5 人各填一个 json，若都从 0001 起编会 100% 撞车。由于改的是不同文件，
// Git 不会报冲突，但 getPoemById 只会返回其中一个 —— 数据会静默丢失一半。
// 这里在控制台直接暴露冲突，避免问题拖到联调阶段。
if (import.meta.env.DEV) {
  const seen = new Map()
  const dupes = []
  ALL.forEach(p => {
    if (!p || !p.id) {
      console.error('[poems] 发现缺少 id 的条目：', p)
      return
    }
    if (seen.has(p.id)) {
      dupes.push({ id: p.id, a: seen.get(p.id), b: p })
      console.error(
        `[poems] ID 冲突: ${p.id}\n` +
        `  A: 《${seen.get(p.id).title}》${seen.get(p.id).author}\n` +
        `  B: 《${p.title}》${p.author}`
      )
    } else {
      seen.set(p.id, p)
    }
  })
  if (dupes.length) {
    console.error(
      `[poems] 共 ${ALL.length} 条数据，唯一 ID 仅 ${seen.size} 个 —— ` +
      `${dupes.length} 条会被静默覆盖！请检查 src/data/poems/ 下各文件的 ID 命名。`
    )
  }
}

/**
 * 获取全部诗词列表
 * @returns {Array} 所有诗词对象数组
 */
export function getAllPoems() {
  return ALL
}

/**
 * 按 ID 查询单首诗词
 * @param {string} id 诗词唯一 ID，如 'tang-0001'
 * @returns {Object|undefined} 匹配到的诗词对象
 */
export function getPoemById(id) {
  return ALL.find(p => p.id === id)
}

/**
 * 按作者筛选诗词
 * @param {string} author 作者名，如 '李白'
 * @returns {Array} 该作者的所有诗词
 */
export function getByAuthor(author) {
  return ALL.filter(p => p.author === author)
}

/**
 * 按朝代筛选诗词
 * @param {string} dynasty 朝代，如 '唐'、'宋'
 * @returns {Array} 该朝代的所有诗词
 */
export function getByDynasty(dynasty) {
  return ALL.filter(p => p.dynasty === dynasty)
}

/**
 * 按主题分类筛选诗词
 * @param {string} theme 主题，如 '思乡羁旅'、'山水田园'
 * @returns {Array} 该主题的所有诗词
 */
export function getByTheme(theme) {
  return ALL.filter(p => p.theme === theme)
}

/**
 * 按体裁筛选诗词
 * @param {string} form 体裁：'诗' / '词' / '曲'
 * @returns {Array} 该体裁的所有诗词
 */
export function getByForm(form) {
  return ALL.filter(p => p.form === form)
}

/**
 * 关键词模糊搜索
 * 匹配范围：标题、作者、诗句内容、标签
 * @param {string} kw 搜索关键词
 * @returns {Array} 匹配的诗词列表
 */
export function searchPoems(kw) {
  if (!kw) return []
  const lowerKw = String(kw).toLowerCase()
  return ALL.filter(p => {
    // 容错：任何人的 json 少写 tags 或把 content 写成字符串时，不让整个搜索挂掉
    const haystack = [
      p.title || '',
      p.author || '',
      Array.isArray(p.content) ? p.content.join('') : (p.content || ''),
      Array.isArray(p.tags) ? p.tags.join('') : ''
    ].join('').toLowerCase()
    return haystack.includes(lowerKw)
  })
}

/**
 * 获取所有朝代列表（去重）
 * @returns {Array<string>} 朝代名称数组
 */
export function getAllDynasties() {
  return [...new Set(ALL.map(p => p.dynasty))]
}

/**
 * 获取所有主题列表（去重）
 * @returns {Array<string>} 主题名称数组
 */
export function getAllThemes() {
  return [...new Set(ALL.map(p => p.theme))]
}

/**
 * 获取所有作者列表（去重）
 * @returns {Array<string>} 作者名称数组
 */
export function getAllAuthors() {
  return [...new Set(ALL.map(p => p.author))]
}

/**
 * 随机获取 n 首诗词（首页「今日推荐」用）
 * 使用 Fisher-Yates 洗牌，保证同一批内不重复
 * @param {number} n 需要的数量，默认 8
 * @returns {Array} 随机诗词数组（不足 n 首时返回全部）
 */
export function getRandomPoems(n = 8) {
  const count = Math.max(0, Math.floor(Number(n) || 0))
  if (count === 0) return []
  // 复制一份再洗牌，避免污染全局 ALL 的顺序
  const pool = [...ALL]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

/**
 * 分页获取诗词（列表页 / 搜索结果页用）
 * @param {Object} options 分页参数
 * @param {number} options.page 页码，从 1 开始，默认 1
 * @param {number} options.size 每页条数，默认 10
 * @returns {{list: Array, total: number, page: number, size: number, totalPages: number}}
 */
export function getPagedPoems({ page = 1, size = 10 } = {}) {
  const total = ALL.length
  const pageSize = Math.max(1, Math.floor(Number(size) || 10))
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  // 页码越界时钳制到合法范围，避免返回空列表让页面白屏
  const current = Math.min(Math.max(1, Math.floor(Number(page) || 1)), totalPages)
  const start = (current - 1) * pageSize
  return {
    list: ALL.slice(start, start + pageSize),
    total,
    page: current,
    size: pageSize,
    totalPages
  }
}

/**
 * 按作者分组（作者列表页 / 侧边栏用）
 * @returns {Array<{author: string, count: number, poems: Array}>} 按作品数降序
 */
export function groupByAuthor() {
  const map = new Map()
  ALL.forEach(p => {
    const name = p.author || '佚名'
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(p)
  })
  return [...map.entries()]
    .map(([author, poems]) => ({ author, count: poems.length, poems }))
    .sort((a, b) => b.count - a.count || a.author.localeCompare(b.author, 'zh'))
}

/**
 * 按「诗句中包含某个字」筛选（飞花令用）
 * 逐句匹配，命中即认为该首诗词含有此字
 * @param {string} char 要查的字，如 '月'、'花'
 * @returns {Array} 正文含该字的诗词数组
 */
export function getPoemsByContent(char) {
  if (!char) return []
  const target = String(char).trim()
  if (!target) return []
  return ALL.filter(p => {
    const lines = Array.isArray(p.content) ? p.content : [String(p.content || '')]
    return lines.some(line => String(line || '').includes(target))
  })
}

/**
 * 获取诗词朗读音频路径（详情页朗读按钮用）
 * 约定音频文件放在 public/audio/ 下，文件名与诗词 id 一致
 * @param {string} id 诗词 ID，如 'song-xu-0001'
 * @returns {string} 音频路径，如 'audio/song-xu-0001.mp3'；id 无效时返回空串
 */
export function getPoemAudio(id) {
  if (!id) return ''
  // 校验 ID 格式，避免拼接出非法路径或 undefined.mp3
  if (!/^[a-z]+-[a-z]+-\d{4}$/.test(String(id))) return ''
  return `audio/${id}.mp3`
}
