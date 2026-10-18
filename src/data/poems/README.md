# 诗词数据文件说明

本目录存放所有诗词数据 JSON 文件，每位成员负责一个文件：
- `hong.json` — 洪修睿
- `liu.json` — 刘庭彰
- `xu.json` — 徐潇
- `chen.json` — 陈汝桐
- `zhang.json` — 张雅萱

## 数据格式（Schema）

每首诗词是一个对象，格式如下：

```json
{
  "id": "tang-0001",
  "title": "静夜思",
  "author": "李白",
  "dynasty": "唐",
  "form": "诗",
  "content": ["床前明月光，", "疑是地上霜。", "举头望明月，", "低头思故乡。"],
  "translation": "……",
  "notes": "……",
  "background": "……",
  "analysis": "……",
  "appreciation": "……",
  "artisticConcept": "……",
  "tags": ["思乡", "月"],
  "theme": "思乡羁旅"
}
```

## 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 全局唯一 ID，前缀用朝代拼音（如 tang-、song-、yuan-），后面接编号，避免 5 人重复 |
| `title` | string | ✅ | 诗词标题 |
| `author` | string | ✅ | 作者姓名 |
| `dynasty` | string | ✅ | 朝代：唐 / 宋 / 元 / 明 / 清 / 先秦 / 汉 / 魏晋南北朝 |
| `form` | string | ✅ | 体裁：诗 / 词 / 曲 |
| `content` | string[] | ✅ | 诗句正文，**每行一句**，数组形式 |
| `translation` | string | 选填 | 白话翻译 |
| `notes` | string | 选填 | 注释说明 |
| `background` | string | 选填 | 创作背景 |
| `analysis` | string | 选填 | 词句赏析 |
| `appreciation` | string | 选填 | 整体艺术特色 |
| `artisticConcept` | string | 选填 | 意境分析 |
| `tags` | string[] | ✅ | 标签数组，用于搜索，如 ["思乡", "月", "秋天"] |
| `theme` | string | ✅ | 主题分类，用于筛选，如「思乡羁旅」「山水田园」「边塞征战」「咏史怀古」「赠友送别」「爱情闺怨」「闲适隐逸」「咏物言志」 |

## ID 命名规则

- 前缀：朝代拼音
  - `tang-` 唐代
  - `song-` 宋代
  - `yuan-` 元代
  - `ming-` 明代
  - `qing-` 清代
- 后缀：4 位数字编号
- 示例：`tang-0001`、`song-0012`

## 文件格式

每个 JSON 文件是一个**数组**，里面放多首诗词对象：

```json
[
  {
    "id": "tang-0001",
    "title": "静夜思",
    ...
  },
  {
    "id": "tang-0002",
    "title": "春晓",
    ...
  }
]
```
