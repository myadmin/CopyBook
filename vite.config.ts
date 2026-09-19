import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 本地提供 hanzi-writer-data 笔画数据：dev 走中间件，build 拷贝到 dist/hanzi-data，离线也能用
const HZ_DIR = path.resolve('node_modules/hanzi-writer-data');

const hanziData = () => ({
  name: 'hanzi-data',
  configureServer(server: any) {
    server.middlewares.use('/hanzi-data/', (req: any, res: any, next: any) => {
      let raw = '';
      try {
        raw = decodeURIComponent((req.url || '').replace(/^\//, '').replace(/\.json$/, ''));
      } catch {
        return next(); // 非法百分号编码
      }
      const file = path.join(HZ_DIR, `${raw}.json`);
      // 拒绝路径分隔符与空字节（含 \0 的路径会让 existsSync 直接抛异常）
      if (raw && !raw.includes('/') && !raw.includes('\\') && !raw.includes('\0') && fs.existsSync(file)) {
        res.setHeader('Content-Type', 'application/json');
        fs.createReadStream(file).pipe(res);
      } else {
        next();
      }
    });
  },
  closeBundle() {
    if (!fs.existsSync(HZ_DIR)) return;
    const outDir = path.resolve('dist/hanzi-data');
    fs.mkdirSync(outDir, { recursive: true });
    fs.cpSync(HZ_DIR, outDir, {
      recursive: true,
      filter: (src: string) => !src.endsWith('package.json'),
    });
  },
});

// PWA 离线：预缓存只收 js/css/html；字体分片与 9500+ 笔画 JSON 走 CacheFirst 惰性缓存，
// 用过一次即永久离线可用（笔画 JSON 若全量预缓存会有几十 MB，绝不进 sw.js 清单）
const pwa = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icon.svg', 'registerSW.js'],
  manifest: {
    name: '字帖生成器',
    short_name: '字帖生成器',
    description: '本地生成 A4 字帖：田字格/米字格/拼音/笔顺/毛笔版式，打印即用',
    lang: 'zh-CN',
    display: 'standalone',
    start_url: '.',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  },
  workbox: {
    globPatterns: ['index.html', 'registerSW.js', 'assets/**/*.js', 'assets/**/*.css'],
    navigateFallback: 'index.html',
    maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: /\/hanzi-data\/[^/]+\.json$/,
        handler: 'CacheFirst',
        options: { cacheName: 'hanzi-data', expiration: { maxEntries: 8000, maxAgeSeconds: 15552000 } },
      },
      {
        urlPattern: /cdn\.jsdelivr\.net\/npm\/hanzi-writer-data/,
        handler: 'CacheFirst',
        options: { cacheName: 'hanzi-cdn', expiration: { maxEntries: 4000, maxAgeSeconds: 15552000 } },
      },
      {
        urlPattern: /\.(?:woff2|woff|ttf|otf)$/,
        handler: 'CacheFirst',
        options: { cacheName: 'webfonts', expiration: { maxEntries: 300, maxAgeSeconds: 15552000 } },
      },
    ],
  },
});

// base './'：产物内所有资源用相对路径——可部署到任意位置（根域、GitHub Pages 项目页
// /repo/、宝塔子目录），配合 strokes.ts 的相对 hanzi-data 路径与 start_url '.'，整站无绝对路径假设。
export default defineConfig({
  base: './',
  plugins: [react(), hanziData(), pwa],
});
