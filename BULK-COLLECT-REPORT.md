# BULK-COLLECT-REPORT

**Date:** 2026-09-05 (Asia/Shanghai)

## Counts
- **Before this bulk run:** 25 verified entries in `public/entries.json`
- **After:** **108** verified entries
- **Net new:** +83
- Unique `x.com/.../status/...` IDs referenced: 50

## How collection worked (no X API / no user X MCP credits)
1. Public pages: eChai `/astra`, Pasquale wild-builds, OpenAI Developers blogs, Latent Space, HN Algolia, CodeRabbit, Real Python, OpenRouter, Vercel, GitHub Copilot changelog, system card / safety overview, Something Big, Lenny/Claire Vo, Stork, etc.
2. Status URLs were **discovered from public HTML** (eChai embeds / curated proxies in `x-curated-proxies.json`), then **HTTP-checked** and optionally text-confirmed via **public fxtwitter** mirrors — never the user's X developer API.
3. `x-browser-finds.*` was not present on disk when this report was written; merge used `x-curated-proxies.json` (61) + `candidates-raw.json` (20) instead.

## New / expanded id families (sample)
Original seed (25) retained. Bulk adds include eChai status demos (`x-2095…` / named ids), Playco, CodeRabbit (+ NIGHTSHIFT), Real Python turtle bench, PhiloLabs Union Square head-to-head, OpenRouter/Vercel/Copilot distribution cards, safety overview + system card, Every vibe check, Greg prompt pack (single docs-office entry), Sunwake/Hollowflux/HELIOS/Shipyard/Giverny splits, Shumer Unreal civilization + Manhattan, Pasquale-sourced wild builds (preferring status URLs when known), Claire Vo Lenny writeup, ChatGPT Sites docs, plus late gap fills:
- `davis7-final-cut-setup`
- `stork-astra-playable-games`

Full post-seed id list (83):
- `angaisb-gameboy-portfolio`
- `bhavani-3d-scene-model-bakeoff`
- `chddaniel-motion-videos-14min`
- `claire-vo-4552204b`
- `coderabbit-code-review-eval`
- `coderabbit-nightshift-godot`
- `davis7-final-cut-setup`
- `derya-wow-runescape-rpg`
- `every-astra-vibe-check`
- `feraser-interactive-turbocharger`
- `gary-marcus-astra-hot-take`
- `github-copilot-astra-ga`
- `greg-isenberg-astra-prompts`
- `max-weinbach-2bcfa700`
- `miguel-hyperframes-videos`
- `openai-chatgpt-learn-4fbbda03`
- `openai-developers-0b74d134`
- `openai-giverny-garden`
- `openai-helios-dyson`
- `openai-hollowflux-2d-rpg`
- `openai-model-guidance-astra`
- `openai-playco-prototyping`
- `openai-safety-overview`
- `openai-shipyard-aurelion`
- `openai-sunwake-ocean`
- `openai-system-card-hub`
- `openrouter-astra-routing`
- `pasquale-minecraft-oneshot`
- `pasquale-palace-fine-arts`
- `pasquale-tcells-remotion`
- `pasquale-theo-fishslop`
- `pasquale-yunfan-zillow-3d`
- `philolabs-union-square-astra`
- `realpython-turtle-benchmark`
- `shumer-manhattan-unreal`
- `shumer-ue-talking-agents`
- `simonwillison-astra-notes`
- `somethingbig-manager-loop-review`
- `stork-astra-playable-games`
- `testingcatalog-first-outputs`
- `thenewstack-astra-benchmarks`
- `theo-codebase-slop-audits`
- `tomkrcha-locomotive-3295`
- `vaibhav-nurburgring-blender`
- `vercel-ai-gateway-astra`
- `vox-agents-md-from-reviewer`
- `x-2095595932335170031`
- `x-2095596020638036311`
- `x-2095596341422440714`
- `x-2095596405620441591`
- `x-2095596700815516004`
- `x-2095596867081916653`
- `x-2095596903014580579`
- `x-2095597213896610184`
- `x-2095598016103329898`
- `x-2095598710311067716`
- `x-2095601996770263362`
- `x-2095603691948843077`
- `x-2095604728683958295`
- `x-2095608815492202985`
- `x-2095610200778592665`
- `x-2095610463954637132`
- `x-2095612137582526615`
- `x-2095616764793270705`
- `x-2095619201105059974`
- `x-2095620888695902366`
- `x-2095625355231142079`
- `x-2095630197257367857`
- `x-2095635722208493813`
- `x-2095636679264780481`
- `x-2095637507337826741`
- `x-2095648379455861054`
- `x-2095648896991080555`
- `x-2095653641164329143`
- `x-2095659170661904804`
- `x-2095699049722581065`
- `x-2095719731860750613`
- `x-2095723177389232540`
- `x-2095751225283350624`
- `x-2095756085890310311`
- `x-2095819740694577203`
- `x-2095877348314730821`
- `xikhar-blender-oneshot-assets`

## Skipped false positives / low-signal
- **DataStax Astra** / unrelated Astra products — excluded by query framing.
- **GPT-5.6 Sol-only** demos unless Astra explicitly named.
- **CNBC / Axios / Verge-style launch mirrors** — mostly skipped; kept only high-signal digests (e.g. Simon Willison, The New Stack bench package once).
- **Prompt-list hype without artifact:** e.g. `@viktoroddy` one-shot-reel claim, `@RyanSael` “why it’s crazy” rundown — not added.
- **Giveaways / access announcements** without a build (e.g. Devin free Max plans) — low priority; some may remain if they were auto-merged earlier as curated X items.
- **here.now homepage** alone — platform, not an Astra artifact (skipped).
- **Techmeme hub** — aggregator only (skipped).
- **Duplicate news rewrites** of the same launch — prefer unique builds/benches.
- Near-duplicate **Pasquale vs X status** pairs: prefer status URL when known; some dual entries may still exist from parallel merges (ids differ, same story).

## Category mix (after)
- `3d-spatial`: 32
- `coding-agent`: 37
- `computer-use`: 8
- `cost-economics`: 9
- `cyber`: 2
- `docs-office`: 11
- `math-science`: 4
- `safety-monitorability`: 5

## Site UX
- Search box + category chips already on `public/index.html` (main merge).
- Pagination not required at ~108 cards; filters + search sufficient.

## Why hundreds of demos aren’t reachable from public web alone
1. **Most builds live only as X videos** without durable writeups, repos, or `chatgpt.site` / here.now permanent URLs.
2. **No X API** (user constraint) → discovery depends on third-party curators (eChai, Min Choi roundups, Techmeme). When those pages omit status IDs or live links, we cannot invent them.
3. **Sites/live demos** are often unlisted, ephemeral, or behind ChatGPT auth; few public indexes list every `*.chatgpt.site` Astra publish.
4. **Corporate/early-access demos** (internal Codex fleets, private Unreal projects) appear as screenshots in threads without openable artifacts.
5. **Harness-sensitive benches** (ARC adapter vs default) are written up once; dozens of private forks aren’t public pages.
6. **Time window:** Astra launched ~2026-09-03; the public web still has dozens—not hundreds—of *distinct, fetchable* sources that clearly name GPT-6 Astra.

Honest ceiling from this pass: **~100–120 high-quality public entries** without inventing URLs; going to 200+ would require broader X firehose access, Sites crawl agreements, or author-submitted live links.

## Integrity
- `verified: true` only for entries whose `source_url` was fetched/opened.
- No fabricated authors, metrics, or demos.
