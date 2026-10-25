import type {
  CardOptions,
  CardStyle,
  NameMap,
  PlatformDef,
  PlatformId,
  ResolvedCardOptions,
  ResolvedCardStyle,
  ResolvedOptions,
  ResolvedPlatform,
  StarlightShareActionsOptions,
} from './types.js';

/** 内置平台意图链接模板（{url}/{title} 会被 encodeURIComponent 后替换） */
export const BUILTIN_PLATFORMS: Record<PlatformId, { name: NameMap; href: string }> = {
  x: { name: 'X', href: 'https://twitter.com/intent/tweet?url={url}&text={title}' },
  facebook: { name: 'Facebook', href: 'https://www.facebook.com/sharer/sharer.php?u={url}' },
  line: { name: 'LINE', href: 'https://social-plugins.line.me/lineit/share?url={url}' },
  whatsapp: { name: 'WhatsApp', href: 'https://wa.me/?text={title}%20{url}' },
  telegram: { name: 'Telegram', href: 'https://t.me/share/url?url={url}&text={title}' },
  weibo: {
    name: { en: 'Weibo', 'zh-CN': '微博', 'zh-TW': '微博' },
    href: 'https://service.weibo.com/share/share.php?url={url}&title={title}',
  },
};

export const DEFAULT_PLATFORMS: (PlatformId | PlatformDef)[] = ['x', 'facebook', 'line'];

/**
 * 卡片字体缺省：系统 CJK 衬线栈。刻意不用 webfont——卡片经 foreignObject 截图时
 * 外链字体不加载（SVG-as-image 语境禁外链资源），系统字体零成本且各端可得。
 */
export const DEFAULT_CARD_FONT =
  '"Songti SC","STSong","Noto Serif CJK SC","Noto Serif CJK TC","Noto Serif SC","Noto Serif TC","SimSun","Microsoft JhengHei",serif';

export const DEFAULT_CARD_STYLES: CardStyle[] = [
  {
    id: 'paper',
    name: { en: 'Classic', 'zh-CN': '素雅', 'zh-TW': '素雅' },
    orientation: 'horizontal',
    bg: '#f7f3ea',
    fg: '#3d3529',
    accent: '#8a6d3b',
    muted: '#8b8272',
  },
  {
    id: 'sutra',
    name: { en: 'Vertical', 'zh-CN': '古籍竖排', 'zh-TW': '古籍豎排' },
    orientation: 'vertical',
    bg: '#2e2a24',
    fg: '#e8dfc8',
    accent: '#c9a86a',
    muted: '#a89b82',
  },
];

export const DEFAULT_CARD_SIZE = { width: 1080, height: 1440 } as const;
export const DEFAULT_QUOTE_LIMITS = { max: 160, min: 6 } as const;

export function resolveName(name: NameMap, lang: string): string {
  if (typeof name === 'string') return name;
  return name[lang] ?? name[lang.split('-')[0]] ?? name.en ?? Object.values(name)[0] ?? '';
}

export function buildShareHref(template: string, ctx: { url: string; title: string }): string {
  return template
    .replaceAll('{url}', encodeURIComponent(ctx.url))
    .replaceAll('{title}', encodeURIComponent(ctx.title));
}

/**
 * 选文规整：全角缩进（U+3000）与首尾空白剥掉、连续空白折叠为单个空格，
 * 超长按 Unicode 码点截断（CJK 代理对安全）加省略号。
 */
export function normalizeQuote(raw: string, maxLength: number): string {
  const collapsed = raw.replace(/[\s\u3000]+/g, ' ').trim();
  const chars = Array.from(collapsed);
  if (chars.length <= maxLength) return collapsed;
  return chars.slice(0, maxLength).join('').trimEnd() + '…';
}

/** location.pathname → Starlight 页 id（剥 base 前缀与首尾斜杠）：/zh-tw/p01/a/…/ 与 /p01/a/…/ 同得 p01/a/… */
export function pageIdFromPath(pathname: string, base: string): string {
  let p = pathname;
  const b = (base || '/').replace(/\/+$/, '');
  if (b && p.startsWith(b + '/')) p = p.slice(b.length);
  p = p.replace(/^\/+|\/+$/g, '');
  return p;
}

