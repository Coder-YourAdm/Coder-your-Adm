import argparse
import asyncio
import json
from pathlib import Path

import edge_tts

# 项目根目录（本文件在 docs/ 下，上一级即项目根）
PROJECT_ROOT = Path(__file__).resolve().parent.parent
POEMS_DIR = PROJECT_ROOT / "src" / "data" / "poems"
AUDIO_DIR = PROJECT_ROOT / "public" / "audio"

# 与张雅萱 gen_audio.py 完全一致的朗读参数
VOICE = "zh-CN-YunyangNeural"   # 云扬，沉稳男声
RATE = "-40%"                   # 放慢 40%，更适合吟诵
PITCH = "-10Hz"
CONCURRENCY = 8                 # 并发数，避免触发限速


def load_poems():
    poems = []
    for f in sorted(POEMS_DIR.glob("*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        for p in data:
            poems.append(p)
    return poems


async def gen_one(p):
    pid = p.get("id")
    if not pid:
        return ("skip", pid, "no id")
    out = AUDIO_DIR / f"{pid}.mp3"
    # 已存在且非空则跳过，避免重复调用网络
    if out.exists() and out.stat().st_size > 0:
        return ("skip", pid, "exists")

    content = p.get("content")
    if isinstance(content, list):
        text = "".join(content)
    else:
        text = str(content or "")

    title = p.get("title", "")
    dynasty = p.get("dynasty", "")
    author = p.get("author", "")
    # 朗读格式与张雅萱一致：《标题》。朝代，作者。正文
    narration = f"{title}。{dynasty}，{author}。{text}"

    try:
        communicate = edge_tts.Communicate(narration, VOICE, rate=RATE, pitch=PITCH)
        await communicate.save(str(out))
        return ("ok", pid, out.stat().st_size)
    except Exception as e:  # noqa: BLE001
        return ("fail", pid, str(e))


async def main(limit: int):
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    poems = load_poems()
    if limit:
        poems = poems[:limit]
    print(f"待处理诗词数: {len(poems)}")

    sem = asyncio.Semaphore(CONCURRENCY)

    async def guarded(p):
        async with sem:
            return await gen_one(p)

    results = await asyncio.gather(*[guarded(p) for p in poems])
    ok = [r for r in results if r[0] == "ok"]
    skip = [r for r in results if r[0] == "skip"]
    fail = [r for r in results if r[0] == "fail"]

    print(f"新生成: {len(ok)}  跳过(已有): {len(skip)}  失败: {len(fail)}")
    for r in fail:
        print("FAIL", r[1], r[2])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="批量生成诗词朗读音频（Edge TTS）")
    parser.add_argument("--limit", type=int, default=0, help="仅处理前 N 首（用于试跑）")
    args = parser.parse_args()
    asyncio.run(main(args.limit))
