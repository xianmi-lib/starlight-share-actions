import { validateOptions } from './config.js';
import type { StarlightShareActionsOptions } from './types.js';
import { vitePluginShareActions } from './libs/vite.js';

/**
 * 零组件覆盖的注入路线：客户端脚本经 astro:config:setup 的 injectScript('page') 进
 * 每页 bundle，配置经 Vite 虚拟模块过桥（机制照抄 starlight-ai-actions）。
 * 按钮锚点在客户端解析（优先并进 .page-actions-bar 行，无则落在 h1 之后），
 * 因此与任何覆盖 PageTitle 的插件/主题共存且不抢组件覆盖权。
 */
export default function starlightShareActions(userOptions: StarlightShareActionsOptions = {}) {
  const options = validateOptions(userOptions);
  return {
    name: 'starlight-share-actions',
    hooks: {
      'config:setup'({ addIntegration }: any) {
        addIntegration({
          name: 'starlight-share-actions-integration',
          hooks: {
            'astro:config:setup'({ injectScript, updateConfig }: any) {
              updateConfig({ vite: { plugins: [vitePluginShareActions(options)] } });
              injectScript('page', 'import "starlight-share-actions/client";');
            },
          },
        });
      },
    },
  };
}
