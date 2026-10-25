# starlight-share-actions

Open-source [Starlight](https://starlight.astro.build) plugin: a **share menu** under the page title and a **selection-to-image share card generator**, built for the WeChat Moments workflow (where link previews are unreliable and images with QR codes are the robust medium).

Born from the [显密文库](https://www.xianmi.co/) project — an aging-friendly Buddhist text library where readers share sutra passages to WeChat Moments — but this repository is a standalone, generic plugin: no site-specific content or configuration lives here.

## Why

- **Link share**: one button → native share sheet (`navigator.share`) when available; X / Facebook / LINE / WhatsApp / Telegram / Weibo intent links and copy-link as fallback items. The shared URL uses the page's `rel=canonical` link when present.
- **Share card**: readers select a meaningful passage (or just tap the button) and get a ready-to-post PNG — quote, page title, site name and a QR code back to the page. Rendered 100% client-side (no server, works on static hosting), tuned for the platforms where link cards degrade to bare URLs.
- **Zero component overrides**: the UI is injected by a client script next to `.page-actions-bar` (it coexists with `starlight-ai-actions`) or after `main h1`, so it never fights other plugins for Starlight component overrides.
- **WeChat-aware**: inside the WeChat in-app browser (no `navigator.share`) the card modal presents the generated image with a long-press-to-save hint; elsewhere it offers download / Web Share with the image file.
- **Mobile-friendly selection**: the selection pill is placed *below* the selection — mobile browsers draw their native copy/share toolbar in the browser UI layer (always above page content, attached above the selection), so the pill avoids that spot and coexists with it.
- **CJK vertical text**: the built-in “Vertical” style uses `writing-mode: vertical-rl` — ancient-book typography that foreignObject-based capture engines (snapdom) render natively.
- **Lazy**: snapdom + uqr are dynamically imported on first card generation; the per-page cost is a few KB.

## Quick Start

```bash
npm install starlight-share-actions
```

```js
// astro.config.mjs
import starlightShareActions from 'starlight-share-actions';

export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightShareActions({
          // show only on content pages (client-side path matching, same spirit as other plugins)
          where: { idPattern: '^docs/' },
          link: { platforms: ['x', 'facebook', 'line'] },
          card: {
            siteName: 'My Docs',
            // optional: custom styles (colors, font stack, orientation, size…)
            // styles: [{ id: 'night', name: 'Night', bg: '#111', fg: '#eee', accent: '#7aa', orientation: 'vertical' }],
          },
        }),
      ],
    }),
  ],
});
```

## Configuration

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `link` | `{ platforms } \| false` | built-ins | `false` disables the share menu. `platforms` accepts built-in ids (`'x' \| 'facebook' \| 'line' \| 'whatsapp' \| 'telegram' \| 'weibo'`) and/or `{ id, name, href }` objects; `href` templates may use `{url}` / `{title}`. |
| `card` | options \| false | off unless configured | Requires `siteName` (printed on the card). Optional: `styles`, `defaultStyleId`, `maxQuoteLength` (160), `minQuoteLength` (6), `width` (1080), `height` (1440). |
| `where` | `{ idPattern? }` | show everywhere | RegExp tested against the page id (path minus base prefix), e.g. `'^p\\d\\d/'`. |
| `labels` | `Record<lang, Partial<Labels>>` | en/zh-CN/zh-TW | Per-language UI strings; language is read from `<html lang>`. |

### Card styles

A style is `{ id, name, orientation?, bg?, fg?, accent?, muted?, font? }`. Defaults:

- `paper` — Classic: horizontal, warm paper tone.
- `sutra` — Vertical: CJK vertical text (right-to-left columns), dark tone.

Card fonts default to a **system CJK serif stack** — deliberately no webfonts: the capture pipeline serializes the card through an SVG image context where external font URLs cannot load.

## Events

Every action dispatches a `share-actions` CustomEvent on `document` with `detail.action` ∈ `card-open | card-generate | card-download | card-share-image | selection-share | copy | platform | system-share` — handy for analytics and E2E assertions.

## License

MIT.
