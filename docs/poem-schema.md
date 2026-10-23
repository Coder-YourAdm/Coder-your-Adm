# 诗词数据字段规范（poem-schema）

> **权威来源**：《诗词清单250首》 > 本文档 > 个人 README
> 本文档面向**页面层开发者**：写页面、卡片、详情页前先看这里，避免拿到空字段渲染出空白区块。
> 数据填充者请同时阅读 `src/data/poems/README.md`。

---

## 1. 数据结构

`src/data/poems/*.json` 每个文件是一个**数组**，元素为诗词对象。接入层 `src/api/poems.js`
通过 `import.meta.glob` 自动加载全部文件并合并，**新增 JSON 文件无需改任何代码**。

## 2. 字段清单（14 个）

| 字段 | 类型 | 必填 | 说明 | 空值含义 |
|---|---|:--:|---|---|
| `id` | string | ✅ | 全局唯一 ID，格式见 §3 | — |
| `title` | string | ✅ | 标题（词牌·首句 形式） | — |
| `author` | string | ✅ | 作者 | — |
| `dynasty` | string | ✅ | 朝代，见 §5 | — |
| `form` | string | ✅ | 体裁：`诗` / `词` / `曲` | — |
| `content` | string[] | ✅ | 正文，**每行一句**；词的**小序**作为数组首元素 | — |
| `tags` | string[] | ✅ | 标签，用于关键词搜索，建议 3–4 个 | 可为空数组 |
| `theme` | string | ✅ | 主题分类，**必须取自 §4 的 16 个值** | — |
| `translation` | string | 选填 | 白话译文 | `""` = 无译文 |
| `notes` | string | 选填 | 注释 | `""` = 无注释 |
| `background` | string | 选填 | 创作背景 | `""` = 无背景 |
| `analysis` | string | 选填 | 词句赏析 | `""` = 无赏析 |
| `appreciation` | string | 选填 | 整体艺术特色 | `""` = 无 |
| `artisticConcept` | string | 选填 | 意境分析 | `""` = 无 |

### ⚠️ 空字段处理约定（页面层必读）

**6 个选填字段当前填充情况（2026-10-22 更新）：**

| 数据文件 | 填充状态 |
|---|---|
| `xu.json`（徐潇 50 首宋词） | ✅ 6 个字段 **50/50 已全部填满** |
| `chen.json`（陈汝桐 50 首） | ⚠️ 仍为空字符串，待填 |
| `zhang.json`（张雅萱 50 首） | ⚠️ 仍为空字符串，待填 |
| `hong.json` / `liu.json` | ⚠️ 尚未创建 |

**所以页面层必须判空——不能因为手头测试数据有值就省略 `v-if`。**
本地跑 `xu.json` 时六个区都有内容，一合并别人的数据就会出现空白区块。

字段为 `""` 与字段**缺失**是两回事：`""` 是数据尚未填充的预期状态，缺失则是代码 bug，可修复。

**渲染规则：字段为空字符串时，不要渲染该区块**（不要显示空的折叠面板、"暂无内容"占位块或只有标题的空卡片）。

```vue
<!-- ✅ 正确 -->
<section v-if="poem.translation">
  <h3>译文</h3>
  <p>{{ poem.translation }}</p>
</section>

<!-- ❌ 错误：会渲染出标题下空白的区块 -->
<section>
  <h3>译文</h3>
  <p>{{ poem.translation || '暂无' }}</p>
</section>
```

详情页的译文 / 注释 / 背景 / 赏析 / 艺术特色 / 意境六个区，**每个都要独立判空**，
不能因为其中一个为空就整块隐藏，也不能因为其中一个有值就全部显示。

---

## 3. ID 命名规则

**格式**：`<朝代拼音>-<负责人拼音>-<4位序号>`

```
song-xu-0001
 │     │   └── 4 位序号（0001 起，按清单顺序递增）
 │     └────── 负责人拼音
 └──────────── 朝代拼音（见 §5）
```

| 负责人 | 拼音段 |
|---|---|
| 洪修睿 | `hong` |
| 刘庭彰 | `liu` |
| 徐潇 | `xu` |
| 陈汝桐 | `chen` |
| 张雅萱 | `zhang` |

**为什么必须带负责人段**：5 人各填 50 首，若都用 `song-0001` 起编会 **100% ID 撞车**。
由于每人改的是不同文件，**Git 不报冲突、GitHub 显示 mergeable: clean**，
但 `getPoemById()` 只会返回其中一个 —— 250 首合并后实际只剩一半可用，
且丢失的是哪一半取决于文件系统遍历顺序，事后极难排查。

> 接入层已内置开发期 ID 唯一性自检，冲突会在控制台报 `[poems] ID 冲突`。

---

## 4. theme 取值（16 个，严格取用，禁止自造）

按《诗词清单250首》官方分布：

