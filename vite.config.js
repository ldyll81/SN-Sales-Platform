import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { exec } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { resolve } from 'path'
import { promisify } from 'util'

const execP = promisify(exec)
const ROOT = resolve(__dirname)
// 飞书多维表格 Token：从 .env 读取（FEISHU_BASE_TOKEN），切勿硬编码提交到仓库
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '')
const BASE_TOKEN = env.FEISHU_BASE_TOKEN || process.env.FEISHU_BASE_TOKEN || ''
if (!BASE_TOKEN) {
  console.warn('[vite] 未检测到 FEISHU_BASE_TOKEN，飞书多维表格同步功能将不可用；请在项目根目录 .env 中配置该变量。')
}
const TABLES = {
  anomaly: 'tblQKbyNHj1H0kEP',
  knowledge: 'tblZWe2gy93XrDkc',
  sales: 'tbl7tWY7xss1wgtn'
}

const LARK_CLI = 'lark-cli'
function lark(...args) {
  const cmd = `${LARK_CLI} ${args.map(a => `"${a}"`).join(' ')}`
  return execP(cmd, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024, timeout: 60000 })
}

async function dumpTable(label, tableId) {
  const tmpFile = resolve(ROOT, `.sync_${label}.json`)
  try {
    const { stdout } = await lark('base', '+record-list', '--base-token', BASE_TOKEN, '--table-id', tableId, '--format', 'json')
    const s = String(stdout)
    const start = s.indexOf('{'), end = s.lastIndexOf('}')
    const json = s.slice(start, end + 1)
    writeFileSync(tmpFile, json, 'utf8')
    const data = JSON.parse(json)
    return {
      data: data?.data?.data || [],
      recordIds: data?.data?.record_id_list || [],
      count: data?.data?.data?.length || 0
    }
  } finally {
    if (existsSync(tmpFile)) unlinkSync(tmpFile)
  }
}

const TYPE_MAP = { '价格异常': 'price', '库存预警': 'stock', '竞品变动': 'competitor', '渠道异常': 'channel', '客户流失': 'customer' }
const SEV_MAP = { '高': 'high', '中': 'medium', '低': 'low' }
const STATUS_MAP = { '待处理': 'pending', '处理中': 'processing', '已处理': 'resolved', '无法处理': 'cannot_resolve' }
const STATUS_REV = { 'pending': '待处理', 'processing': '处理中', 'resolved': '已处理', 'cannot_resolve': '无法处理' }
function val(arr, i) { return Array.isArray(arr[i]) ? arr[i][0] : arr[i] }

function transformAnomaly(row) {
  return {
    title: row[0] || '', region: row[10] || '', company: row[5] || '',
    product: row[2] || '', type: TYPE_MAP[val(row, 6)] || 'price',
    severity: SEV_MAP[val(row, 11)] || 'medium', status: STATUS_MAP[val(row, 13)] || 'pending',
    time: row[4] || '', owner: row[9] || '', reason: row[7] || '',
    aiSuggestion: row[12] || '', scope: row[3] || '', script: row[14] || '', timeline: []
  }
}

function getLevel(row) { return val(row, 8) }

function transformSales(rows) {
  const months = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07']
  const empRows = rows.filter(r => val(r, 4) === '员工个人')
  const natRows = rows.filter(r => val(r, 4) === '全国')
  const areaRows = rows.filter(r => val(r, 4) === '大区')

  const empAmounts = months.map(m => { const r = empRows.find(r => r[0] === m); return r ? r[2] : 0 })
  const natAmounts = months.map(m => { const r = natRows.find(r => r[0] === m); return r ? r[2] : 0 })

  // 每区域的月度明细（用于图表）
  const areaNames = [...new Set(areaRows.map(r => r[3]))]
  const areaMonthly = {}
  areaNames.forEach(name => {
    areaMonthly[name] = months.map(m => {
      const r = areaRows.find(r => r[0] === m && r[3] === name)
      return r ? r[2] : 0
    })
  })

  const areaSalesRanking = areaNames.map(name => {
    const rs = areaRows.filter(r => r[3] === name)
    const latest = rs.find(r => r[0] === '2026-07')
    const first = rs.find(r => r[0] === '2026-02')
    const sales = latest ? latest[2] : 0
    const change = first && latest ? parseFloat(((latest[2] - first[2]) / first[2] * 100).toFixed(1)) : 0
    return { name, sales, change }
  }).sort((a, b) => b.sales - a.sales)

  return { months, empAmounts, natAmounts, areaSalesRanking, areaMonthly }
}

