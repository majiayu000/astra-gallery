# Astra Gallery — 多媒体存放 + 多语言方案

## 目标
- 中英双语（先 zh-CN / en，默认跟浏览器，可手动切换）
- 每条尽量有封面图；高光条目有短视频 mp4 或可嵌入预览
- 不把大视频塞进 GitHub 仓库

## 推荐存放（首选）
Cloudflare R2 公有桶 + 自定义域名（和现有 CF Worker / 雷达同栈）

| 东西 | 放哪 | 说明 |
|---|---|---|
| 封面 WebP/JPG（≤300KB） | R2 media/thumbs/{id}.webp | 站内卡片 |
| 短视频 mp4（≤15MB 优先） | R2 media/videos/{id}.mp4 | 卡片内 video |
| 超大/官方片 | 只存 embed 或源站链接 | 不镜像整片 |
| 条目元数据 | Git public/entries.json | 文案、分类、成本、i18n |
| UI 文案 | public/i18n/zh.json + en.json | 导航、筛选、页脚 |

CDN 域名候选：media.astra-gallery.com（域名买下后绑 R2）。

为什么不是 GitHub：视频一多仓库膨胀，Pages 也不适合当媒体 CDN。
为什么不是只热链 X/OpenAI：链会挂、防盗链；封面必须自托管。

## 备选
1. GitHub Releases — 临时救急
2. Bunny / Cloudflare Stream — 视频多了再上
3. 仅 embed — fallback

## 条目 JSON 扩展
title/description 用 {en, zh}；media: {thumb, video, poster, embed, credit, license_note}

## 多语言 MVP
localStorage + ?lang=；缺译回退英文；暂不做 /zh 子路径。

## 过渡
R2 未就绪时：小封面先放 public/media/thumbs/（总包控数 MB），视频用 embed/外链，通了再切 CDN。
