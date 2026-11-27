"""为全部诗词生成三种音色中的两种人声朗读（咕咕嘎嘎为项目现成音效）。

用法：
    python docs/gen_audio_voices.py --voice both

生成规则：
    雄浑男声  -> public/audio/<id>-male.mp3   (zh-CN-YunjianNeural)
    优雅女声  -> public/audio/<id>-female.mp3 (zh-CN-XiaoxiaoNeural)
已存在且非空的文件会跳过，方便断点续跑；失败自动重试。
"""
import argparse
import asyncio
import json
import os
import random
from pathlib import Path

import edge_tts

PROJECT_ROOT = Path(__file__).resolve().parent.parent
POEMS_DIR = PROJECT_ROOT / "src" / "data" / "poems"
AUDIO_DIR = PROJECT_ROOT / "public" / "audio"

VOICES = {
    "male": ("zh-CN-YunjianNeural", "-30%", "-5Hz", ""),          # 云健：浑厚有力
    "female": ("zh-CN-XiaoxiaoNeural", "-25%", "+0Hz", ""),       # 晓晓：温婉优雅
    # 网感「咕咕嘎嘎」≈ 装傻的卡通/婴儿音：可爱童声拉高音调 + 略快语速 + 开头口号
    "gugu": ("zh-CN-YunxiaNeural", "+20%", "+100Hz", "咕咕嘎嘎～"),
}
CONCURRENCY = 8
RETRIES = 5


def load_poems():
    poems = []
    for f in sorted(POEMS_DIR.glob("*.json")):
        for p in json.loads(f.read_text(encoding="utf-8")):
            if p.get("id"):
                poems.append(p)
    return poems


def narration(p):
    content = p.get("content")
    if isinstance(content, list):
        text = "".join(content)
    else:
        text = str(content or "")
    return f"{p.get('title', '')}。{p.get('dynasty', '')}，{p.get('author', '')}。{text}"


async def gen_one(p, voice_key, sem):
    voice, rate, pitch, prefix = VOICES[voice_key]
    out = AUDIO_DIR / f"{p['id']}-{voice_key}.mp3"
    if out.exists() and out.stat().st_size > 10_000:
        return "skip", out.name, 0
    tmp = out.with_suffix(".mp3.tmp")
    for attempt in range(RETRIES):
        async with sem:
            try:
                c = edge_tts.Communicate(prefix + narration(p), voice, rate=rate, pitch=pitch)
                await c.save(str(tmp))
                size = tmp.stat().st_size
                if size < 10_000:
                    raise RuntimeError(f"文件过小 {size} bytes")
                os.replace(tmp, out)
                return "ok", out.name, size
            except Exception as e:  # noqa: BLE001
                if tmp.exists():
                    tmp.unlink(missing_ok=True)
                if attempt == RETRIES - 1:
                    return "fail", out.name, str(e)[:120]
        await asyncio.sleep(1.5 * (attempt + 1) + random.random())
    return "fail", out.name, "retries exhausted"


async def main(voices, limit):
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    poems = load_poems()
    if limit:
        poems = poems[:limit]
    print(f"诗词数: {len(poems)}  音色: {', '.join(voices)}", flush=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = [gen_one(p, v, sem) for p in poems for v in voices]
    results = await asyncio.gather(*tasks)
    ok = [r for r in results if r[0] == "ok"]
    skip = [r for r in results if r[0] == "skip"]
    fail = [r for r in results if r[0] == "fail"]
    print(f"新生成 {len(ok)}  跳过 {len(skip)}  失败 {len(fail)}", flush=True)
    for r in fail:
        print("FAIL", r[1], r[2], flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", choices=["male", "female", "gugu", "both", "all"], default="all")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()
    voices = {"both": ["male", "female"], "all": ["male", "female", "gugu"]}.get(args.voice, [args.voice])
    asyncio.run(main(voices, args.limit))
