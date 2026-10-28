// 截图脚本：截取6张前端原型页面图
import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

// 截图使用的浏览器：默认用 puppeteer 自带的 Chromium；
// 如需改用本机 Edge，请设置环境变量 EDGE_PATH 指向 msedge.exe，例如：
//   set EDGE_PATH="<本机 msedge.exe 的完整路径>"
const EDGE = process.env.EDGE_PATH;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function login(page, id, name) {
  // 回到登录页
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await sleep(500);
  // 清空 sessionStorage 确保是登录页
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await sleep(500);

  // 填写工号
  await page.type('input[placeholder="请输入工号"]', id);
  // 填写姓名
  await page.type('input[placeholder="请输入姓名"]', name);
  // 填写密码
  await page.type('input[placeholder="请输入密码"]', '123456');
  // 点击登录
  await page.click('.login-btn');
  // 登录有 600ms 延迟
  await sleep(1500);
}

async function shot(page, path) {
  await page.screenshot({ path, fullPage: true });
  console.log('✅ 已截图:', path);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // ① 登录页
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await sleep(800);
  await shot(page, `${OUT}/01-login.png`);

  // ② 员工工作台
  await login(page, '001', '张明');
  await page.goto(`${BASE}/employee/tianqi`, { waitUntil: 'networkidle0' });
  await sleep(2000); // 等图表渲染
  await shot(page, `${OUT}/02-employee-dash.png`);

  // ③ 天启AI对话浮窗
  await page.click('.tianqi-float-btn');
  await sleep(1200); // 等浮窗动画
  await shot(page, `${OUT}/03-tianqi-chat.png`);

  // ④ 主管信息处理
  await login(page, '002', '李红');
  await page.goto(`${BASE}/supervisor/info-process`, { waitUntil: 'networkidle0' });
  await sleep(2000);
  await shot(page, `${OUT}/04-supervisor-process.png`);

  // ⑤ 高层信息汇总
  await login(page, '003', '王强');
  await page.goto(`${BASE}/executive/info-summary`, { waitUntil: 'networkidle0' });
  await sleep(2000);
  await shot(page, `${OUT}/05-executive-summary.png`);

  // ⑥ 高层仪表盘
  await page.goto(`${BASE}/executive/tianqi`, { waitUntil: 'networkidle0' });
  await sleep(2000);
  await shot(page, `${OUT}/06-executive-dash.png`);

  await browser.close();
  console.log('🎉 全部完成');
})().catch(err => {
  console.error('❌ 截图失败:', err.message);
  process.exit(1);
});
