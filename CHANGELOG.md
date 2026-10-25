# Changelog

## 0.1.1

- Fix: the selection pill now defaults to **below** the selection (flipping above only near the viewport bottom). Mobile browsers draw their native text-selection toolbar (copy/share) in the browser UI layer above all page content and attach it above the selection, so a pill placed there was always covered; below-placement coexists with it.

## 0.1.0

First release.

- **Share menu under the page title**: `navigator.share` (system share sheet) when available, built-in intent links for X / Facebook / LINE / WhatsApp / Telegram / Weibo (configurable), and copy-link with live feedback. The shared URL uses the page's `rel=canonical` link when present.
- **Share card generator** (WeChat Moments workflow): tap “Share as image” or select any passage and tap the floating pill — a 1080×1440 PNG card (quote + page title + site name + QR code) is rendered fully client-side via [snapdom](https://github.com/zumer/snapdom) + [uqr](https://github.com/zumer/uqr), no server involved. In the WeChat in-app browser the modal shows a long-press-to-save hint; elsewhere it offers download / Web Share (image file).
- Built-in card styles: Classic (horizontal, paper tone) and Vertical (CJK vertical text, ancient-book tone); fully configurable (colors / font stack / orientation / custom styles).
- Zero component overrides — the button row is injected client-side next to `.page-actions-bar` (coexists with `starlight-ai-actions`) or after `main h1`.
- Trilingual UI defaults (en / zh-CN / zh-TW) with per-language overrides.
- Emits `share-actions` CustomEvents for analytics and E2E assertions.
