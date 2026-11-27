"""重做全部 500 首诗词的「咕咕嘎嘎」朗读：原版臭企鹅叫声开头 + 卡通化朗读。

参考素材：public/audio/gugu-intro.mp3（2.96s 臭企鹅怪叫，用户提供）
生成：intro + 0.35s 停顿 + Edge TTS 卡通朗读（云夏 +120Hz）
"""
import asyncio
import json
import os
import random
from pathlib import Path

import edge_tts
import lameenc
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
POEMS_DIR = ROOT / "src" / "data" / "poems"
AUDIO_DIR = ROOT / "public" / "audio"
INTRO = AUDIO_DIR / "gugu-intro.mp3"

VOICE = "zh-CN-YunxiaNeural"
RATE = "+15%"
PITCH = "+120Hz"
CONCURRENCY = 3
RETRIES = 8
GAP_SEC = 0.35
SR = 44100


def is_new_version(path):
    """新版 = 44100Hz 且开头 3 秒是满能量的臭企鹅原声（RMS > 0.15）。"""
    if not path.exists():
        return False
    try:
        info = sf.info(str(path))
        if info.samplerate != SR:
            return False
        d, _ = sf.read(str(path), frames=3 * SR)
        m = np.asarray(d)
        m = m.mean(axis=1) if m.ndim > 1 else m
        return float(np.sqrt(np.mean(m ** 2))) > 0.15
    except Exception:
        return False


def load_poems():
    poems = []
    for f in sorted(POEMS_DIR.glob("*.json")):
        for p in json.loads(f.read_text(encoding="utf-8")):
            if p.get("id"):
                poems.append(p)
    return poems


def narration(p):
    content = p.get("content")
    text = "".join(content) if isinstance(content, list) else str(content or "")
    return f"{p.get('title','')}。{p.get('dynasty','')}，{p.get('author','')}。{text}"


def mono_resample(data, src_sr, dst_sr):
    if data.ndim > 1:
        data = data.mean(axis=1)
    if src_sr == dst_sr:
        return data
    n = int(len(data) * dst_sr / src_sr)
    return np.interp(np.linspace(0, len(data) - 1, n), np.arange(len(data)), data)


def encode_mp3(samples, sr):
    enc = lameenc.Encoder()
    enc.set_bit_rate(128)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode((np.clip(samples, -1, 1) * 32767).astype(np.int16).tobytes()) + enc.flush()


async def gen_one(p, intro, sem):
    out = AUDIO_DIR / f"{p['id']}-gugu.mp3"
    tmp = out.with_suffix(".mp3.tmp")
    # 断点续跑：已是新版的跳过，避免网络中断后重复劳动
    if is_new_version(out):
        return "skip", out.name, 0
    for attempt in range(RETRIES):
        async with sem:
            try:
                tts_path = tmp.with_suffix(".tts.tmp")
                c = edge_tts.Communicate(narration(p), VOICE, rate=RATE, pitch=PITCH)
                await c.save(str(tts_path))
                tts, tts_sr = sf.read(str(tts_path))
                joined = np.concatenate([
                    intro,
                    np.zeros(int(SR * GAP_SEC)),
                    mono_resample(tts, tts_sr, SR),
                ])
                mp3 = encode_mp3(joined, SR)
                if len(mp3) < 10_000:
                    raise RuntimeError(f"too small {len(mp3)}")
                tmp.write_bytes(mp3)
                os.replace(tmp, out)
                return "ok", out.name, len(mp3)
            except Exception as e:  # noqa: BLE001
                if attempt == RETRIES - 1:
                    return "fail", out.name, str(e)[:120]
        await asyncio.sleep(1.5 * (attempt + 1) + random.random())


async def main(limit):
    intro, intro_sr = sf.read(str(INTRO))
    intro = mono_resample(intro, intro_sr, SR)
    print(f"intro: {len(intro)/SR:.2f}s", flush=True)
    poems = load_poems()
    if limit:
        poems = poems[:limit]
    print(f"待处理: {len(poems)} 首", flush=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    results = await asyncio.gather(*[gen_one(p, intro, sem) for p in poems])
    ok = [r for r in results if r[0] == "ok"]
    skip = [r for r in results if r[0] == "skip"]
    fail = [r for r in results if r[0] == "fail"]
    print(f"新生成 {len(ok)}  跳过 {len(skip)}  失败 {len(fail)}", flush=True)
    for r in fail:
        print("FAIL", r[1], r[2], flush=True)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()
    asyncio.run(main(args.limit))
