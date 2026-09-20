#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一次性修复 09-20 热点雷达 explanation/propagation 模板套话为真实叙事/纯动因。
依据 hard rules:
- eventSummary/explanation = 纯叙事(谁干了什么→结果), 不复制标题
- propagation/whyHot = 纯传播动因(信息增量/时间节点/情绪/冲突/身份/跨圈层), 无借势尾巴
"""
import json, re, io

def load(p):
    with io.open(p, encoding='utf-8') as f:
        return json.load(f)

def dump(p, d):
    with io.open(p, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)

# 标题 -> (事件解释叙事, 为什么热度高纯动因)
NARRATIVE = {
    "许嵩冯禧官宣结婚": (
        "歌手许嵩与演员冯禧公开官宣结婚，消息经本人及媒体对外发布后迅速扩散，公众对其恋情修成正果致以祝福，婚讯成为当天广泛关注的情感话题。",
        "知名音乐人与当红演员的婚讯自带身份反差与话题性，兼具公众人物隐私曝光的吸引力；粉丝基数大、情感黏性强，祝福与讨论持续高位传播。"
    ),
    "布莱顿3:0完胜阿森纳": (
        "英超联赛中布莱顿客场以3:0大胜阿森纳，比赛结束比分已公布。作为夺冠热门，阿森纳主场爆冷大比分落败，让球迷聚焦于胜负与战术复盘展开热议。",
        "强队爆冷被大比分击败，结果自带\u201c意外\u201d信息量，契合球迷对胜负与复盘的热情；比分可视化、易截图分享，抖音刚上榜新鲜度叠加即时流量放大传播。"
    ),
    "被快递员看光女子称事发后长期失眠": (
        "一名女性反映在取件时被快递员偷窥隐私，事后称因此长期失眠，经微博曝光后引发舆论关注，话题聚焦女性隐私保护与快递员服务规范。",
        "涉及女性隐私与人身安全，踩中大众普遍的安全焦虑与身份代入；\u201c长期失眠\u201d呈现后续伤害与共鸣，微博情感化讨论放大情绪，推动话题持续扩散。"
    ),
    "丈夫家暴妻子致死子女出具谅解书": (
        "一起丈夫家暴致妻子死亡的案件引发关注，子女一方出具谅解书，案件由此进入舆论视线，家暴、司法判罚与情感伦理多议题交织。",
        "家暴致死人命案自带社会敏感与情感冲击，触及反家暴与司法公正公共议题；\u201c谅解书\u201d构成伦理争议与信息增量，讨论与转发随关注上升。"
    ),
    "12306：已拒绝出票133.1万张": (
        "12306通报已拒绝出票133.1万张，系对存在购票风险或违规操作的订单进行拦截。官方披露这一数字，令公众聚焦春运抢票、黄牛与平台风险治理。",
        "铁路购票直接关乎出行刚需，\u201c拒绝出票133.1万张\u201d的大数字具信息增量与权威背书；涉及第三方抢票、倒票等乱象，公众关注度高、讨论有利益代入。"
    ),
    "2026苏超开赛": (
        "2026赛季苏超联赛开赛，赛事启动信息对外公布，引发球迷与市民对赛程、参赛球队与观赛安排的关注。",
        "苏超开赛自带赛季启动的仪式感与球迷身份代入，入围时间节点产生集中关注；话题更贴近本地生活，带动区域性讨论与关注累积。"
    ),
}

def norm(t):
    # 规范化标题用于匹配（去空格、把常见乱序处理）
    return re.sub(r'\s+', '', t)

def fix_radar(path):
    d = load(path)
    fixed = 0
    for it in d.get('hotspots', []):
        key = it.get('title', '').strip()
        for probe, vals in NARRATIVE.items():
            if probe in key:
                it['eventSummary'] = vals[0]
                it['propagation'] = vals[1]
                fixed += 1
                break
    dump(path, d)
    return fixed

def fix_ai(path):
    d = load(path)
    fixed = 0
    for title, a in d.get('analyses', {}).items():
        t = title.strip()
        for probe, vals in NARRATIVE.items():
            if probe in t:
                a['explanation'] = vals[0]
                a['whyHot'] = vals[1]
                fixed += 1
                break
    dump(path, d)
    return fixed

if __name__ == '__main__':
    print('radar fixed:', fix_radar('public/data/radar.json'))
    print('ai-analysis fixed:', fix_ai('public/data/ai-analysis.json'))