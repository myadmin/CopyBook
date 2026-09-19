# 字帖生成器（copybook）

纯前端的中文硬笔/钢笔/毛笔字帖生成器：浏览器里实时预览 A4 描红字帖，直接打印或导出 300dpi PNG。无后端、无账号、无埋点——生成一份字帖不需要和任何服务器交换一个字节的数据。

## 功能

- **三大字帖体系**：铅笔帖（拼音＋笔顺＋描红）、钢笔帖、毛笔帖（米字/九宫/回米格，条幅/斗方/对联传统竖式版式，碑帖黑底模式）
- **格子引擎**：田字格、米字格、九宫格、回宫格、拼音四线三格、英语四线格、横线行款格、作文格/诗笺等，参数化（线色/线粗/双线框/格心点/底色）
- **注音与笔顺**：pinyin-pro 自动注音（支持多音字手工选读音、去声调）；hanzi-writer 笔顺分步格＋逐字动画预览
- **内容库**：统编版必背古诗词（按年级分组）、常用字表、蒙学经典、拼音专帖、英语词库，选篇即用
- **我的模板**：整套配置（含练习文字）命名保存到本地，一键套用
- **导出与打印**：打印走 `@page A4` 原生分页；PNG 按 300dpi 光栅化，按 unicode-range 只内联本页用到的文楷分片；选页导出（「1-2,4」）多页自动打 zip，文件名带标题日期
- **分享链接**：整套配置 deflate 压缩后编入 URL hash（约省 60% 长度），发给别人打开即还原
- **本地字体导入**：可选本机 ttf/otf/woff/woff2 即时套用，存 IndexedDB 下次自动恢复，PNG 导出自动内嵌
- **PWA 离线**：装好 Service Worker 后完全离线可用；笔画数据与字体分片按用缓存
- 缩略图页导航、横竖排、横竖版纸、页码历史、缩放预览

## 快速开始

```bash
npm install
npm run dev        # 开发：http://localhost:5173
npm run build      # 构建：产物在 dist/（约 79MB，含 49MB 笔画数据与 29MB 文楷分片）
npm run preview    # 本地预览构建产物
```

## 部署

构建产物零绝对路径（`base: './'`），可部署到任意静态位置：根域、子目录、GitHub Pages 项目页均可，无需任何服务器配置（纯静态，无路由、无 API）。

### GitHub Pages（推荐 Actions 自动发布）

1. 仓库 **Settings → Pages → Source** 选 **GitHub Actions**；
2. push 到 `main` 或 `master` 即触发 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)：`npm ci → npm run build → upload-pages-artifact → deploy-pages`；
3. 构建产物不进 git，仓库只存源码。

> 免费版 Pages 要求仓库公开。本站无任何秘密数据（用户配置只存在使用者自己的浏览器里），公开与否仅决定谁能访问页面。

### 宝塔 / 任意静态空间

1. 本地 `npm run build`，把 `dist/` 内的文件上传到站点根目录（解压后 `index.html` 在根）；
2. **签 HTTPS 证书**（宝塔一键 Let's Encrypt）：Service Worker 只在 HTTPS 下启用，未上 HTTPS 网站照常工作，仅离线缓存失效；
3. 更新即重复"构建 → 覆盖上传"。

发布后老访客需再刷新一次才会拿到新版本（PWA autoUpdate 特性）。

## 数据与隐私

全部数据只在本机浏览器：

| 存储 | 内容 |
| --- | --- |
| `localStorage: copybook.config.v1` | 当前配置（自动保存） |
| `localStorage: copybook.templates.v1` | 我的模板 |
| `localStorage: copybook.pagespec.v1` | 最近 5 次选页导出写法 |
| `IndexedDB: copybook.font` | 导入的本地字体（≤20MB，可随时在面板中移除） |

「分享链接」把配置编码进 URL hash，内容随链接本身传递，不经过任何服务端。

## 字体与版权

- **随应用分发的唯一 Webfont 是[霞鹜文楷 LXGW WenKai](https://github.com/lxgw/LxgwWenKai)**，SIL OFL 1.1 授权，允许嵌入分发；按 unicode-range 分为 582 个子集按需加载；
- 系统字体（楷体 KaiTi、华文隶书等）**仅按字体名引用**，用户本机装了才生效，不分发任何字体文件；
- 「导入本地字体」只读取使用者自己选择的文件，仅存于其本机；
- 笔画数据来自 [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data)（npm 包 MIT 许可），构建时拷贝到 `dist/hanzi-data/`，另有 jsDelivr CDN 兜底。

## 技术要点

- Vite 5 + React 18 + TypeScript，无 UI 框架；
- 每页是一张 `<svg width="210mm" viewBox="0 0 210 297">`，1 用户单位 = 1mm，打印/导出共用同一几何计算；
- PNG 导出：SVG → `<img>` 光栅化，`<img>` 独立文档用不了页面 Web 字体，故扫描样式表、把覆盖本页文字的分片 fetch 成 base64 内联；
- PWA：预缓存只收 html/js/css；笔画 JSON 与 woff2 走 RuntimeCache CacheFirst（180 天），避免把 49MB 数据塞进安装清单。

## 目录结构

```
src/core/        配置与几何（types/persist/layout/share/fonts/exportPng…）
src/components/  面板与 SVG 渲染（SettingsPanel/GridSheet/CalligraphySheet/PageNav）
public/          图标与静态资源
PLAN.md          完整开发计划与历次改动记录
```

## 已知限制

- 仅 A4；横线格/英语格/竖排/毛笔版式下拼音带与笔顺不适用（面板已联动禁用）；
- 导入字体存于浏览器存储，浏览器"清理站点数据"后需重新导入；
- 自用项目，无 lint 与单元测试（以浏览器实测＋数值脚本为准）。
