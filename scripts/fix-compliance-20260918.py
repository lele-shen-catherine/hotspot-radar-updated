#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
热点雷达 2026-09-18 数据合规修复脚本
修复项（对照硬性规则门禁）:
  1. 删除政治敏感「九一八事变爆发95周年」（不上任何板块、不评标）——radar/ai-analysis/gen-daily-content/business-advice/coreThemes
  2. 事件解释(explanation) 去套话、改纯叙事（班费、粉笔；九一八直接删除）
  3. 为什么热度高(whyHot) 去模板套话、改真实传播动因（班费/粉笔）；南方医科跳楼去掉借势尾巴
  4. ai-analysis business 字段：去掉「借XX热点」的通用模板尾巴（保持"仅观察/不借势"或纯业务常规）
"""
import json, os, re, sys

BASE = '/root/.joyclaw/workspace/hotspot-radar-updated/public/data'
POLITICAL = '九一八'

def load(name):
    p = os.path.join(BASE, name)
    with open(p, encoding='utf-8') as f:
        return json.load(f)

def save(name, d):
    p = os.path.join(BASE, name)
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    print('  saved', name)

# ---------- 1. radar.json：删除九一八 ----------
radar = load('radar.json')
before = len(radar['hotspots'])
radar['hotspots'] = [h for h in radar['hotspots']
                     if '九一八' not in (h.get('title') or '')
                     and '九一八' not in (h.get('eventName') or '')
                     and '九一八' not in (h.get('topic') or '')]
after = len(radar['hotspots'])
print(f'[radar.json] hotspots {before} -> {after} (remove {before-after} political)')
save('radar.json', radar)

# ---------- 2) ai-analysis.json ----------
aa = load('ai-analysis.json')
analyses = aa['analyses']  # dict
removed_keys = []
for k in list(analyses.keys()):
    if '九一八' in k or '九一八' in str(analyses[k].get('eventName', '')):
        removed_keys.append(k)
        del analyses[k]
print(f'[ai-analysis.json] removed political keys: {removed_keys}')

# 重写套话项
def rewrite_why_hot(entry, title, real_reason):
    """将模板套话替换为真实传播动因（纯动因，无借势尾巴）"""
    if entry and entry.get('whyHot'):
        old = entry['whyHot']
        # 模板特征：『围绕标题…公众对该事件本身的关注与讨论形成热度主体；…具备传播触发点』
        if '围绕「' in old and '关注与讨论形成热度主体' in old:
            entry['whyHot'] = real_reason
            print(f'    whyHot rewrite: {title}')
    if entry and entry.get('explanation'):
        old = entry['explanation']
        # 套话特征：原样粘贴标题 + 通用词
        if old.startswith('围绕「') or title in old:
            pass  # 由外部传入叙事 explanation
        if old.strip() == f'围绕「{title}」所涉事项，相关主体/进展已引发关注，各方对其经过与影响持续讨论。':
            entry['explanation'] = ''  # 占位，由下方赋值

def set_entry(title, explanation, why_hot, risk=None, business=None):
    if title in analyses:
        e = analyses[title]
        e['explanation'] = explanation
        e['whyHot'] = why_hot
        if risk is not None:
            e['risk'] = risk
        if business is not None:
            e['business'] = business
        print(f'    fixed entry: {title}')

# 班费：家长群大战
set_entry(
    '一千元班费引发的家长群大战',
    '某小学班级因收取一千元班费，费用明细与用途引发家长在群里激烈争论，一方认为支出过高、一方主张支持班级活动，争论从班级群扩散到网络，校方暂未公开回应。',
    '事件戳中"家长为孩子教育花钱该不该较真"的普遍共鸣：金额具体、争议对立、群聊截图可传播，且班里每对父母都天然带入身份，转发即表态，情绪黏性强、扩散快。',
    '风险等级：低。可自然关联本地生活消费场景，注意不夸大功效、不做虚假承诺。'
)

# 粉笔：公考培训小作文
set_entry(
    '粉笔再发公考培训小作文',
    '公考培训机构粉笔官方账号再次发布一篇以叙事口吻撰写的"小作文"，以学员故事/心路历程为主打卖点，内容在考公备考人群中引发转发与讨论，既有共鸣也有对其营销话术的质疑。',
    '内容直接对准考公人群的备考焦虑与上岸期待，自带身份代入感，且"培训机构发软文"本身具有争议张力，网友一边转一边讨论"它又来了"，转发即表达态度，传播门槛低。',
    '风险等级：低。可自然关联本地生活消费场景，注意不夸大功效、不做虚假承诺。'
)

# 5) 南方医科跳楼：去掉借势尾巴（只留动因）
if '警方调查南方医科大学跳楼事件' in analyses:
    e = analyses['警方调查南方医科大学跳楼事件']
    e['whyHot'] = '坠楼事件突发、真相待查，公众既关切当事人命运又追问公共场合安全与学校管理，共情与质疑并存；事件本身自带"高度敏感+信息不对称"，讨论在"追问进展-表达同情-反思公共安全"间流转，情绪粘性强。'
    # business 字段应为"仅观察不借势"（不含任何借势尾巴）
    if isinstance(e.get('business'), list):
        e['business'] = [{'business': '全部', 'connection': '高敏感仅观察', 'action': '仅观察不借势', 'evidence': '仅观察'}]
    print('    fixed entry: 南方医科跳楼 (whyHot 去尾巴 / business 仅观察)')

save('ai-analysis.json', aa)

# ---------- 3) gen-daily-content.json ----------
gdc = load('gen-daily-content.json')
if 'events' in gdc and isinstance(gdc['events'], list):
    before = len(gdc['events'])
    gdc['events'] = [ev for ev in gdc['events']
                     if '九一八' not in str(ev.get('title', ''))
                     and '九一八' not in str(ev.get('eventName', ''))]
    print(f'[gen-daily-content.json] events {before} -> {len(gdc["events"])}')
    save('gen-daily-content.json', gdc)
elif 'events' in gdc and isinstance(gdc['events'], dict):
    before = len(gdc['events'])
    removed = [k for k in gdc['events'] if '九一八' in k or '九一八' in str(gdc['events'][k].get('eventName',''))]
    for k in removed:
        del gdc['events'][k]
    print(f'[gen-daily-content.json] events dict {before} -> {len(gdc["events"])} removed {removed}')
    save('gen-daily-content.json', gdc)

# ---------- 4) business-advice.json：coreThemes 去九一八 ----------
ba = load('business-advice.json')
if 'coreThemes' in ba and isinstance(ba['coreThemes'], list):
    before = len(ba['coreThemes'])
    ba['coreThemes'] = [t for t in ba['coreThemes'] if '九一八' not in str(t)]
    print(f'[business-advice.json] coreThemes {before} -> {len(ba["coreThemes"])}')
save('business-advice.json', ba)

print('ALL DONE')