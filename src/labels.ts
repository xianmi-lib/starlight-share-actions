import type { Labels } from './types.js';

export const DEFAULT_LABELS: Record<'en' | 'zh-CN' | 'zh-TW', Labels> = {
  en: {
    share: 'Share',
    systemShare: 'More…',
    copyLink: 'Copy link',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    makeCard: 'Share as image',
    selectShare: 'Share selection',
    cardTitle: 'Share card',
    styleLabel: 'Style',
    saveHint: 'Long-press the image to save it',
    download: 'Download image',
    shareImage: 'Share image',
    close: 'Close',
    generateFailed: 'Failed to generate, please retry',
  },
  'zh-CN': {
    share: '分享',
    systemShare: '更多…',
    copyLink: '复制链接',
    copied: '已复制',
    copyFailed: '复制失败',
    makeCard: '生成分享卡片',
    selectShare: '分享选中',
    cardTitle: '分享卡片',
    styleLabel: '风格',
    saveHint: '长按图片保存到相册',
    download: '下载图片',
    shareImage: '分享图片',
    close: '关闭',
    generateFailed: '生成失败，请重试',
  },
  'zh-TW': {
    share: '分享',
    systemShare: '更多…',
    copyLink: '複製連結',
    copied: '已複製',
    copyFailed: '複製失敗',
    makeCard: '生成分享卡片',
    selectShare: '分享選中',
    cardTitle: '分享卡片',
    styleLabel: '風格',
    saveHint: '長按圖片保存到相冊',
    download: '下載圖片',
    shareImage: '分享圖片',
    close: '關閉',
    generateFailed: '生成失敗，請重試',
  },
};

function baseFor(lang: string): Labels {
  if (lang in DEFAULT_LABELS) return DEFAULT_LABELS[lang as keyof typeof DEFAULT_LABELS];
  if (lang.split('-')[0] === 'zh') return DEFAULT_LABELS['zh-CN'];
  return DEFAULT_LABELS.en;
}

/** 按语言解析词条：精确命中 → 语言基码（zh-TW→zh）→ en 缺省；用户覆盖按键过滤空串 */
export function resolveLabels(lang: string, overrides: Record<string, Partial<Labels>> | undefined): Labels {
  const base = baseFor(lang);
  const o = overrides?.[lang] ?? overrides?.[lang.split('-')[0]] ?? {};
  const merged = { ...base } as Record<string, string>;
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string' && v !== '') merged[k] = v;
  }
  return merged as unknown as Labels;
}
