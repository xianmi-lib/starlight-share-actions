import { describe, expect, it } from 'vitest';
import starlightShareActions from '../src/index.js';
import { vitePluginShareActions } from '../src/libs/vite.js';
import { validateOptions } from '../src/config.js';

function simulateSetup(options: Record<string, unknown> = {}) {
  const calls: { injectScript: unknown[]; vitePlugins: unknown[] } = { injectScript: [], vitePlugins: [] };
  const plugin = starlightShareActions(options as never) as any;
  let innerIntegration: any = null;
  plugin.hooks['config:setup']({
    addIntegration: (i: any) => {
      innerIntegration = i;
    },
  });
  expect(innerIntegration).not.toBeNull();
  innerIntegration.hooks['astro:config:setup']({
    injectScript: (...args: unknown[]) => calls.injectScript.push(args),
    updateConfig: (c: any) => calls.vitePlugins.push(c.vite.plugins),
  });
  return calls;
}

describe('starlightShareActions 插件', () => {
  it('注册 astro:config:setup：注入 client 脚本 + 挂 Vite 插件', () => {
    const calls = simulateSetup({ card: { siteName: 'Demo' } });
    expect(calls.injectScript).toEqual([['page', 'import "starlight-share-actions/client";']]);
    expect(calls.vitePlugins).toHaveLength(1);
  });

  it('非法配置在插件工厂期即抛错（构建期早失败）', () => {
    expect(() => starlightShareActions({ card: { siteName: '' } } as never)).toThrow(/siteName/);
  });
});

describe('vitePluginShareActions 虚拟模块', () => {
  it('resolveId 命中虚拟 id，load 吐归一配置 JSON', () => {
    const options = validateOptions({ card: { siteName: 'Demo' } });
    const vite = vitePluginShareActions(options) as any;
    const id = 'virtual:starlight-share-actions/options';
    expect(vite.resolveId(id)).toBe(`\0${id}`);
    const code = vite.load(`\0${id}`) as string;
    expect(code).toContain('"siteName":"Demo"');
  });

  it('无关 id 返回 undefined', () => {
    const vite = vitePluginShareActions(validateOptions({})) as any;
    expect(vite.resolveId('other')).toBeUndefined();
    expect(vite.load('/src/x.ts')).toBeUndefined();
  });
});
