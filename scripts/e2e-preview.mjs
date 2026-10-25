/**
 * 对运行中的本地 Starlight 站做行为冒烟：
 * 按钮挂载 → 菜单项 → 平台链接 → 选区浮标 → 卡片生成（双风格）→ 微信 UA 分支。
 * 产物（卡片 PNG + 弹层截图）落 E2E_OUT，供人工过目。
 *
 * 用法示例：E2E_BASE=http://127.0.0.1:4321 E2E_PATH=/docs/foo/ node scripts/e2e-preview.mjs
 * 可选：E2E_CANONICAL_HOST=www.example.com（断言分享链接用 canonical 域）、E2E_COPYLINK（菜单文案语言）。
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.E2E_BASE || 'http://127.0.0.1:4321';
const PATH = process.env.E2E_PATH || '/';
const OUT = process.env.E2E_OUT || '/tmp/share-e2e';
const CANONICAL_HOST = process.env.E2E_CANONICAL_HOST || '';
// 菜单断言文案（语言差异键，随站点语言配置）
const COPYLINK = process.env.E2E_COPYLINK || '复制链接';
mkdirSync(OUT, { recursive: true });

const failures = [];
const ok = (name) => console.log(`  ✓ ${name}`);
const fail = (name, detail) => {
  failures.push(name);
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
};

async function collectEvents(page) {
  await page.addInitScript(() => {
    window.__shareEvents = [];
    document.addEventListener('share-actions', (e) => window.__shareEvents.push(e.detail));
  });
}

async function waitForCard(browser, { ua } = {}) {
  const ctxOpts = ua ? { userAgent: ua } : {};
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();
  await collectEvents(page);
  await page.goto(BASE + PATH, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button.sa-btn', { timeout: 15000 });
  return { context, page };
}

const browser = await chromium.launch();

// ---------- 1. 挂载位置 + 菜单项 ----------
{
  const { context, page } = await waitForCard(browser);
  const where = await page.evaluate(() => {
    const btn = document.querySelector('button.sa-btn');
    if (btn?.closest('.page-actions-bar')) return 'in-pa-bar';
    const bar = btn?.closest('.sa-bar');
    if (bar?.previousElementSibling?.tagName === 'H1') return 'own-bar-after-h1';
    return 'nowhere';
  });
  where !== 'nowhere' ? ok(`按钮挂载（${where}）`) : fail('按钮挂载', where);

  await page.click('button.sa-btn');
  await page.waitForSelector('.sa-popover');
  const items = await page.$$eval('.sa-popover .sa-item', (els) =>
    els.map((e) => ({ text: e.textContent?.trim() ?? '', href: e.getAttribute('href') ?? '' })),
  );
  const texts = items.map((i) => i.text);
  for (const want of ['生成分享卡片', COPYLINK, 'X', 'Facebook', 'LINE']) {
    texts.includes(want) ? ok(`菜单项「${want}」`) : fail(`菜单项「${want}」`, `got: ${texts.join('|')}`);
  }
  const xHref = items.find((i) => i.text === 'X')?.href ?? '';
  const hrefOk =
    xHref.includes('twitter.com') &&
    (CANONICAL_HOST ? decodeURIComponent(xHref).includes(CANONICAL_HOST) : /^https?:/.test(decodeURIComponent(xHref)));
  hrefOk ? ok('X 意图链接有效（含绝对 URL）') : fail('X 意图链接', xHref);
  await page.keyboard.press('Escape');
  await context.close();
}

// ---------- 2. 选区浮标 → 卡片生成（双风格 + PNG 落盘） ----------
{
  const { context, page } = await waitForCard(browser);
  await page.evaluate(() => {
    const root =
      document.querySelector('main .sl-markdown-content') ??
      document.querySelector('main article') ??
      document.querySelector('main');
    // 选「文本够长的段落」——短标题式首段（如「第八十講」）低于插件 minQuoteLength 会按设计不触发
    const p = [...(root?.querySelectorAll('p') ?? [])].find((el) => (el.textContent ?? '').trim().length >= 12);
    if (!p) throw new Error('no paragraph');
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    let textNode = null;
    let best = 0;
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.textContent.trim().length > best) {
        best = n.textContent.trim().length;
        textNode = n;
      }
    }
    if (!textNode) throw new Error('no text node for selection');
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, Math.min(24, textNode.textContent.length));
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  });
  await page.waitForSelector('.sa-pill', { state: 'visible', timeout: 5000 });
  ok('选区浮标出现');
  await page.click('.sa-pill');
  await page.waitForSelector('.sa-modal', { timeout: 5000 });
  ok('卡片弹层打开');

  const img = page.locator('.sa-preview-img');
  await img.waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForFunction(() => (document.querySelector('.sa-preview-img')?.src ?? '').startsWith('blob:'), undefined, { timeout: 30000 });
  ok('卡片 PNG 生成（blob URL）');

  const quote = await page.evaluate(() => document.querySelector('.sa-card-quote, .sa-card-quote-v')?.textContent ?? '');
  const style0 = await page.evaluate(() => document.querySelector('.sa-chip[aria-checked="true"]')?.textContent ?? '');
  const png1 = await page.evaluate(async () => {
    const src = document.querySelector('.sa-preview-img')?.src ?? '';
    const r = await fetch(src);
    return Array.from(new Uint8Array(await r.arrayBuffer()));
  });
  writeFileSync(`${OUT}/card-${style0 || 'style1'}.png`, Buffer.from(png1));
  ok(`风格「${style0}」卡片落盘 ${(png1.length / 1024).toFixed(0)}KB，引文头 12 字：${quote.slice(0, 12)}`);

  // 切第二风格再生成
  const chips = page.locator('.sa-chip');
  if (await chips.count() > 1) {
    const firstSrc = await img.getAttribute('src');
    await chips.nth(1).click();
    await page.waitForFunction(
      (prev) => (document.querySelector('.sa-preview-img')?.src ?? '') !== prev && (document.querySelector('.sa-preview-img')?.src ?? '').startsWith('blob:'),
      firstSrc,
      { timeout: 30000 },
    );
    const style1 = await page.evaluate(() => document.querySelector('.sa-chip[aria-checked="true"]')?.textContent ?? '');
    const png2 = await page.evaluate(async () => {
      const src = document.querySelector('.sa-preview-img')?.src ?? '';
      const r = await fetch(src);
      return Array.from(new Uint8Array(await r.arrayBuffer()));
    });
    writeFileSync(`${OUT}/card-${style1 || 'style2'}.png`, Buffer.from(png2));
    ok(`风格「${style1}」重生成落盘 ${(png2.length / 1024).toFixed(0)}KB`);
  }

  await page.screenshot({ path: `${OUT}/modal.png`, fullPage: false });
  const events = await page.evaluate(() => window.__shareEvents?.map((e) => e.action) ?? []);
  for (const want of ['selection-share', 'card-generate']) {
    events.includes(want) ? ok(`事件 ${want}`) : fail(`事件 ${want}`, `got: ${events.join(',')}`);
  }
  await context.close();
}

// ---------- 3. 微信 UA 分支：长按提示、无下载/分享按钮 ----------
{
  const { context, page } = await waitForCard(browser, {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49',
  });
  await page.click('button.sa-btn');
  await page.click('.sa-popover .sa-item:first-child');
  await page.waitForSelector('.sa-modal', { timeout: 5000 });
  const hintVisible = await page.locator('.sa-modal .sa-hint').isVisible().catch(() => false);
  hintVisible ? ok('微信 UA：长按保存提示可见') : fail('微信 UA：长按保存提示');
  const actionsCount = await page.locator('.sa-modal .sa-actions').count();
  actionsCount === 0 ? ok('微信 UA：无下载/系统分享按钮区') : fail('微信 UA：不应有按钮区', `count=${actionsCount}`);
  await page.screenshot({ path: `${OUT}/modal-wechat.png` });
  await context.close();
}

await browser.close();
console.log(failures.length ? `\nFAIL: ${failures.join(', ')}` : '\nALL PASS');
process.exit(failures.length ? 1 : 0);
