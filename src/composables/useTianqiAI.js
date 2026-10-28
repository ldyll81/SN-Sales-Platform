// ============================================================
// 天启 AI 问答引擎（本地规则 + 知识库模拟，角色感知）
// 说明：当前为概念验证，采用关键词匹配 + 知识库/数据统计生成回复，
// 未接入真实大模型（readme 已声明 AI 接口未对接）。
// ============================================================

import {
  tianqiKnowledge,
  supervisorAnomalies,
  executiveAnomalies,
  nationalSalesData,
  areaSalesRanking,
  dailyReport
} from '../mock/data'

export const ROLE_LABELS = {
  employee: '员工',
  supervisor: '主管',
  executive: '高层'
}

// 各角色快捷问句（浮窗渲染为 chips）
export const QUICK_PROMPTS = {
  employee: ['鸡胸肉有哪些规格？', '本月的促销活动？', '退换货流程？', '怎么准备客户拜访？', '生成今日日报'],
  supervisor: ['本周华东竞品促销汇总', '上周处理了多少异常？', '写一条大客户挽留话术', '写一封大客户促销邮件'],
  executive: ['对比华东和华南的异常处理效率', 'C端增长拐点在哪？', '异常处理健康度如何？', '生成Q3经营分析报告摘要']
}

// 关键词匹配知识库
function matchKnowledge(question) {
  for (const item of tianqiKnowledge) {
    if (item.keywords.some(k => question.includes(k))) {
      return `【${item.category}】${item.answer}`
    }
  }
  return null
}

// ---------- L1 员工端 ----------

function buildDailyReportText() {
  return `📋 已根据今日聊天记录+拜访数据自动生成日报：\n\n【今日拜访】\n· ${dailyReport.visits.join('\n· ')}\n\n【客户反馈】\n· ${dailyReport.feedback.join('\n· ')}\n\n【竞品动态】\n· ${dailyReport.competitor.join('\n· ')}\n\n【明日计划】\n· ${dailyReport.tomorrow.join('\n· ')}\n\n确认无误后即可一键提交，全程约3分钟，较手工填写节省85%时间。`
}

function buildVisitPrep() {
  return `📋 拜访准备清单：\n1）拉取客户近3个月订货与回款数据；\n2）查看竞品在其渠道的促销动作（今天监测到安井锁鲜装6.0在会员店特价）；\n3）准备当季新品试吃方案（脆皮炸鸡翅/盐酥鸡）；\n4）明确拜访目标：增量/铺货/回款。\n需要我为您生成客户画像吗？`
}

// ---------- L2 主管端 ----------

function buildCompetitorSummary() {
  const list = supervisorAnomalies.filter(a => a.type === 'competitor')
  const lines = list.map(a => `· ${a.region}｜${a.title}（严重度：${a.severity === 'high' ? '高' : a.severity === 'medium' ? '中' : '低'}）\n  AI应对：${a.aiSuggestion}`)
  return `🔍 本周华东区域竞品变动汇总（共 ${list.length} 起）：\n\n${lines.join('\n\n')}\n\n提示：优先用差异化卖点（全产业链可溯源）应对，避免直接价格战。`
}

function buildAnomalyStats() {
  const all = supervisorAnomalies
  const pending = all.filter(a => a.status === 'pending')
  const processing = all.filter(a => a.status === 'processing')
  const resolved = all.filter(a => a.status === 'resolved')
  const escalated = all.filter(a => a.status === 'cannot_resolve')
  const high = all.filter(a => a.severity === 'high')
  return `📊 华东区域本周异常态势（共 ${all.length} 起）：\n\n· 待处理 ${pending.length} 起（其中高优先级 ${high.filter(a => a.status === 'pending').length} 起：价格倒挂、炸鸡翅库存告急、大客户流失等）\n· 处理中 ${processing.length} 起\n· 已处理 ${resolved.length} 起\n· 已上报集团 ${escalated.length} 起\n\n建议优先处置高优先级事项，AI已就每条给出调价/补货/话术建议，目标将响应从4.5天压缩至4小时内。`
}

function buildRetentionScript() {
  return `✍️ 大客户挽留话术：\n\n「王总您好，近期看到贵司采购量有所调整，想了解一下是产品还是服务环节需要改进？我们为贵司准备了定制菜谱方案和旺季保供计划，能否约个时间当面沟通，一定给您一个满意的方案。」\n\n要点：先倾听原因 → 给定制方案 → 留台阶（保供/返利）。`
}

function buildPromoEmail() {
  return `✉️ 促销邮件草稿（可直接复制发送）：\n\n【主题】圣农新品季 · 专属方案已为您备好\n\n尊敬的陈经理：\n\n感谢贵司长期以来对圣农的支持！本季度为您准备了以下专属方案：\n\n1️⃣ 新品试吃：脆皮炸鸡翅 / 盐酥鸡 免费试吃装 ×1 箱\n2️⃣ 限时促销：指定 SKU 满 50 箱立减 5%，叠加季末返点\n3️⃣ 保供承诺：旺季库存优先保障，冷链 48 小时直达\n\n如方便，期待与您约 10 分钟沟通，为您详细讲解。\n\n圣农销售团队\n2026-08-10`
}

// ---------- L3 高层端 ----------

