import options from 'virtual:starlight-share-actions/options';
import { resolveShowOnPath } from '../config.js';
import { injectStyles } from './styles.js';
import { mountShareButton } from './button.js';
import { mountSelectionPill } from './selection.js';

function boot(): void {
  // 客户端门槛：where.idPattern 对「pathname 剥 base 前缀」的页 id 匹配（与 ai-actions entry.id 同口径）
  const base = ((import.meta as any).env?.BASE_URL as string) || '/';
  if (!resolveShowOnPath(location.pathname, base, options.where?.idPattern)) return;
  const lang = document.documentElement.lang || 'en';
  injectStyles();
  mountShareButton(options, lang);
  if (options.card !== false) mountSelectionPill(options, lang);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