| 主题 | 数量 | 主题 | 数量 |
|---|--:|---|--:|
| 婉约 | 75 | 咏物言志 | 11 |
| 山水田园 | 28 | 忧国忧民 | 9 |
| 爱情闺怨 | 19 | 边塞军旅 | 8 |
| 哲理人生 | 16 | 四季节令 | 8 |
| 送别 | 14 | 行旅即景 | 6 |
| 咏史怀古 | 14 | 豪放 | 6 |
| 闲适隐逸 | 13 | 讽喻时弊 | 6 |
| 思乡羁旅 | 12 | 其他 | 5 |

> ⚠️ 「婉约」「豪放」是**正式主题分类值**（婉约 75 首、豪放 6 首），不是"风格流派"。
> 不要改填别的值 —— 分类页按 `theme` 取值，自造值会导致该分类漏数据。

---

## 5. 朝代取值与拼音对照

| 朝代 | 拼音段 | 朝代 | 拼音段 |
|---|---|---|---|
| 唐 | `tang` | 五代 | `wudai` |
| 宋 | `song` | 三国 | `sanguo` |
| 元 | `yuan` | 北朝 | `beichao` |
| 汉 | `han` | 西晋 | `xijin` |
| 明 | `ming` | 东晋 | `dongjin` |
| 清 | `qing` | 南朝宋 | `nanchaosong` |

拼音段**不含连字符**（是 `wudai` 不是 `wu-dai`），ID 必须是 3 段。

---

## 6. 接入层 API（`src/api/poems.js`）

```js
import {
  getAllPoems, getPoemById, getByAuthor, getByDynasty,
  getByTheme, getByForm, searchPoems,
  getAllDynasties, getAllThemes, getAllAuthors,
  getRandomPoems, getPagedPoems, groupByAuthor,
  getPoemsByContent, getPoemAudio
} from '@/api/poems'
```

### 基础查询

| 函数 | 参数 | 返回 | 用途 |
|---|---|---|---|
| `getAllPoems()` | — | `Array` | 全部诗词 |
| `getPoemById(id)` | `string` | `Object \| undefined` | 详情页 |
| `getByAuthor(author)` | `string` | `Array` | 作者页 |
| `getByDynasty(dynasty)` | `string` | `Array` | 朝代筛选 |
| `getByTheme(theme)` | `string` | `Array` | 主题分类页 |
| `getByForm(form)` | `'诗'\|'词'\|'曲'` | `Array` | 体裁筛选 |
| `searchPoems(kw)` | `string` | `Array` | 搜索（标题/作者/正文/标签） |
| `getAllDynasties()` | — | `string[]` | 筛选器选项 |
| `getAllThemes()` | — | `string[]` | 筛选器选项 |
| `getAllAuthors()` | — | `string[]` | 筛选器选项 |

### 组合查询（Sprint 2 新增）

| 函数 | 参数 | 返回 | 用途 |
|---|---|---|---|
| `getRandomPoems(n)` | `number`，默认 8 | `Array` | 首页「今日推荐」，同一批不重复 |
| `getPagedPoems({page,size})` | 默认 `{page:1,size:10}` | `{list,total,page,size,totalPages}` | 列表分页，页码越界自动钳制 |
| `groupByAuthor()` | — | `[{author,count,poems}]`，按数量降序 | 作者聚合页 |
| `getPoemsByContent(char)` | `string`，如 `'月'` | `Array` | 飞花令：正文含该字的诗词 |
| `getPoemAudio(id)` | `string` | `'audio/'+id+'.mp3'`，id 非法返回 `''` | 详情页朗读 |

### 使用示例

```js
// 首页推荐 8 首
const recommends = getRandomPoems(8)

// 分类列表第 2 页，每页 12 条
const { list, totalPages } = getPagedPoems({ page: 2, size: 12 })

// 飞花令：抽到「月」字，取参考答案
const answers = getPoemsByContent('月')

// 详情页朗读
const src = getPoemAudio(poem.id)        // 'audio/song-xu-0001.mp3'
if (!src) showToast('暂无朗读音频')        // 必须判空
```

---

## 7. 音频文件约定

- 存放位置：`public/audio/`
- 命名：**与诗词 id 完全一致**，如 `song-xu-0001.mp3`
- 接入方式：`getPoemAudio(id)` 返回相对路径，直接给 `<audio src>` 用
- **音频缺失是常态**（张雅萱 D8 才接入）：页面必须判空并显示「暂无朗读音频」，不要让 `<audio>` 加载 404 静默失败

> 注意：`zhang.json` 有 15 条 ID 在 Sprint 2 中变更（如 `wu-dai-zhang-0021` → `wudai-zhang-0021`），
> 音频文件名请按**新 ID** 命名。

---

## 8. 自检

```bash
npm run dev
```

控制台出现以下内容即为数据异常，必须先修再提 PR：

- `[poems] ID 冲突` —— ID 重复，会静默丢数据
- `[poems] 发现缺少 id 的条目` —— 数据缺主键

生产构建：`npm run build` 必须无报错。
