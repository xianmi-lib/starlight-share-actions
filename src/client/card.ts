import type { ResolvedCardOptions, ResolvedCardStyle, ResolvedOptions } from '../types.js';
import { normalizeQuote, resolveName } from '../config.js';
import { resolveLabels } from '../labels.js';
import { dispatchShareAction } from '../events.js';
import { el, firstParagraphText, getPageTitle, getPageUrl, isWeChat } from './util.js';

const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`;
const QR_BOX = 168; // 二维码白底板盒宽（px）
const QR_INNER = 144;

interface CardContext {
  style: ResolvedCardStyle;
  quote: string;
  title: string;
  url: string;
}

/** 构建卡片 DOM（自然尺寸挂预览缩放器内，截图从它取证） */
function buildCard(card: ResolvedCardOptions, ctx: CardContext): HTMLElement {
  const s = ctx.style;
  const root = el('div', 'sa-card');
  root.style.width = `${card.width}px`;
  root.style.height = `${card.height}px`;
  root.style.background = s.bg;
  root.style.color = s.fg;
  root.style.fontFamily = s.font;
  root.style.padding = `${Math.round(card.width * 0.078)}px ${Math.round(card.width * 0.07)}px`;

  const quoteWrap = el('div');
  quoteWrap.style.cssText = 'flex:1;overflow:hidden;display:flex';
  if (s.orientation === 'vertical') {
    // 古籍竖排：列自右向左，文字块锚在可用区右缘
    quoteWrap.style.justifyContent = 'flex-end';
    const q = el('div', 'sa-card-quote-v', ctx.quote);
    q.style.height = '100%';
    q.style.fontSize = `${Math.round(card.width * 0.044)}px`;
    q.style.lineHeight = '2';
    q.style.letterSpacing = '0.06em';
    quoteWrap.appendChild(q);
  } else {
    const q = el('div', 'sa-card-quote', ctx.quote);
    q.style.fontSize = `${Math.round(card.width * 0.048)}px`;
    q.style.lineHeight = '1.75';
    q.style.letterSpacing = '0.02em';
    quoteWrap.appendChild(q);
  }
  root.appendChild(quoteWrap);

  const foot = el('div', 'sa-card-foot');
  foot.style.borderTop = `3px solid ${s.accent}`;
  foot.style.paddingTop = `${Math.round(card.width * 0.033)}px`;
  foot.style.marginTop = `${Math.round(card.width * 0.03)}px`;
  const meta = el('div');
  meta.style.minWidth = '0';
  const site = el('div', null, card.siteName);
  site.style.fontSize = `${Math.round(card.width * 0.041)}px`;
  site.style.fontWeight = '700';
  site.style.color = s.accent;
  site.style.letterSpacing = '0.08em';
  site.style.marginBottom = `${Math.round(card.width * 0.014)}px`;
  const title = el('div', null, ctx.title);
  title.style.fontSize = `${Math.round(card.width * 0.028)}px`;
  title.style.lineHeight = '1.5';
  title.style.color = s.muted;
  title.style.maxHeight = `${Math.round(card.width * 0.084)}px`;
  title.style.overflow = 'hidden';
  meta.append(site, title);
  const qrBox = el('div', 'sa-card-qr');
  qrBox.style.width = `${QR_BOX}px`;
  qrBox.style.height = `${QR_BOX}px`;
  qrBox.style.padding = `${Math.round((QR_BOX - QR_INNER) / 2)}px`;
  foot.append(meta, qrBox);
  root.appendChild(foot);
  return root;
}

async function fillQr(qrBox: HTMLElement, url: string): Promise<void> {
  const { renderSVG } = await import('uqr');
  // 二维码恒用深模块/白底板（深色卡片上反色码扫码率差），白板自带四向静区
  qrBox.innerHTML = renderSVG(url, { pixelSize: 4, blackColor: '#1a1a1a', whiteColor: '#ffffff' });
  const svg = qrBox.querySelector('svg');
  if (svg) {
    svg.setAttribute('width', String(QR_INNER));
    svg.setAttribute('height', String(QR_INNER));
  }
}

let activeCleanup: (() => void) | null = null;

export function openCardModal(options: ResolvedOptions, lang: string, selection?: string): void {
  if (options.card === false) return;
  const card: ResolvedCardOptions = options.card;
  const labels = resolveLabels(lang, options.labels);
  activeCleanup?.();
  activeCleanup = null;

  const ctxBase = {
    quote: normalizeQuote(selection?.trim() || firstParagraphText(), card.maxQuoteLength),
    title: getPageTitle(),
    url: getPageUrl(),
  };
  let style = card.styles.find((s) => s.id === card.defaultStyleId) ?? card.styles[0];

  // ---- 弹层骨架：<dialog> 优先，不支持时回退 fixed overlay + 手动遮罩 ----
  const useDialog = typeof HTMLDialogElement !== 'undefined';
  const overlay: HTMLElement = useDialog ? el('dialog', 'sa-modal') : el('div', 'sa-modal');
  let dim: HTMLElement | null = null;
  if (!useDialog) {
    overlay.style.cssText = 'position:fixed;inset:0;margin:auto;height:fit-content;z-index:80';
    dim = el('div');
    dim.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:79';
    document.body.appendChild(dim);
  }

  const head = el('div', 'sa-modal-head');
  head.appendChild(el('h2', null, labels.cardTitle));
  const closeBtn = el('button', 'sa-close');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', labels.close);
  closeBtn.innerHTML = ICON_CLOSE;
  head.appendChild(closeBtn);
  overlay.appendChild(head);

  const chipsWrap = el('div', 'sa-chips');
  chipsWrap.setAttribute('role', 'radiogroup');
  chipsWrap.setAttribute('aria-label', labels.styleLabel);
  chipsWrap.appendChild(el('span', 'sa-chips-label', labels.styleLabel));
  const chips: HTMLButtonElement[] = [];
  for (const s of card.styles) {
    const chip = el('button', 'sa-chip', resolveName(s.name, lang));
    chip.type = 'button';
    chip.setAttribute('role', 'radio');
    chip.setAttribute('aria-checked', String(s.id === style.id));
    chip.addEventListener('click', () => {
      if (s.id === style.id) return;
      style = s;
      for (const [i, c] of chips.entries()) c.setAttribute('aria-checked', String(card.styles[i].id === s.id));
      rebuild();
    });
    chips.push(chip);
    chipsWrap.appendChild(chip);
  }
  overlay.appendChild(chipsWrap);

  const preview = el('div', 'sa-preview');
  const previewLive = el('div', 'sa-preview-live');
  const scaler = el('div');
  previewLive.appendChild(scaler);
  const previewImg = el('img', 'sa-preview-img');
  previewImg.alt = labels.cardTitle;
  previewImg.style.display = 'none';
  preview.append(previewLive, previewImg);
  overlay.appendChild(preview);

  const foot = el('div', 'sa-foot');
  const hint = el('p', 'sa-hint', isWeChat() ? labels.saveHint : '');
  const actions = el('div', 'sa-actions');
  const downloadBtn = el('a', 'sa-action-btn', labels.download);
  downloadBtn.style.display = 'none';
  const shareBtn = el('button', 'sa-action-btn', labels.shareImage);
  shareBtn.type = 'button';
  shareBtn.style.display = 'none';
  actions.append(downloadBtn, shareBtn);
  if (isWeChat()) foot.appendChild(hint);
  else foot.appendChild(actions);
  overlay.appendChild(foot);

  document.body.appendChild(overlay);
  if (useDialog) (overlay as HTMLDialogElement).showModal();

  // ---- 生成与重建 ----
  let objectUrl: string | null = null;
  let blob: Blob | null = null;
  let generating: Promise<void> | null = null;

  async function generate(): Promise<void> {
    const ctx: CardContext = { style, ...ctxBase };
    const cardEl = buildCard(card, ctx);
    scaler.replaceChildren(cardEl);
    // 预览缩放：卡片自身保持自然尺寸（transform 在外层缩放器上，不影响截图输出）
    const previewW = preview.clientWidth || 256;
    const f = previewW / card.width;
    scaler.style.transform = `scale(${f})`;
    scaler.style.transformOrigin = 'top left';
    previewLive.style.width = `${previewW}px`;
    previewLive.style.height = `${Math.round(card.height * f)}px`;
    await fillQr(cardEl.querySelector('.sa-card-qr') as HTMLElement, ctx.url);

    const { snapdom } = await import('@zumer/snapdom');
    // dpr:1 锁输出为 CSS 像素（1080 宽档），避开高 dpr 设备的 canvas 钳制与内存峰值
    const result = await snapdom(cardEl, { dpr: 1, backgroundColor: ctx.style.bg });
    const b = await result.toBlob({ format: 'png' });
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    blob = b;
    objectUrl = URL.createObjectURL(b);
    previewImg.src = objectUrl;
    previewImg.style.display = 'block';
    overlay.classList.remove('sa-generating');

    downloadBtn.href = objectUrl;
    downloadBtn.setAttribute('download', `share-card-${ctx.style.id}.png`);
    downloadBtn.style.display = '';
    const file = new File([b], 'share-card.png', { type: 'image/png' });
    const canShare = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
    shareBtn.style.display = canShare ? '' : 'none';
  }

  function rebuild(): void {
    overlay.classList.add('sa-generating');
    const run = generating ? generating.then(() => generate()) : generate();
    generating = run
      .catch(() => {
        hint.textContent = labels.generateFailed;
        if (hint.parentElement !== foot) foot.insertBefore(hint, foot.firstChild);
      })
      .finally(() => {
        generating = null;
      });
  }
  rebuild();
  dispatchShareAction('card-generate', { style: style.id });

  shareBtn.addEventListener('click', async () => {
    if (!blob) return;
    dispatchShareAction('card-share-image');
    const file = new File([blob], 'share-card.png', { type: 'image/png' });
    try {
      await navigator.share({ files: [file], title: ctxBase.title });
    } catch {
      /* 用户取消 */
    }
  });
  downloadBtn.addEventListener('click', () => dispatchShareAction('card-download', { style: style.id }));

  function close(): void {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    activeCleanup = null;
    dim?.remove();
    overlay.remove();
  }
  closeBtn.addEventListener('click', close);
  if (useDialog) overlay.addEventListener('close', close);
  else dim?.addEventListener('click', close);
  activeCleanup = close;
}