function buildForecast(natAmounts) {
  const allMonths = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']
  const actual = [...natAmounts, ...Array(allMonths.length - natAmounts.length).fill(null)]
  const deltas = natAmounts.slice(1).map((v, i) => v - natAmounts[i])
  const avgDelta = deltas.reduce((s, v) => s + v, 0) / deltas.length
  const variance = deltas.reduce((s, v) => s + (v - avgDelta) ** 2, 0) / deltas.length
  const band = Math.sqrt(variance)
  const forecast = [...Array(natAmounts.length - 1).fill(null), natAmounts[natAmounts.length - 1]]
  const lower = [...Array(natAmounts.length - 1).fill(null), natAmounts[natAmounts.length - 1] - band]
  const upper = [...Array(natAmounts.length - 1).fill(null), natAmounts[natAmounts.length - 1] + band]
  let base = natAmounts[natAmounts.length - 1]
  for (let i = natAmounts.length; i < allMonths.length; i++) {
    base += avgDelta
    forecast.push(Math.round(base))
    lower.push(Math.round(base - band))
    upper.push(Math.round(base + band))
  }
  return { months: allMonths, actual, forecast, lower, upper }
}

function mapRegion(city) {
  const m = { '上海市': '华东地区', '浙江省': '华东地区', '江苏省': '华东地区', '安徽省': '华东地区' }
  return m[city] || city
}

