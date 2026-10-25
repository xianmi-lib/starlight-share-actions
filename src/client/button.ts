import type { ResolvedOptions } from '../types.js';
import { buildShareHref, resolveName } from '../config.js';
import { resolveLabels } from '../labels.js';
import { dispatchShareAction } from '../events.js';
import { copyText, el, getPageTitle, getPageUrl, makeLiveRegion } from './util.js';
import { openCardModal } from './card.js';

const ICON_SHARE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/></svg>`;
const ICON_CARD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>`;
const ICON_LINK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 15l6-6"/><path d="M11 6l1-1a4 4 0 1 1 6 6l-1 1"/><path d="M13 18l-1 1a4 4 0 1 1-6-6l1-1"/></svg>`;
const ICON_MORE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>`;

/**
 * 锚点解析：优先并进 ai-actions 按钮行（.page-actions-bar）之后；
 * 无则落在 main h1 之后。都不在（如自定义首页）则静默不装。
 */
function findAnchor(): Element | null {
  return document.querySelector('.page-actions-bar') ?? document.querySelector('main h1');
}

export function mountShareButton(options: ResolvedOptions, lang: string): void {
  const anchor = findAnchor();
  if (!anchor) return;
  const labels = resolveLabels(lang, options.labels);

  const bar = el('div', 'sa-bar');
  const btn = el('button', 'sa-btn', labels.share);
  btn.type = 'button';
  btn.setAttribute('aria-haspopup', 'true');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = ICON_SHARE + `<span>${labels.share}</span>`;
  bar.appendChild(btn);
  const live = makeLiveRegion();
  bar.appendChild(live);

  let popover: HTMLElement | null = null;
  const close = () => {
    popover?.remove();
    popover = null;
    btn.setAttribute('aria-expanded', 'false');
  };
  const onDocDown = (e: Event) => {
    if (popover && !popover.contains(e.target as Node) && e.target !== btn) close();
  };

  btn.addEventListener('click', () => {
    if (popover) return close();
    close();
    popover = buildPopover(options, lang, labels, close, live);
    bar.appendChild(popover);
    btn.setAttribute('aria-expanded', 'true');
    const first = popover.querySelector<HTMLElement>('a.sa-item, button.sa-item');
    first?.focus();
  });
  document.addEventListener('mousedown', onDocDown);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popover) {
      close();
      btn.focus();
    }
  });

  anchor.insertAdjacentElement('afterend', bar);
}

function buildPopover(
  options: ResolvedOptions,
  lang: string,
  labels: ReturnType<typeof resolveLabels>,
  close: () => void,
  live: HTMLElement,
): HTMLElement {
  const pop = el('div', 'sa-popover');
  pop.setAttribute('role', 'menu');
  const url = getPageUrl();
  const title = getPageTitle();

  if (options.card !== false) {
    const item = el('button', 'sa-item', labels.makeCard);
    item.type = 'button';
    item.setAttribute('role', 'menuitem');
    item.innerHTML = ICON_CARD + `<span>${labels.makeCard}</span>`;
    item.addEventListener('click', () => {
      dispatchShareAction('card-open');
      close();
      openCardModal(options, lang);
    });
    pop.appendChild(item);
  }

  const copyItem = el('button', 'sa-item', labels.copyLink);
  copyItem.type = 'button';
  copyItem.setAttribute('role', 'menuitem');
  copyItem.innerHTML = ICON_LINK + `<span>${labels.copyLink}</span>`;
  copyItem.addEventListener('click', async () => {
    const ok = await copyText(url);
    dispatchShareAction('copy', { ok });
    live.textContent = ok ? labels.copied : labels.copyFailed;
    copyItem.dataset.state = ok ? 'ok' : 'fail';
    copyItem.querySelector('span')!.textContent = ok ? labels.copied : labels.copyFailed;
    setTimeout(() => {
      delete copyItem.dataset.state;
      copyItem.querySelector('span')!.textContent = labels.copyLink;
    }, 2000);
  });
  pop.appendChild(copyItem);

  if (options.link !== false) {
    for (const p of options.link.platforms) {
      const a = el('a', 'sa-item', resolveName(p.name, lang));
      a.href = buildShareHref(p.href, { url, title });
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('role', 'menuitem');
      a.innerHTML = `<span>${resolveName(p.name, lang)}</span>`;
      a.addEventListener('click', () => dispatchShareAction('platform', { id: p.id }));
      pop.appendChild(a);
    }
  }

  if (typeof navigator.share === 'function') {
    const item = el('button', 'sa-item', labels.systemShare);
    item.type = 'button';
    item.setAttribute('role', 'menuitem');
    item.innerHTML = ICON_MORE + `<span>${labels.systemShare}</span>`;
    item.addEventListener('click', () => {
      dispatchShareAction('system-share');
      navigator.share({ title, url, text: title }).catch(() => {});
    });
    pop.appendChild(item);
  }

  return pop;
}
