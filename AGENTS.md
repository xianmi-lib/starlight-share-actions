# AGENTS.md — starlight-share-actions

开源 Starlight 插件（标题下分享菜单 + 选中生成分享卡片），面向社区。源于显密文库项目（www.xianmi.co），但本仓库是**独立通用项目**，代码与文档不引用本站私货——零私有内容红线同 org 内其他 public 仓。

## 仓库结构

- `src/`：插件本体。`index.ts`（Starlight 插件：零组件覆盖——客户端脚本经 `astro:config:setup` 的 `injectScript('page')` 注入，配置经 Vite 虚拟模块过桥，机制照抄 starlight-ai-actions）、`config.ts`（平台/风格归一、模板渲染、引文规整、客户端路径门槛）、`types.ts`、`labels.ts`（en/zh-CN/zh-TW 三语缺省）、`events.ts`（`share-actions` CustomEvent）、`libs/vite.ts`（虚拟模块桥）、`client/`（`main` 引导 + `button` 分享菜单 + `selection` 选区浮标 + `card` 卡片生成器 + `styles`/`util`）。
- `test/`：vitest 单测（配置归一、模板/引文/路径纯函数、插件钩子与虚拟模块、三语词条）。
- 运行时依赖：`@zumer/snapdom`（DOM 截图，**动态 import 懒加载**）、`uqr`（二维码渲染）。

## 关键设计决定（改动前先读）

- **零组件覆盖**：不 override 任何 Starlight 组件，锚点在客户端解析（优先 `.page-actions-bar` 之后 = 与 starlight-ai-actions 同行区，无则 `main h1` 之后）。这是与 ai-actions 的差异化卖点，勿改回组件覆盖路线。
- **卡片字体必须走系统字体栈**：截图管线把卡片序列化为 SVG image 语境，外链字体 URL 不加载；卡片风格禁用站内 webfont。
- **QR 恒为深模块/白底板**：深色卡片风格下反色码扫码率差，白板统一兜底。
- **snapdom `dpr: 1`**：锁输出为 CSS 像素（1080 宽档），避开高 dpr 设备 canvas 钳制。
- **微信形态**：MicroMessenger UA 下卡片弹层只出「长按保存」提示（无 navigator.share / 无 download 行为保证），站外才出下载/系统分享图片按钮。

## 测试与发布

- `npm test`（vitest 24 例）+ `npm run typecheck`，改 `src/` 必跑。
- 本机 npm 走 registry 需 `NODE_OPTIONS=--use-system-ca`（自签证书注入，同 org 其他仓记录）。
- 首发形态 = GitHub public（`xianmi-lib/starlight-share-actions`）；npm 发布待办（token 需用户在 npm 站开新包权限，同 starlight-ai-actions 首发坑）。
- 版本史=仓根 `CHANGELOG.md`，发布坑与流程记本节，不在两处复写。
