// 诗韵·古诗库 — 数据接入层
// 自动加载 src/data/poems/ 下所有 JSON 文件，统一对外提供查询接口
// 其他页面直接 import 这些函数即可，无需关心底层文件结构

// Vite 自动导入：加载 data/poems 目录下所有 .json 文件
const modules = import.meta.glob('../data/poems/*.json', { eager: true })

// 将所有文件的诗词数组合并成一个总列表
const ALL = Object.values(modules).flatMap(m => m.default)

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
  const lowerKw = kw.toLowerCase()
  return ALL.filter(p => {
    const haystack = (
      p.title +
      p.author +
      p.content.join('') +
      p.tags.join('')
    ).toLowerCase()
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
