# Astra Gallery

Narrow gallery of **verified** GPT-6 Astra builds: source links required, cost notes when known.

- Live preview (local): `public/`
- Data: `data/seed-entries.json` → copied to `public/entries.json`
- Brand: **Astra Gallery** (not Astro)
- Domain candidates: `astra-gallery.com`, `astragallery.dev`, `gpt6.gallery`

## Dev

```bash
cd public && python3 -m http.server 8765
```

## Submit

Open a GitHub issue with: title, source URL, optional live URL, category, cost note.

## Attention signals (optional)

Cards may show public X interaction counts (`attention` on an entry) when available:
impressions, likes, reposts, bookmarks. Missing data is omitted — never faked as zero.

Refresh merge (after you have a `metrics.json` from the X API):

```bash
python3 scripts/fetch-attention.py --metrics path/to/metrics.json
```
