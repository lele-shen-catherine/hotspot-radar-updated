import json

p = 'public/data/ai-analysis.json'
a = json.load(open(p, encoding='utf-8'))
analyses = a['analyses']

def biz_single(name, conn, act, evi):
    return [{'business': '本地生活', 'connection': conn, 'action': act, 'evidence': evi}]

# 修正 ai-analysis 内 business 字段：去掉硬凑(华为赛力斯/美联储→本地生活无关联)与模板化「尝鲜/体验」
analyses['华为赛力斯合作模式调整']['business'] = biz_single(
    '华为赛力斯合作模式调整',
    '产业/财经热点，与本地生活消费场景无直接结合点',
    '不硬凑借势，本地生活按常规运营',
    '不借势'
)
analyses['一千元班费引发的家长群大战']['business'] = biz_single(
    '一千元班费引发的家长群大战',
    '家庭/亲子/家校话题，天然可承接家庭晚餐、亲子用餐、家庭生活服务场景',
    '围绕家庭聚餐与亲子场景做家庭餐/即时零售/家政服务承接',
    '单热点·家庭场景'
)
analyses['美联储时隔三年多宣布加息25个基点']['business'] = biz_single(
    '美联储时隔三年多宣布加息25个基点',
    '宏观财经信号，与本地生活本地业务无直接关联',
    '不硬凑借势，仅做常规运营',
    '不借势'
)
analyses['粉笔再发公考培训小作文']['business'] = biz_single(
    '粉笔再发公考培训小作文',
    '备考/考公人群场景，可面向备考族做轻量陪伴类承接（咖啡/零食补给）',
    '面向备考人群做轻量陪伴承接，不消费考试焦虑',
    '单热点人群场景'
)
# 南方医科大=高敏感仅观察，已正确

json.dump(a, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ai-analysis.json business 字段已修正')