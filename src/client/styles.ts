/** 全部类名 sa- 前缀；色板用 Starlight CSS 变量 + 兜底，深浅色模式自适应 */
const CSS = `
/* 按钮与行：逐值对齐 starlight-ai-actions 的 .pa-btn/.page-actions-bar ghost 家族
   （透明底、无边框、灰字 hover accent、text-sm、图标 1rem、窄屏藏文字）；
   ai-actions 在场时按钮直接并入其按钮行，仅样式兜底时才用 .sa-bar 自建行 */
.sa-bar{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:0.25rem 0.75rem;margin:0.75rem 0 0;print:hidden}
.sa-btn{display:inline-flex;align-items:center;gap:0.375rem;padding:0.25rem 0.5rem;border:0;border-radius:0.375rem;background:none;color:var(--sl-color-gray-2,#5c6470);font-family:inherit;font-size:var(--sl-text-sm,0.875rem);line-height:inherit;text-decoration:none;white-space:nowrap;cursor:pointer;position:relative}
.sa-btn:is(:hover,:focus-visible){color:var(--sl-color-accent-high,#3e63dd)}
.sa-btn svg{width:1rem;height:1rem;flex:none}
/* 弹层定位锚：加在按钮父容器上（pa 按钮行或 .sa-bar），relative 无位移不改布局 */
.sa-anchor{position:relative}
@media (max-width:40rem){
  .sa-label{display:none}
  .sa-btn{padding:0.375rem}
  .sa-btn svg{width:1.125rem;height:1.125rem}
}
.sa-popover{position:absolute;top:calc(100% + 0.5rem);right:0;min-width:15rem;max-width:min(92vw,22rem);background:var(--sl-color-white,#fff);color:var(--sl-color-black,#111);border:1px solid var(--sl-color-gray-4,#cad4de);border-radius:0.75rem;box-shadow:0 12px 32px rgba(0,0,0,.18);padding:0.4rem;z-index:60}
.sa-item{display:flex;align-items:center;gap:.75rem;width:100%;padding:.8rem 1rem;min-height:3rem;border:none;border-radius:.5rem;background:transparent;color:inherit;font-size:1em;text-align:left;text-decoration:none;cursor:pointer}
.sa-item:hover{background:rgba(127,127,127,.12)}
.sa-item[data-state="ok"]{color:#1a7f37}
.sa-item[data-state="fail"]{color:#b42318}
.sa-item svg{width:1.25em;height:1.25em;flex:none;opacity:.85}
@media (max-width:50rem){
  .sa-popover{position:fixed;top:auto;left:1rem;right:1rem;bottom:1rem;min-width:0}
}
.sa-pill{position:fixed;z-index:70;border:none;border-radius:999px;padding:.55rem 1.1rem;background:#334155;color:#fff;font-size:.95rem;box-shadow:0 6px 20px rgba(0,0,0,.3);cursor:pointer}
.sa-modal{border:none;border-radius:1rem;padding:0;max-width:min(94vw,30rem);width:100%;background:var(--sl-color-white,#fff);color:var(--sl-color-black,#111)}
.sa-modal::backdrop{background:rgba(0,0,0,.55)}
.sa-modal-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.25rem;border-bottom:1px solid var(--sl-color-gray-4,#cad4de)}
.sa-modal-head h2{margin:0;font-size:1.15rem;font-weight:700}
.sa-close{display:inline-flex;align-items:center;justify-content:center;width:2.6rem;height:2.6rem;border:none;border-radius:.5rem;background:transparent;color:inherit;font-size:1.2rem;cursor:pointer}
.sa-close:hover{background:rgba(127,127,127,.12)}
.sa-chips{display:flex;flex-wrap:wrap;gap:.5rem;padding:.85rem 1.25rem 0}
.sa-chips-label{align-self:center;font-size:.85em;opacity:.7;margin-right:.25rem}
.sa-chip{padding:.5rem 1rem;min-height:2.6rem;border:1.5px solid var(--sl-color-gray-4,#cad4de);border-radius:999px;background:transparent;color:inherit;font-size:.95em;cursor:pointer}
.sa-chip[aria-checked="true"]{border-color:currentColor;font-weight:700}
.sa-preview{display:flex;justify-content:center;margin:1rem auto .5rem;width:min(72vw,16rem)}
.sa-preview-live{overflow:hidden}
.sa-preview-img{display:block;width:100%;height:auto;border-radius:.5rem;border:1px solid rgba(127,127,127,.25)}
.sa-generating .sa-preview-img{opacity:.4}
.sa-foot{display:flex;flex-direction:column;gap:.6rem;padding:1rem 1.25rem 1.25rem;border-top:1px solid var(--sl-color-gray-4,#cad4de);margin-top:.75rem}
.sa-hint{margin:0;font-size:.9em;opacity:.75;text-align:center}
.sa-actions{display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap}
.sa-action-btn{flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.85rem 1.2rem;min-height:3rem;border:none;border-radius:.6rem;background:var(--sl-color-black,#111);color:var(--sl-color-white,#fff);font-size:1em;text-decoration:none;cursor:pointer}
.sa-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.sa-card{display:flex;flex-direction:column;box-sizing:border-box}
.sa-card-quote{overflow:hidden}
.sa-card-quote-v{writing-mode:vertical-rl;overflow:hidden}
.sa-card-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:2rem}
.sa-card-qr{display:flex;align-items:center;justify-content:center;background:#fff;border-radius:12px;flex:none}
.sa-card-qr svg{display:block;width:100%;height:auto}
`;

export function injectStyles(): void {
  if (document.getElementById('sa-share-actions-style')) return;
  const style = document.createElement('style');
  style.id = 'sa-share-actions-style';
  style.textContent = CSS;
  document.head.appendChild(style);
}
