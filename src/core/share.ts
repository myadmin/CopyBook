// 配置链接分享：整套配置序列化进 URL hash，打开链接即还原字帖设置。
// 优先 deflate-raw 压缩（长练习文字可省约六成 URL 长度，结果以 `z` 前缀标记）；
// 浏览器不支持或压缩无收益时退回原始 base64url。解码端两种格式都认，旧链接永不失效。
// hash 只作为“启动种子”：页面里再改动配置时由 App 清除，避免刷新后旧链接配置复活。
import type { CopybookConfig } from './types';
import { sanitize } from './persist';

const KEY = 'c';

const toB64Url = (bytes: Uint8Array): string => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromB64Url = (s: string): Uint8Array<ArrayBuffer> => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

// 首字符为 'z' 无歧义：JSON 以 '{' 开头，其 base64url 首位恒为 'e'
const COMPRESSED = 'z';

export async function encodeShare(cfg: CopybookConfig): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(cfg));
  if (typeof CompressionStream !== 'undefined') {
    try {
      const packed = new Uint8Array(await new Response(
        new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw')),
      ).arrayBuffer());
      if (packed.length < bytes.length) return COMPRESSED + toB64Url(packed);
    } catch { /* 退回原始编码 */ }
  }
  return toB64Url(bytes);
}

export async function decodeShare(hash: string): Promise<CopybookConfig | null> {
  const m = new URLSearchParams(hash.replace(/^#/, '')).get(KEY);
  if (!m) return null;
  try {
    let bytes: Uint8Array;
    if (m.startsWith(COMPRESSED) && typeof DecompressionStream !== 'undefined') {
      bytes = new Uint8Array(await new Response(
        new Blob([fromB64Url(m.slice(COMPRESSED.length))]).stream()
          .pipeThrough(new DecompressionStream('deflate-raw')),
      ).arrayBuffer());
    } else {
      bytes = fromB64Url(m);
    }
    return sanitize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null; // 手改/截断的链接静默回退本地存档
  }
}

/** 生成完整分享链接（复制进剪贴板即可发给别人） */
export async function shareUrl(cfg: CopybookConfig): Promise<string> {
  const base = location.href.split('#')[0];
  return `${base}#${KEY}=${await encodeShare(cfg)}`;
}
