/** 显示名：字符串=全语言同名；映射键=语言码（en/zh-CN/zh-TW 等任意子集），解析序见 resolveName */
export type NameMap = string | Record<string, string>;

export type PlatformId = 'x' | 'facebook' | 'line' | 'whatsapp' | 'telegram' | 'weibo';

/** 自定义平台：href 模板可含 {url}（编码后 URL）与 {title}（编码后标题）占位符 */
export interface PlatformDef {
  id: string;
  name: NameMap;
  href: string;
}

/** 卡片风格：色板 + 排版方向 + 字体栈（全部可省，走内置缺省） */
export interface CardStyle {
  id: string;
  name: NameMap;
  orientation?: 'horizontal' | 'vertical';
  bg?: string;
  fg?: string;
  accent?: string;
  muted?: string;
  font?: string;
}

export interface Labels {
  share: string;
  systemShare: string;
  copyLink: string;
  copied: string;
  copyFailed: string;
  makeCard: string;
  selectShare: string;
  cardTitle: string;
  styleLabel: string;
  saveHint: string;
  download: string;
  shareImage: string;
  close: string;
  generateFailed: string;
}

export interface CardOptions {
  siteName: string;
  styles?: CardStyle[];
  defaultStyleId?: string;
  maxQuoteLength?: number;
  minQuoteLength?: number;
  width?: number;
  height?: number;
}

export interface StarlightShareActionsOptions {
  link?: { platforms?: (PlatformId | PlatformDef)[] } | false;
  card?: CardOptions | false;
  where?: { idPattern?: string };
  labels?: Record<string, Partial<Labels>>;
}

/** validateOptions 归一后的运行时形态（客户端虚拟模块拿到的就是它） */
export interface ResolvedPlatform {
  id: string;
  name: NameMap;
  href: string;
}

export interface ResolvedCardStyle extends Required<Omit<CardStyle, 'name'>> {
  name: NameMap;
}

export interface ResolvedCardOptions {
  siteName: string;
  styles: ResolvedCardStyle[];
  defaultStyleId: string;
  maxQuoteLength: number;
  minQuoteLength: number;
  width: number;
  height: number;
}

export interface ResolvedOptions {
  link: { platforms: ResolvedPlatform[] } | false;
  card: ResolvedCardOptions | false;
  where: { idPattern?: string };
  labels: Record<string, Partial<Labels>>;
}
