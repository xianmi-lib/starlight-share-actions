/** 分享 URL 用 canonical（存在时），防变体 URL 扩散；无 canonical 回退 location.href */
export function getPageUrl(): string {
  const c = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  return c?.href || location.href;
}

export function getPageTitle(): string {
  const h1 = document.querySelector('main h1') as HTMLElement | null;
  return (h1?.textContent ?? document.title ?? '').replace(/\s+/g, ' ').trim();
}

/** 一键金句的缺省选文：正文中第一段够长的段落（先锚定内容容器——main 直下会先命中
 *  其他插件在标题区留下的空 <p>（如 ai-actions 的 sr-only 状态播报区）；短标题式
 *  首段（如「第八十講」）跳过，取不到则回退最长段） */
export function firstParagraphText(): string {
  const root =
    document.querySelector('main .sl-markdown-content') ??
    document.querySelector('main article') ??
    document.querySelector('main');
  const paras = [...(root?.querySelectorAll('p') ?? [])];
  const MIN = 12;
  const first = paras.map((p) => (p.textContent ?? '').replace(/\s+/g, ' ').trim()).find((t) => t.length >= MIN);
  if (first) return first;
  let longest = '';
  for (const p of paras) {
    const t = (p.textContent ?? '').trim();
    if (t.length > longest.length) longest = t;
  }
  return longest;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 旧 webview（含微信 XWeb 低版本）无 Clipboard API 的兜底
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** 微信内置浏览器：无 navigator.share，图片只能「弹层展示 + 长按保存」 */
export function isWeChat(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string | null,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** 屏幕阅读器播报区（Starlight 自带 .sr-only，这里带兜底样式） */
export function makeLiveRegion(): HTMLElement {
  const node = el('span', 'sa-sr');
  node.setAttribute('aria-live', 'polite');
  node.setAttribute('aria-atomic', 'true');
  return node;
}