function mkScript(anomalies, knowledge, salesData) {
  const l2Raw = anomalies.filter(r => getLevel(r.raw) === '主管视图(L2)')
  const l2 = l2Raw.map((r, i) => ({ ...r.transformed, id: i + 1, _recordId: r.recordId }))
  const l3Only = anomalies.filter(r => getLevel(r.raw) === '高管视图(L3)')
  const l3 = [
    ...l2.map(r => ({ ...r, region: mapRegion(r.region), company: '圣农集团-华东区域', owner: '李红' })),
    ...l3Only.map((r, i) => ({ ...r.transformed, id: l2.length + i + 1, _recordId: r.recordId }))
  ]
  const { months, empAmounts, natAmounts, areaSalesRanking } = salesData
  const forecast = buildForecast(natAmounts)

  const S = JSON.stringify
  return `// 飞书多维表格实时同步 · ${new Date().toLocaleString('zh-CN')}
export const users={ '001':{id:'001',name:'张明',password:'123456',role:'employee',region:'华东地区',department:'零售事业部',position:'高级销售专员'},'002':{id:'002',name:'李红',password:'123456',role:'supervisor',region:'华东地区',position:'华东区域主管',scope:'上海市、江苏省、浙江省、安徽省'},'003':{id:'003',name:'王强',password:'123456',role:'executive',company:'圣农集团总部',position:'集团运营副总裁',scope:'全国六大区域业务运营管理'} }
export const anomalyTypeMap={ price:{label:'价格异常',color:'danger'},stock:{label:'库存预警',color:'warning'},competitor:{label:'竞品变动',color:'info'},channel:{label:'渠道异常',color:'primary'},customer:{label:'客户流失',color:'success'} }
export const severityMap={ high:{label:'高',color:'danger'},medium:{label:'中',color:'warning'},low:{label:'低',color:'success'} }
export const tianqiKnowledge=${S(knowledge)}
export const tianqiMessages=[{id:1,role:'assistant',content:'您好！我是天启，圣农零售业务的AI智能助手。',time:'2026-07-15 09:00:00'},{id:2,role:'user',content:'帮我查一下鸡胸肉调理品的规格和价格政策',time:'2026-07-15 09:01:00'},{id:3,role:'assistant',content:'好的！圣农鲜品鸡胸肉（冰鲜）规格为 2kg/袋（约8-10片），另有 1kg 家庭装。当前执行三季度价目政策：鲜品按日调价（产区成本+区域均价）。需要我帮您生成一份客户报价单吗？',time:'2026-07-15 09:01:30'}]
export const uploadedFiles=[{id:1,name:'2026年7月华东区拜访记录.xlsx',uploadTime:'2026-07-14 14:30:00',size:'2.4 MB',category:'拜访记录'},{id:2,name:'山姆门店巡店照片_脆皮炸鸡翅端架.jpg',uploadTime:'2026-07-13 10:15:00',size:'3.2 MB',category:'巡店照片'},{id:3,name:'竞品调研_安井锁鲜装6.0.pdf',uploadTime:'2026-07-12 16:40:00',size:'5.1 MB',category:'竞品信息'}]
export const uploadCategories=[{key:'all',label:'全部'},{key:'visit',label:'拜访记录'},{key:'feedback',label:'客户反馈'},{key:'shop',label:'巡店照片'},{key:'competitor',label:'竞品信息'}]
export const salesMonths=${S(months)}
export const employeeSalesData={months:${S(months)},amounts:${S(empAmounts)}}
export const employeeRankData={totalEmployees:48,rank:5,percentile:90,region:'华东地区'}
export const supervisorSalesData={months:${S(months)},amounts:${S(salesData.areaMonthly['华东地区'] || months.map(()=>0))}}
export const supervisorRankData={regions:${S(areaSalesRanking.map(r=>r.name))},values:${S(areaSalesRanking.map(r=>r.sales))},currentRegion:'华东地区',currentRank:${(areaSalesRanking.findIndex(r=>r.name==='华东地区')+1)||1},total:${areaSalesRanking.reduce((s,r)=>s+r.sales,0)}}
export const supervisorOverview={monthSales:${natAmounts.length?natAmounts[natAmounts.length-1]:0},monthSalesTrend:'↑ 8.3%',teamSize:48,anomalyHandleRate:87.5,targetRate:91.2}
export const nationalSalesData={months:${S(months)},amounts:${S(natAmounts)}}
export const executiveRankData=${S(areaSalesRanking.map(r=>({name:r.name,value:r.sales})))}
export const areaSalesRanking=${S(areaSalesRanking)}
export const kpiDailyWeeklyMonthly=[{period:'今日',value:486,unit:'万元',label:'今日销售额',trend:'+8.2%'},{period:'本周',value:3280,unit:'万元',label:'本周销售额',trend:'+5.4%'},{period:'本月',value:${natAmounts.length?natAmounts[natAmounts.length-1]:0},unit:'万元',label:'本月销售额',trend:'-6.6%'},{period:'目标',value:88.6,unit:'%',label:'年度目标完成率',trend:'—'}]
export const healthScore={score:82,level:'良好',items:[{label:'按时处理率',value:91},{label:'处理闭环率',value:88},{label:'平均响应效率',value:76},{label:'知识沉淀率',value:74}]}
export const targetProgress={monthlyTarget:380,completed:351.2,rate:92.4,remainingDays:18}
export const todos=[{id:1,text:'跟进山姆门店补货确认单签署',time:'10:00',done:false},{id:2,text:'拜访大客户 盒马鲜生 采购负责人',time:'14:00',done:false},{id:3,text:'提交本月竞品动态周报',time:'17:00',done:false},{id:4,text:'核对会员店端架陈列照片上传',time:'18:30',done:true}]
export const dailyReport={visits:['上午拜访盒马鲜生采购部，确认下月订货量上调15%','下午走访山姆门店，反馈脆皮炸鸡翅端架位置调整'],feedback:['客户反映鸡胸肉调理品需要更小规格包装（1kg家庭装）','会员店希望增加即食类新品试吃活动'],competitor:['安井锁鲜装6.0在商超渠道限时特价，需持续关注','皇家小虎新品火山石烤肠已进驻两家会员店端架'],tomorrow:['跟进盒马补货确认单签署','整理竞品促销明细并上传系统','重点客户 大润发 进行季度对账']}
export const teamRanking=[{rank:1,name:'王磊',sales:356,growth:18.2},{rank:2,name:'张明',sales:310,growth:12.5},{rank:3,name:'陈晨',sales:288,growth:9.8},{rank:4,name:'刘芳',sales:265,growth:6.4},{rank:5,name:'赵强',sales:241,growth:3.1}]
export const anomalyKPI={total:${l2.length+l3Only.length},avgHours:3.8,onTimeRate:91.2,escalated:${[...l2,...l3Only.map(r=>({...r.transformed}))].filter(a=>a.status==='cannot_resolve').length}}
export const forecastData=${S(forecast)}
export const supervisorAnomalies=${S(l2)}
export const executiveAnomalies=${S(l3)}
`
}

