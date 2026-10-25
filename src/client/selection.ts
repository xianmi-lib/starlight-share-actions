import type { ResolvedOptions } from '../types.js';
import { resolveLabels } from '../labels.js';
import { dispatchShareAction } from '../events.js';
import { el } from './util.js';
import { openCardModal } from './card.js';

const DEBOUNCE_MS = 200;

function selectionInsideMain(sel: Selection): boolean {
  const toEl = (n: Node | null): Element | null =>
    n ? (n.nodeType === Node.ELEMENT_NODE ? (n as Element) : n.parentElement) : null;
  const a = toEl(sel.anchorNode)?.closest('main');
  const b = toEl(sel.focusNode)?.closest('main');
  if (!a || !b) return false;
  // 选区起止都在 main 内，且不在本插件自己的 UI（弹层/浮标/对话框）里
  const inOwnUi = (n: Node | null): boolean => !!toEl(n)?.closest('.sa-bar,.sa-pill,.sa-modal,.sa-popover');
  return !inOwnUi(sel.anchorNode) && !inOwnUi(sel.focusNode);
}

/** 选中正文文本后浮现「分享选中」浮标，点击进入卡片流程（引文=选中文本） */
export function mountSelectionPill(options: ResolvedOptions, lang: string): void {
  if (options.card === false) return;
  const card = options.card;
  const labels = resolveLabels(lang, options.labels);
  let pill: HTMLButtonElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastText = '';

  const hide = () => {
    if (pill) pill.style.display = 'none';
  };

  const ensurePill = (): HTMLButtonElement => {
    if (pill) return pill;
    pill = el('button', 'sa-pill', labels.selectShare);
    pill.type = 'button';
    // mousedown preventDefault 保住选区（click 前选区不清空）
    pill.addEventListener('mousedown', (e) => e.preventDefault());
    pill.addEventListener('click', () => {
      dispatchShareAction('selection-share');
      const q = document.getSelection()?.toString() || lastText;
      hide();
      openCardModal(options, lang, q);
    });
    document.body.appendChild(pill);
    return pill;
  };

  const check = () => {
    const sel = document.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !selectionInsideMain(sel)) return hide();
    const text = sel.toString();
    if (text.trim().length < card.minQuoteLength) return hide();
    lastText = text;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return hide();
    const p = ensurePill();
    p.style.visibility = 'hidden';
    p.style.display = 'block';
    const pw = p.offsetWidth;
    const ph = p.offsetHeight;
    const left = Math.min(Math.max(rect.left + rect.width / 2 - pw / 2, 8), window.innerWidth - pw - 8);
    let top = rect.top - ph - 10;
    if (top < 8) top = rect.bottom + 10;
    p.style.left = `${Math.round(left)}px`;
    p.style.top = `${Math.round(top)}px`;
    p.style.visibility = 'visible';
  };

  document.addEventListener('selectionchange', () => {
    clearTimeout(timer);
    timer = setTimeout(check, DEBOUNCE_MS);
  });
  document.addEventListener('scroll', hide, { capture: true, passive: true });
  window.addEventListener('resize', hide);
}
