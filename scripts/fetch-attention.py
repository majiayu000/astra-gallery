#!/usr/bin/env python3
"""Merge external X public_metrics into entries attention fields.

Usage:
  python3 scripts/fetch-attention.py --metrics path/to/metrics.json

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


def attach(entries: list, by_id: dict, fetched_at: str) -> int:
    n = 0
    for e in entries:
        url = e.get("source_url") or ""
        mo = STATUS_RE.search(url)
        if not mo:
            e.pop("attention", None)
            continue
        sid = mo.group(1)
        pm = by_id.get(sid)
        if not pm:
            e.pop("attention", None)
            continue
        metrics = map_metrics(pm)
        if not metrics:
            e.pop("attention", None)
            continue
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
        n += 1
    return n


def load_doc(path: Path):
    data = json.loads(path.read_text())
    if isinstance(data, dict) and "entries" in data:
        return data, data["entries"], True
    if isinstance(data, list):
        return data, data, False
    raise SystemExit(f"unsupported JSON shape: {path}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--metrics", required=True, help="metrics.json with by_status_id")
    ap.add_argument(
        "--targets",
        nargs="*",
        default=["public/entries.json", "data/seed-entries.json", "seed-entries.json"],
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
        n = attach(entries, by_id, fetched_at)
        if wrapped:
            data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        else:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        print(f"{rel}: attached attention on {n}/{len(entries)} entries")


if __name__ == "__main__":
    main()