async function syncFromBitable() {
  const [anomaly, knowledge, sales] = await Promise.all([
    dumpTable('anomaly', TABLES.anomaly),
    dumpTable('knowledge', TABLES.knowledge),
    dumpTable('sales', TABLES.sales)
  ])
  const anomalies = anomaly.data.map((row, i) => ({
    raw: row,
    recordId: anomaly.recordIds[i] || '',
    transformed: transformAnomaly(row)
  }))
  const knowledgeItems = knowledge.data.map(row => ({
    keywords: (row[0] || '').split(',').map(s => s.trim()),
    category: Array.isArray(row[2]) ? row[2][0] : row[2],
    answer: row[1] || ''
  }))
  const salesData = transformSales(sales.data)
  const content = mkScript(anomalies, knowledgeItems, salesData)
  writeFileSync(resolve(ROOT, 'src/mock/data.js'), content, 'utf8')
  return {
    anomaly: anomaly.count, knowledge: knowledge.count, sales: sales.count,
    l2: anomalies.filter(r => getLevel(r.raw) === '主管视图(L2)').length,
    l3: anomalies.filter(r => getLevel(r.raw) === '高管视图(L3)').length
  }
}

// 读取 POST body
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')) } catch { resolve({}) } })
    req.on('error', reject)
  })
}

// 飞书多维表格实时同步插件（拉取 + 写入）
function syncPlugin() {
  return {
    name: 'feishu-base-sync',
    configureServer(server) {
      // 拉取同步
      server.middlewares.use('/api/sync', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
          return
        }
        try {
          const result = await syncFromBitable()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, ...result }))
        } catch (err) {
          console.error('[sync]', err.message)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: err.message }))
        }
      })

      // 写入单条异常状态
      server.middlewares.use('/api/anomaly', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
          return
        }
        try {
          const body = await readBody(req)
          const { recordId, status, aiSuggestion, scope, script } = body
          if (!recordId) throw new Error('缺少 recordId')

          const fields = {}
          if (status) fields['处理状态'] = STATUS_REV[status] || status
          if (aiSuggestion !== undefined) fields['AI处置建议'] = aiSuggestion
          if (scope !== undefined) fields['建议幅度'] = scope
          if (script !== undefined) fields['话术模板'] = script

          // 通过文件传递 JSON 避免 shell 中文编码问题
          const tmpFile = resolve(ROOT, '.sync_write.json')
          writeFileSync(tmpFile, JSON.stringify(fields), 'utf8')
          try {
            const cmd = `${LARK_CLI} base +record-upsert --base-token "${BASE_TOKEN}" --table-id "${TABLES.anomaly}" --record-id "${recordId}" --json @.sync_write.json`
            await execP(cmd, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024, timeout: 30000 })
          } finally {
            if (existsSync(tmpFile)) unlinkSync(tmpFile)
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, updated: fields }))
        } catch (err) {
          console.error('[write]', err.message)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: err.message }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [vue(), syncPlugin()],
  server: { port: 3000 }
})
