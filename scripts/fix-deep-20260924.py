#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2026-09-24 热点雷达「事件解释/为什么热度高」深度重写脚本
针对用户指出「事件解释和为什么热度高又简单复制粘贴」问题：
- explanation = 纯叙事，展开前因后果（谁干了什么→为什么→怎么样了），不复制标题、不套模板
- whyHot = 落到具体真实传播动力（信息增量/时间节点/视觉冲击/情绪/身份/冲突/参与/跨圈层），禁"自带高关注度/牵动情绪/情绪黏性高"类套话
同步改写 ai-analysis.json 与 gen-daily-content.json
"""
import json, os

root = "/root/.joyclaw/workspace/hotspot-radar-updated"
pub = os.path.join(root, "public/data")

DEEP = {
    "日本爱知・名古屋亚运会": {
        "explanation": (
            "第18届亚运会在日本爱知・名古屋正式开幕，这是名古屋首次承办亚运会。中国代表团派出多支队伍参赛，"
            "其中乒乓球、体操、游泳等优势项目最先登场。开赛首日国乒主力在多条战线亮相并顺利晋级，"
            "这一系列首发表现让国内观众把注意力迅速集中到亚运赛场，赛事进入持续关注的节奏。"
        ),
        "whyHot": (
            "本届亚运会是中国体育界在巴黎奥运周期后迎来的首个大型综合洲际赛事，名古屋又是首次办赛、办赛形式有变化，"
            "自带信息增量；乒乓球等项目正是中国夺金大户，每场晋级都直接关系金牌预期，胜负即时牵动观众；"
            "开赛首日的赛果天然为后续赛程制造悬念，讨论热度随每轮比赛推进而不断叠加。"
        ),
    },
    "3名中国女子在泰遭诱骗囚禁性侵": {
        "explanation": (
            "3名中国女子近期在泰国被诱骗，随后被囚禁并遭到性侵，事件被媒体和网友曝光后引发强烈关注。"
            "目前舆论焦点集中在几点：当事人如何被骗出境、跨境维权与报案渠道是否畅通、这类骗局是否有可识别的信号，"
            "公众在讨论具体个案之余，也在追问海外出行应如何保护自身安全。"
        ),
        "whyHot": (
            "事件把受害者身份锁定为中国公民且发生在境外，天然触发强共情与安全焦虑；案情兼具诱骗、囚禁、性侵多重恶性元素，"
            "冲击力强；在短视频与社交平台传播时，避险提示、防骗攻略等实用内容被大量转发，让话题从个案讨论扩散到"
            "「如何防止同类骗局」的普遍关切，参与面持续扩大。"
        ),
    },
    "林诗栋 打疯了": {
        "explanation": (
            "国乒新生代选手林诗栋在本届亚运会乒乓球比赛中状态火热、发挥强势，连续打出高水准对抗，"
            "相关精彩瞬间被网友大量剪辑传播并冲上热搜。外界关注他能否延续这股势头，对其后续关键场次充满期待。"
        ),
        "whyHot": (
            "林诗栋是国乒重点培养的新星，身份本身就有话题性；他在赛场上打出的一系列高难度对拉与逆风翻盘极具视觉冲击，"
            "单球片段天然适合短视频二次传播；加上正值亚运热度窗口，新星「打疯了」的燃点叙事在球迷和路人圈层同时扩散，"
            "讨论度快速放大。"
        ),
    },
    "中秋来庐山看千里江山": {
        "explanation": (
            "临近中秋假期，庐山结合「千里江山」主题推出赏月与山水游玩玩法，把国风意境和庐山云海、秋景绑在一起做成短视频内容，"
            "相关视频在抖音等平台走红，带动了一批用户把庐山列入中秋出行计划，围绕「去哪赏月、怎么玩」的讨论升温。"
        ),
        "whyHot": (
            "中秋是全年最贴合「赏月出行」的时令节点，用户需求集中爆发；庐山用「千里江山」国风IP叠加云海秋景，"
            "画面本身视觉冲击强、极易形成传播记忆点；短视频种草配合假期临近的时间窗口，让「去庐山看千里江山」"
            "从一条视频扩散成假期出行热点，参与和转发随节前氛围持续走高。"
        ),
    },
}

def rewrite_events(events):
    for ev in events:
        title = ev.get("title") or ev.get("name") or ev.get("eventName")
        if title in DEEP:
            ev["explanation"] = DEEP[title]["explanation"]
            ev["whyHot"] = DEEP[title]["whyHot"]
    return events

def rewrite_analyses(analyses):
    for title, a in analyses.items():
        if title in DEEP:
            a["explanation"] = DEEP[title]["explanation"]
            a["whyHot"] = DEEP[title]["whyHot"]
    return analyses

# --- ai-analysis.json ---
ai_path = os.path.join(pub, "ai-analysis.json")
ai = json.load(open(ai_path))
if isinstance(ai.get("analyses"), dict):
    ai["analyses"] = rewrite_analyses(ai["analyses"])
    json.dump(ai, open(ai_path, "w"), ensure_ascii=False, indent=2)
    print("ai-analysis.json 已更新")

# --- gen-daily-content.json ---
gd_path = os.path.join(pub, "gen-daily-content.json")
gd = json.load(open(gd_path))
if isinstance(gd.get("events"), list):
    gd["events"] = rewrite_events(gd["events"])
    json.dump(gd, open(gd_path, "w"), ensure_ascii=False, indent=2)
    print("gen-daily-content.json 已更新")

print("完成")