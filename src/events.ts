export interface ShareActionDetail {
  action: string;
  [key: string]: unknown;
}

/** 每次分享动作派发 `share-actions` CustomEvent（document），供埋点/E2E 断言 */
export function dispatchShareAction(action: string, detail: Omit<ShareActionDetail, 'action'> = {}) {
  document.dispatchEvent(new CustomEvent('share-actions', { detail: { action, ...detail } }));
}
