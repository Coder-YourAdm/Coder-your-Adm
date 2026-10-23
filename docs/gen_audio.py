import asyncio
from pathlib import Path

import edge_tts


# 获取项目根目录和音频输出目录
PROJECT_ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = PROJECT_ROOT / "public" / "audio"

# 朗读声音设置：保留之前试听过的风格
VOICE = "zh-CN-YunyangNeural"
RATE = "-40%"
PITCH = "-10Hz"


# 每首诗的标题、朝代、作者和完整正文
poems = [
    {
        "filename": "libai-jingyesi",
        "title": "静夜思",
        "dynasty": "唐代",
        "author": "李白",
        "text": (
            "床前明月光，疑是地上霜。"
            "举头望明月，低头思故乡。"
        ),
    },
    {
        "filename": "wangzhihuan-dengguanquelou",
        "title": "登鹳雀楼",
        "dynasty": "唐代",
        "author": "王之涣",
        "text": (
            "白日依山尽，黄河入海流。"
            "欲穷千里目，更上一层楼。"
        ),
    },
    {
        "filename": "menghaoran-chunxiao",
        "title": "春晓",
        "dynasty": "唐代",
        "author": "孟浩然",
        "text": (
            "春眠不觉晓，处处闻啼鸟。"
            "夜来风雨声，花落知多少。"
        ),
    },
    {
        "filename": "libai-dujingmensongbie",
        "title": "渡荆门送别",
        "dynasty": "唐代",
        "author": "李白",
        "text": (
            "渡远荆门外，来从楚国游。"
            "山随平野尽，江入大荒流。"
            "月下飞天镜，云生结海楼。"
            "仍怜故乡水，万里送行舟。"
        ),
    },
    {
        "filename": "dumu-qingming",
        "title": "清明",
        "dynasty": "唐代",
        "author": "杜牧",
        "text": (
            "清明时节雨纷纷，路上行人欲断魂。"
            "借问酒家何处有，牧童遥指杏花村。"
        ),
    },
    {
        "filename": "sushi-shuidiaogetou-mingyuejishiyou",
        "title": "水调歌头，明月几时有",
        "dynasty": "宋代",
        "author": "苏轼",
        "text": (
            "丙辰中秋，欢饮达旦，大醉，作此篇，兼怀子由。"
            "明月几时有？把酒问青天。"
            "不知天上宫阙，今夕是何年。"
            "我欲乘风归去，又恐琼楼玉宇，高处不胜寒。"
            "起舞弄清影，何似在人间。"
            "转朱阁，低绮户，照无眠。"
            "不应有恨，何事长向别时圆？"
            "人有悲欢离合，月有阴晴圆缺，此事古难全。"
            "但愿人长久，千里共婵娟。"
        ),
    },
    {
        "filename": "yuefei-manjianghong",
        "title": "满江红",
        "dynasty": "宋代",
        "author": "岳飞",
        "text": (
            "怒发冲冠，凭阑处、潇潇雨歇。"
            "抬望眼、仰天长啸，壮怀激烈。"
            "三十功名尘与土，八千里路云和月。"
            "莫等闲、白了少年头，空悲切。"
            "靖康耻，犹未雪。臣子恨，何时灭。"
            "驾长车，踏破贺兰山缺。"
            "壮志饥餐胡虏肉，笑谈渴饮匈奴血。"
            "待从头、收拾旧山河，朝天阙。"
        ),
    },
    {
        "filename": "libai-zengwanglun",
        "title": "赠汪伦",
        "dynasty": "唐代",
        "author": "李白",
        "text": (
            "李白乘舟将欲行，忽闻岸上踏歌声。"
            "桃花潭水深千尺，不及汪伦送我情。"
        ),
    },
    {
        "filename": "wangwei-xiangsi",
        "title": "相思",
        "dynasty": "唐代",
        "author": "王维",
        "text": (
            "红豆生南国，春来发几枝。"
            "愿君多采撷，此物最相思。"
        ),
    },
    {
        "filename": "caozhi-qibushi",
        "title": "七步诗",
        "dynasty": "三国魏",
        "author": "曹植",
        "text": (
            "煮豆燃豆萁，豆在釜中泣。"
            "本是同根生，相煎何太急。"
        ),
    },
]


async def generate_audio(poem):
    filename = poem["filename"]
    output_path = AUDIO_DIR / f"{filename}.mp3"

    # 先读标题、朝代、作者，再读完整诗文
    narration = (
        f"{poem['title']}。"
        f"{poem['dynasty']}，{poem['author']}。"
        f"{poem['text']}"
    )

    print(f"正在生成：{filename}.mp3")

    communicate = edge_tts.Communicate(
        narration,
        VOICE,
        rate=RATE,
        pitch=PITCH,
    )

    await communicate.save(str(output_path))
    print(f"生成成功：{output_path.name}")


async def main():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    total = len(poems)
    success_count = 0

    for index, poem in enumerate(poems, start=1):
        print(f"\n[{index}/{total}]")

        try:
            await generate_audio(poem)
            success_count += 1
        except Exception as error:
            print(f"生成失败：{poem['filename']}.mp3")
            print(f"失败原因：{error}")

    print(f"\n音频生成结束：成功 {success_count}/{total} 首。")
    print(f"音频保存位置：{AUDIO_DIR}")


if __name__ == "__main__":
    asyncio.run(main())