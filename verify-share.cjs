const { chromium } = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  const remote = { checks: [], todos: [] };
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://ip1f-calendar.vdodaco.chatgpt.site/**', async route => {
    const request = route.request();
    const payload = request.postDataJSON();
    if (request.url().endsWith('/api/session')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(remote) });
    if (payload.kind === 'add_todo') remote.todos.push({ id: payload.id, date: payload.date, text: payload.text });
    if (payload.kind === 'delete_todo') remote.todos = remote.todos.filter(item => item.id !== payload.id);
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.addInitScript(() => localStorage.setItem('ip1f-share:v2:identity', JSON.stringify({ seat: '3', name: '測試同學' })));
  await page.goto('file:///C:/Users/User/Desktop/IP_Calender/IP1F_share/index.html');
  await page.locator('#identity').waitFor({ state: 'hidden' });
  if (await page.title() !== 'IP1F｜薇閣國小一年義班行事曆') throw Error('Incorrect page title');
  if (await page.locator('h1').innerText() !== '薇閣小學一年義班 測試同學行事曆') throw Error('Incorrect heading');
  if (await page.locator('.calendar thead th').count() !== 7) throw Error('Calendar still has a left child/grade column');
  if (await page.locator('select').count() !== 1) throw Error('Unexpected child selector');
  const visible = await page.locator('body').innerText();
  for (const forbidden of ['哥哥', '二年級', '校車', '接送', '學習帳密']) if (visible.includes(forbidden)) throw Error(`Private content visible: ${forbidden}`);
  const schedule = await page.evaluate(() => ({ base: window.IP1F_DATA.base, activities: window.IP1F_DATA.activities, subjects: window.IP1F_DATA.subjects }));
  const readings = {
    '2026-09-16': '中文第 1 次｜上台座號：1、2、3、4、42、43、44',
    '2026-09-23': '英文第 1 次｜上台座號：13、14、15、16、32、33、34、35',
    '2026-09-30': '中文第 2 次｜上台座號：21、22、23、24、25、26、27',
    '2026-10-14': '中文第 3 次｜上台座號：9、10、11、12、36、37、38',
    '2026-10-21': '英文第 2 次｜上台座號：17、18、19、20、28、29、30、31',
    '2026-11-18': '英文第 3 次｜上台座號：5、6、7、8、39、40、41'
  };
  for (const [date, text] of Object.entries(readings)) if (!schedule.base[date]?.grade1?.includes(text)) throw Error(`Morning reading seats missing on ${date}`);
  const wbc = schedule.activities.find(item => item.date === '2026-09-15' && item.label === 'WBC');
  for (const detail of ['WBC 大樓', '600cc 水壺', 'wbc-notice-2026-09-15.jpg']) if (!wbc?.text.includes(detail)) throw Error(`WBC notice missing: ${detail}`);
  const coding = schedule.subjects.find(item => item.date === '2026-09-17' && item.subject === '數位與邏輯');
  if (!coding?.tasks.includes('第 3 週：海豚歐文的研究室（一）｜STEAM＋Maker')) throw Error('Coding schedule missing or incorrect');
  if (await page.locator('td[data-date="2026-09-17"] .pill-coding').count() !== 1) throw Error('Coding label style missing');
  await page.evaluate(() => localStorage.setItem('ip-calendar:v2:device-state', 'personal-version-marker'));
  await page.locator('#todo-text').fill('分享版測試待辦');
  await page.locator('#add').click();
  await page.reload();
  if (!(await page.locator('body').innerText()).includes('分享版測試待辦')) throw Error('Share todo did not persist');
  const storage = await page.evaluate(() => ({ personal: localStorage.getItem('ip-calendar:v2:device-state'), identity: localStorage.getItem('ip1f-share:v2:identity') }));
  if (storage.personal !== 'personal-version-marker' || !storage.identity) throw Error('Storage namespaces are not isolated');
  await page.setViewportSize({ width: 390, height: 844 });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Unexpected page-level mobile overflow');
  if (errors.length) throw Error(errors.join('\n'));
  console.log('PASS: IP1F-only data, private sections absent, 7-column layout, isolated persistence, mobile layout');
  await browser.close();
})();