/** 客户端门槛判定：where.idPattern 对 pageId 匹配（与 ai-actions 的 entry.id 同口径） */
export function resolveShowOnPath(pathname: string, base: string, idPattern?: string): boolean {
  if (!idPattern) return true;
  const id = pageIdFromPath(pathname, base);
  return new RegExp(idPattern).test(id);
}

function resolvePlatforms(input: (PlatformId | PlatformDef)[] | undefined): ResolvedPlatform[] {
  const list = input ?? DEFAULT_PLATFORMS;
  return list.map((item) => {
    if (typeof item === 'string') {
      const builtin = BUILTIN_PLATFORMS[item];
      if (!builtin) {
        throw new Error(
          `[starlight-share-actions] Unknown platform id: '${item}'. Built-ins: ${Object.keys(BUILTIN_PLATFORMS).join(', ')}. Use a { id, name, href } object for custom platforms.`,
        );
      }
      return { id: item, name: builtin.name, href: builtin.href };
    }
    if (!item.id || !item.name || !item.href) {
      throw new Error('[starlight-share-actions] Custom platform requires `id`, `name` and `href`.');
    }
    return { id: item.id, name: item.name, href: item.href };
  });
}

function resolveCard(card: CardOptions | false | undefined): ResolvedCardOptions | false {
  if (card === false) return false;
  if (card === undefined) {
    // 卡片缺省开启需要 siteName，通用插件不许无名牌面：未配置时视为关闭
    return false;
  }
  const siteName = card.siteName?.trim();
  if (!siteName) {
    throw new Error(
      '[starlight-share-actions] `card.siteName` is required when `card` is enabled (it is printed on the share card).',
    );
  }
  const styles: ResolvedCardStyle[] = (card.styles ?? DEFAULT_CARD_STYLES).map((s) => ({
    id: s.id,
    name: s.name,
    orientation: s.orientation ?? 'horizontal',
    bg: s.bg ?? '#f7f3ea',
    fg: s.fg ?? '#3d3529',
    accent: s.accent ?? '#8a6d3b',
    muted: s.muted ?? '#8b8272',
    font: s.font ?? DEFAULT_CARD_FONT,
  }));
  if (styles.length === 0) {
    throw new Error('[starlight-share-actions] `card.styles` must not be empty.');
  }
  const ids = styles.map((s) => s.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`[starlight-share-actions] Duplicate \`card.styles\` id: ${ids.join(', ')}.`);
  }
  const defaultStyleId = card.defaultStyleId ?? styles[0].id;
  if (!ids.includes(defaultStyleId)) {
    throw new Error(
      `[starlight-share-actions] \`card.defaultStyleId\` '${defaultStyleId}' matches no style id (${ids.join(', ')}).`,
    );
  }
  return {
    siteName,
    styles,
    defaultStyleId,
    maxQuoteLength: card.maxQuoteLength ?? DEFAULT_QUOTE_LIMITS.max,
    minQuoteLength: card.minQuoteLength ?? DEFAULT_QUOTE_LIMITS.min,
    width: card.width ?? DEFAULT_CARD_SIZE.width,
    height: card.height ?? DEFAULT_CARD_SIZE.height,
  };
}

export function validateOptions(raw: unknown): ResolvedOptions {
  const o = (raw ?? {}) as StarlightShareActionsOptions;
  const link =
    o.link === false
      ? false
      : { platforms: resolvePlatforms(o.link?.platforms) };
  const card = resolveCard(o.card);
  const where = o.where ?? {};
  if (where.idPattern) {
    try {
      new RegExp(where.idPattern);
    } catch {
      throw new Error(
        `[starlight-share-actions] Invalid \`where.idPattern\` (not a valid RegExp): ${where.idPattern}`,
      );
    }
  }
  if (link === false && card === false) {
    throw new Error(
      '[starlight-share-actions] Nothing to do: both `link` and `card` are disabled. Enable at least one.',
    );
  }
  return { link, card, where, labels: o.labels ?? {} };
}
