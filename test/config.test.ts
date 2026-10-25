import { describe, expect, it } from 'vitest';
import {
  BUILTIN_PLATFORMS,
  buildShareHref,
  normalizeQuote,
  pageIdFromPath,
  resolveShowOnPath,
  validateOptions,
} from '../src/config.js';
import type { CardStyle } from '../src/types.js';

describe('validateOptions', () => {
  it('默认：link 平台 x/facebook/line，card 未配置视为关闭', () => {
    const o = validateOptions({});
    expect(o.link).not.toBe(false);
    expect(o.link && o.link.platforms.map((p) => p.id)).toEqual(['x', 'facebook', 'line']);
    expect(o.card).toBe(false);
  });

  it('未知平台 id 报带插件前缀的错误', () => {
    expect(() => validateOptions({ link: { platforms: ['nope' as never] } })).toThrow(
      /\[starlight-share-actions\] Unknown platform id/,
    );
  });

  it('自定义平台缺字段报错', () => {
    expect(() => validateOptions({ link: { platforms: [{ id: 'x2' } as never] } })).toThrow(
      /Custom platform requires/,
    );
  });

  it('card 开启但缺 siteName 报错', () => {
    expect(() => validateOptions({ card: { siteName: '  ' } })).toThrow(/card\.siteName.*required/);
  });

  it('风格 id 重复报错', () => {
    const styles: CardStyle[] = [
      { id: 'a', name: 'A' },
      { id: 'a', name: 'B' },
    ];
    expect(() => validateOptions({ card: { siteName: 'S', styles } })).toThrow(/Duplicate/);
  });

  it('defaultStyleId 不在风格列表报错', () => {
    expect(() =>
      validateOptions({ card: { siteName: 'S', defaultStyleId: 'missing' } }),
    ).toThrow(/defaultStyleId.*matches no style id/);
  });

  it('非法 idPattern 报带前缀错误', () => {
    expect(() => validateOptions({ where: { idPattern: '(' } })).toThrow(
      /Invalid `where\.idPattern`/,
    );
  });

  it('link 与 card 全关报「无事可做」', () => {
    expect(() => validateOptions({ link: false })).toThrow(/both `link` and `card` are disabled/);
  });

  it('card 归一：styles 填满缺省字段，defaultStyleId 缺省取第一个', () => {
    const o = validateOptions({
      card: { siteName: 'Demo', styles: [{ id: 'mine', name: 'Mine' }] },
    });
    expect(o.card).not.toBe(false);
    if (o.card) {
      expect(o.card.defaultStyleId).toBe('mine');
      expect(o.card.styles[0].bg).toBe('#f7f3ea');
      expect(o.card.styles[0].orientation).toBe('horizontal');
      expect(o.card.maxQuoteLength).toBe(160);
      expect(o.card.width).toBe(1080);
    }
  });

  it('内置平台模板都含 {url} 或 {title} 占位', () => {
    for (const p of Object.values(BUILTIN_PLATFORMS)) {
      expect(p.href).toMatch(/\{(url|title)\}/);
    }
  });
});

describe('buildShareHref', () => {
  it('占位符 URL 编码替换', () => {
    const href = buildShareHref('https://example.com/s?u={url}&t={title}', {
      url: 'https://site.example/a b/',
      title: '標題&參數',
    });
    expect(href).toBe(
      'https://example.com/s?u=https%3A%2F%2Fsite.example%2Fa%20b%2F&t=%E6%A8%99%E9%A1%8C%26%E5%8F%83%E6%95%B8',
    );
  });
});

describe('normalizeQuote', () => {
  it('剥全角缩进并折叠空白', () => {
    expect(normalizeQuote('　　如是我聞，\n一時佛在  舍衛國。', 50)).toBe('如是我聞， 一時佛在 舍衛國。');
  });

  it('超长按码点截断加省略号（CJK 安全）', () => {
    const out = normalizeQuote('字'.repeat(200), 10);
    expect(Array.from(out)).toHaveLength(11);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('pageIdFromPath / resolveShowOnPath', () => {
  it('剥 base 前缀与首尾斜杠', () => {
    expect(pageIdFromPath('/p01/a/961/', '/')).toBe('p01/a/961');
    expect(pageIdFromPath('/zh-tw/p01/a/961/', '/zh-tw')).toBe('p01/a/961');
    expect(pageIdFromPath('/zh-tw/p01/a/961/', '/zh-tw/')).toBe('p01/a/961');
  });

  it('idPattern 匹配同 ai-actions 口径', () => {
    expect(resolveShowOnPath('/p01/a/961/', '/', '^p\\d\\d/')).toBe(true);
    expect(resolveShowOnPath('/guides/x/', '/', '^p\\d\\d/')).toBe(false);
    expect(resolveShowOnPath('/zh-tw/p02/x/', '/zh-tw', '^p\\d\\d/')).toBe(true);
  });
});
