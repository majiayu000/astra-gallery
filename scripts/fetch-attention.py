#!/usr/bin/env python3
"""Merge external X public_metrics into entries attention fields.

Usage:
  python3 scripts/fetch-attention.py --metrics path/to/metrics.json
  python3 scripts/fetch-attention.py --metrics path/to/metrics.json --dry-run
  python3 scripts/fetch-attention.py --metrics path/to/metrics.json --clear-missing

By default, entries with no matching metrics keep any existing attention.
Pass --clear-missing to remove attention on misses (destructive).

metrics.json shape (from X Algo / CI):
  {
    "fetched_at": "ISO-8601Z",
    "by_status_id": {
      "2095...": {
        "impression_count": 1,
        "like_count": 1,
        "repost_count": 0,
        "reply_count": 0,
        "quote_count": 0,
        "bookmark_count": 0
      }
    }
  }

Live X fetch is done outside this script (API credits). This only merges.
Writes public/entries.json and data/seed-entries.json when present.
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATUS_RE = re.compile(r"(?:x\.com|twitter\.com)/[^/]+/status/(\d+)", re.I)
API_TO_UI = [
    ("impression_count", "impressions"),
    ("like_count", "likes"),
    ("repost_count", "reposts"),
    ("reply_count", "replies"),
    ("quote_count", "quotes"),
    ("bookmark_count", "bookmarks"),
]


def map_metrics(pm: dict) -> dict:
    out = {}
    for src, dst in API_TO_UI:
        if src in pm and pm[src] is not None:
            out[dst] = int(pm[src])
    return out


def derive(m: dict):
    impr = m.get("impressions")
    if not impr or impr <= 0:
        return None
    engage = sum(m.get(k, 0) for k in ("likes", "reposts", "replies", "quotes", "bookmarks"))
    return {"engage_per_1k_impr": round(1000.0 * engage / impr, 1)}


def _miss_reason(entry: dict, by_id: dict) -> str | None:
    """Return a miss reason, or None when metrics can be attached."""
    url = entry.get("source_url") or ""
    mo = STATUS_RE.search(url)
    if not mo:
        return "non_x_url"
    sid = mo.group(1)
    pm = by_id.get(sid)
    if not pm:
        return "missing_status"
    if not map_metrics(pm):
        return "empty_metrics"
    return None


def attach(
    entries: list,
    by_id: dict,
    fetched_at: str,
    *,
    clear_missing: bool = False,
) -> dict:
    """Merge metrics into entries.

    Misses (non-X URL, absent status id, or empty mapped metrics) skip by default
    so existing attention is preserved. With clear_missing=True, pops attention
    on those misses.

    Returns counts: updated, unchanged, and either would_clear or cleared.
    """
    updated = 0
    unchanged = 0
    would_clear = 0
    cleared = 0

    for e in entries:
        reason = _miss_reason(e, by_id)
        if reason is not None:
            has_attention = "attention" in e
            if clear_missing and has_attention:
                e.pop("attention", None)
                cleared += 1
            elif has_attention:
                would_clear += 1
            else:
                unchanged += 1
            continue

        url = e.get("source_url") or ""
        sid = STATUS_RE.search(url).group(1)
        metrics = map_metrics(by_id[sid])
        att = {
            "platform": "x",
            "status_id": sid,
            "fetched_at": fetched_at,
            "metrics": metrics,
            "freshness": "ok",
        }
        der = derive(metrics)
        if der:
            att["derived"] = der
        e["attention"] = att
        updated += 1

    out = {"updated": updated, "unchanged": unchanged}
    if clear_missing:
        out["cleared"] = cleared
    else:
        out["would_clear"] = would_clear
    return out


def load_doc(path: Path):
    data = json.loads(path.read_text())
    if isinstance(data, dict) and "entries" in data:
        return data, data["entries"], True
    if isinstance(data, list):
        return data, data, False
    raise SystemExit(f"unsupported JSON shape: {path}")


def format_summary(stats: dict) -> str:
    parts = [f"updated={stats['updated']}", f"unchanged={stats['unchanged']}"]
    if "cleared" in stats:
        parts.append(f"cleared={stats['cleared']}")
    else:
        parts.append(f"would_clear={stats['would_clear']}")
    return ", ".join(parts)


def main():
    ap = argparse.ArgumentParser(
        description="Merge X public_metrics into entry attention fields. "
        "By default, misses keep existing attention; use --clear-missing to strip them."
    )
    ap.add_argument("--metrics", required=True, help="metrics.json with by_status_id")
    ap.add_argument(
        "--targets",
        nargs="*",
        default=["public/entries.json", "data/seed-entries.json", "seed-entries.json"],
    )
    ap.add_argument(
        "--clear-missing",
        action="store_true",
        help="Remove attention when metrics are missing (destructive). Default: skip/preserve.",
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute merge summary without writing files.",
    )
    args = ap.parse_args()
    doc = json.loads(Path(args.metrics).read_text())
    by_id = doc.get("by_status_id") or {}
    fetched_at = doc.get("fetched_at") or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for rel in args.targets:
        path = ROOT / rel
        if not path.exists():
            print(f"skip missing {rel}")
            continue
        data, entries, wrapped = load_doc(path)
        stats = attach(entries, by_id, fetched_at, clear_missing=args.clear_missing)
        mode = "dry-run" if args.dry_run else "write"
        print(f"{rel} [{mode}]: {format_summary(stats)} ({len(entries)} entries)")
        if args.dry_run:
            continue
        if wrapped:
            data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        else:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
