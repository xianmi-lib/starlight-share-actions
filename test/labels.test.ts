import { describe, expect, it } from 'vitest';
import { DEFAULT_LABELS, resolveLabels } from '../src/labels.js';

describe('DEFAULT_LABELS', () => {
  it('三语词条键集合一致且无空值', () => {
    const langs = Object.keys(DEFAULT_LABELS) as (keyof typeof DEFAULT_LABELS)[];
    const keys = new Set(Object.keys(DEFAULT_LABELS.en));
    expect(keys.size).toBeGreaterThan(0);
    for (const lang of langs) {
      expect(new Set(Object.keys(DEFAULT_LABELS[lang]))).toEqual(keys);
      for (const v of Object.values(DEFAULT_LABELS[lang])) expect(v).not.toBe('');
    }
  });

  it('zh-CN 与 zh-TW 的繁简差异键真实存在（防两侧意外同文）', () => {
    expect(DEFAULT_LABELS['zh-CN'].copyLink).not.toBe(DEFAULT_LABELS['zh-TW'].copyLink);
  });
});

describe('resolveLabels', () => {
  it('精确语言命中', () => {
    expect(resolveLabels('zh-TW', undefined).copyLink).toBe('複製連結');
  });

  it('未知语言回退 en', () => {
    expect(resolveLabels('fr', undefined).copyLink).toBe('Copy link');
  });

  it('用户覆盖按键生效、空串忽略', () => {
    const labels = resolveLabels('zh-CN', {
      'zh-CN': { share: '轉發', copied: '' },
    });
    expect(labels.share).toBe('轉發');
    expect(labels.copied).toBe(DEFAULT_LABELS['zh-CN'].copied);
  });
});
