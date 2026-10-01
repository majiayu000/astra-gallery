# Astra Gallery

An independent gallery of public **GPT-6 Astra** builds and practice notes: original source links required, cost notes when known.

- [Online gallery](https://majiayu000.github.io/astra-gallery/)
- Local preview: `public/`
- Data: `data/seed-entries.json` → copied to `public/entries.json`
- Brand: **Astra Gallery** (not Astro)

## Dev

```bash
cd public && python3 -m http.server 8765
```

## Submit

Open a [GitHub issue](https://github.com/majiayu000/astra-gallery/issues/new) with a title, original creator, source URL, optional live URL, category, evidence of Astra's contribution, and a cost note when known. Include the conditions behind a quoted cost (model, usage or number of attempts if the source provides them); leave unknown costs empty.

Inclusion and the data's `verified` field refer to the catalogue's source review. They do not establish an independent rerun, benchmark score, permission to reuse the linked work, or endorsement by OpenAI. A video demonstration is not necessarily a runnable app. Public attention counts retain their recorded date and are not current popularity or search ranking data.

The site's [reading notes](https://majiayu000.github.io/astra-gallery/#reading-notes) link three existing source records directly, including without JavaScript. Search by task, use the live-link filter to find entries with a demo address, and inspect the original source before drawing conclusions. Current model specifications belong to the [official GPT-6 Astra model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra).

## Attention signals (optional)

Cards may show public X interaction counts (`attention` on an entry) when available:
impressions, likes, reposts, bookmarks. Missing data is omitted — never faked as zero.

Refresh merge (after you have a `metrics.json` from the X API):

```bash
python3 scripts/fetch-attention.py --metrics path/to/metrics.json
```