function buildRegionCompare() {
  const east = executiveAnomalies.filter(a => a.region === '华东地区')
  const south = executiveAnomalies.filter(a => a.region === '华南地区')
  const eastPending = east.filter(a => a.status === 'pending').length
  const southPending = south.filter(a => a.status === 'pending').length
  const eastSales = (areaSalesRanking.find(r => r.name === '华东地区') || {}).sales || 0
  const southSales = (areaSalesRanking.find(r => r.name === '华南地区') || {}).sales || 0
  return `📊 华东 vs 华南 对比：\n\n【华东地区】销售额 ${eastSales.toLocaleString()}万（环比+8.6%）；本周异常 ${east.length} 起，待处理 ${eastPending} 起，处理体系成熟但量大。\n【华南地区】销售额 ${southSales.toLocaleString()}万（环比+12.4%）；本周异常 ${south.length} 起，待处理 ${southPending} 起，异常少但响应效率待提升。\n\n建议：华东保持节奏、重点攻破价格倒挂；华南加大巡检密度，捕捉竞品新品动作。`
}

function buildGrowthInsight() {
  const first = nationalSalesData.amounts[0]
  const last = nationalSalesData.amounts[nationalSalesData.amounts.length - 1]
  const cagr = (((last / first) ** (1 / 5) - 1) * 100).toFixed(1)
  const up = areaSalesRanking.filter(r => r.change > 0)
  const down = areaSalesRanking.filter(r => r.change < 0)
  const upText = up.slice(0, 3).map(r => `${r.name}(+${r.change}%)`).join('、') + (up.length > 3 ? ` 等${up.length}个区域` : '')
  const downText = down.map(r => `${r.name}(${r.change}%)`).join('、')
  return `📈 C端增长拐点分析：\n\n近6个月全国销售额由 ${first.toLocaleString()}万升至 ${last.toLocaleString()}万（月均复合增速约 ${cagr}%）。\n增长引擎：${upText}。\n承压区域：${downText}。\n\n7月环比-6.6%属季节性回调，AI预测8月回升至14,900万元。建议资源向西南、华南倾斜，并针对西北价格倒挂启动专项整治。`
}

function buildHealthSummary() {
  return `🩺 异常处理健康度：82分（良好）。\n· 按时处理率 91%\n· 处理闭环率 88%\n· 平均响应效率 76%\n· 知识沉淀率 74%\n\n较上月提升6分，主要受益于价格异常响应从4.5天压缩至4小时内。建议重点提升西北/华北区域的闭环率。`
}

function buildExecutiveReport() {
  const all = executiveAnomalies
  const resolved = all.filter(a => a.status === 'resolved').length
  const pending = all.filter(a => a.status === 'pending').length
  const escalated = all.filter(a => a.status === 'cannot_resolve').length
  const last = nationalSalesData.amounts[nationalSalesData.amounts.length - 1]
  const ranks = [...areaSalesRanking].sort((a, b) => b.sales - a.sales).slice(0, 3)
  return `📄 Q3经营分析报告摘要（AI生成）：\n\n【销售额】7月 ${last.toLocaleString()}万元，环比-6.6%，同比+8.7%。\n【区域TOP3】${ranks.map(r => `${r.name} ${r.sales.toLocaleString()}万`).join(' / ')}。\n【异常态势】本周共 ${all.length} 起：已处理 ${resolved} 起、待处理 ${pending} 起、上报集团 ${escalated} 起。\n【机会品类】西南盐酥鸡、华南鸡肉肠新品、华东1kg家庭装。\n【主要风险】西北批发价倒挂、华北大客户预算下调。\n\n完整报告已归档，可语音召唤妙记生成会议纪要与行动项。`
}

// ---------- 主入口 ----------

export function askTianqi(role, question) {
  const q = (question || '').replace(/\s+/g, '')

  if (role === 'employee') {
    if (/日报/.test(q)) return buildDailyReportText()
    if (/拜访|话术|准备/.test(q)) return buildVisitPrep()
    const knowledge = matchKnowledge(q)
    if (knowledge) return knowledge
    return '好的，收到。我可以帮您查询产品规格、价格政策、促销、配送、售后、保质期等，也可以帮您生成今日日报。例如直接问我「鸡胸肉规格」「本月促销」「生成今日日报」。'
  }

  if (role === 'supervisor') {
    if (/邮件|写一封/.test(q)) return buildPromoEmail()
    if (/竞品/.test(q)) return buildCompetitorSummary()
    if (/异常|处理|态势/.test(q)) return buildAnomalyStats()
    if (/话术|挽留|客户/.test(q)) return buildRetentionScript()
    const knowledge = matchKnowledge(q)
    if (knowledge) return knowledge
    return '好的，收到。我可以帮您做区域级分析：竞品促销汇总、异常态势统计、大客户挽留话术、促销邮件等，例如「写一封大客户促销邮件」。'
  }

  if (role === 'executive') {
    if (/对比|效率/.test(q)) return buildRegionCompare()
    if (/拐点|增长/.test(q)) return buildGrowthInsight()
    if (/健康|态势/.test(q)) return buildHealthSummary()
    if (/报告|Q3|经营|总结/.test(q)) return buildExecutiveReport()
    return '好的，收到。我可以帮您做战略级分析：区域对比、增长拐点、异常健康度、Q3经营报告等，例如「对比华东和华南的异常处理效率」。'
  }

  return '收到您的消息，已同步到工作台，稍后为您跟进。'
}
