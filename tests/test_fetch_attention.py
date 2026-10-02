import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "fetch-attention.py"
SPEC = importlib.util.spec_from_file_location("fetch_attention", SCRIPT)
fetch_attention = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(fetch_attention)
FETCHED_AT = "2026-10-01T00:00:00Z"


class AttachTests(unittest.TestCase):
    def test_missing_metrics_leave_entries_unchanged(self):
        for url, by_id in [
            ("https://x.com/demo/status/123", {}),
            ("https://x.com/demo/status/123", {"456": {"like_count": 3}}),
            ("https://x.com/demo/status/123", {"123": {}}),
            ("https://x.com/demo/status/123", {"123": None}),
            ("https://x.com/demo/status/123", {"123": {"like_count": None}}),
            ("https://x.com/demo/status/123", {"123": {"unknown_count": 3}}),
            ("https://example.com/demo", {"123": {"like_count": 3}}),
            (None, {"123": {"like_count": 3}}),
        ]:
            for has_attention in (False, True):
                with self.subTest(url=url, by_id=by_id, has_attention=has_attention):
                    entry = {"source_url": url, "title": "Existing entry"}
                    if has_attention:
                        entry["attention"] = {
                            "fetched_at": "2026-09-06T07:00:00Z",
                            "metrics": {"impressions": 100, "likes": 2},
                        }
                    before = copy.deepcopy(entry)
                    self.assertEqual(fetch_attention.attach([entry], by_id, FETCHED_AT), 0)
                    self.assertEqual(entry, before)

    def test_partial_map_updates_only_matching_entry(self):
        entries = [
            {"source_url": "https://twitter.com/demo/status/123", "title": "Updated"},
            {"source_url": "https://x.com/demo/status/456", "attention": {"metrics": {"likes": 8}}},
        ]
        untouched = copy.deepcopy(entries[1])
        by_id = {"123": {
            "impression_count": "1000", "like_count": 3, "repost_count": 2,
            "reply_count": 1, "quote_count": 0, "bookmark_count": 4,
        }}
        self.assertEqual(fetch_attention.attach(entries, by_id, FETCHED_AT), 1)
        self.assertEqual(entries[0], {
            "source_url": "https://twitter.com/demo/status/123", "title": "Updated",
            "attention": {
                "platform": "x", "status_id": "123", "fetched_at": FETCHED_AT,
                "freshness": "ok",
                "metrics": {"impressions": 1000, "likes": 3, "reposts": 2,
                            "replies": 1, "quotes": 0, "bookmarks": 4},
                "derived": {"engage_per_1k_impr": 10.0},
            },
        })
        self.assertEqual(entries[1], untouched)

    def test_explicit_zero_updates_without_inventing_missing_counts(self):
        entry = {
            "source_url": "https://x.com/demo/status/123",
            "attention": {"metrics": {"likes": 8}, "derived": {"engage_per_1k_impr": 2.0}},
        }
        self.assertEqual(fetch_attention.attach([entry], {"123": {"like_count": 0}}, FETCHED_AT), 1)
        self.assertEqual(entry["attention"]["metrics"], {"likes": 0})
        self.assertNotIn("derived", entry["attention"])

    def test_invalid_metric_still_raises(self):
        entry = {"source_url": "https://x.com/demo/status/123", "attention": {"metrics": {"likes": 8}}}
        before = copy.deepcopy(entry)
        with self.assertRaises(ValueError):
            fetch_attention.attach([entry], {"123": {"like_count": "invalid"}}, FETCHED_AT)
        self.assertEqual(entry, before)


class CommandTests(unittest.TestCase):
    def test_empty_and_partial_refresh_for_both_document_shapes(self):
        for wrapped in (False, True):
            with self.subTest(wrapped=wrapped), tempfile.TemporaryDirectory() as directory:
                target = Path(directory) / "entries.json"
                metrics = Path(directory) / "metrics.json"
                entries = [
                    {"source_url": "https://x.com/demo/status/123", "attention": {"metrics": {"likes": 8}}},
                    {"source_url": "https://x.com/demo/status/456", "attention": {"metrics": {"likes": 9}}},
                    {"source_url": "https://example.com/demo"},
                ]
                document = {"entries": entries, "title": "Catalog"} if wrapped else entries
                target.write_text(json.dumps(document))
                for by_id, count in [({}, 0), ({"123": {"like_count": 3}}, 1)]:
                    metrics.write_text(json.dumps({"fetched_at": FETCHED_AT, "by_status_id": by_id}))
                    result = subprocess.run(
                        [sys.executable, str(SCRIPT), "--metrics", str(metrics), "--targets", str(target)],
                        capture_output=True, text=True,
                    )
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(result.stdout, f"{target}: attached attention on {count}/3 entries\n")
                    output = json.loads(target.read_text())
                    output_entries = output["entries"] if wrapped else output
                    self.assertEqual(output_entries[1:], entries[1:])
                    if count:
                        self.assertEqual(output_entries[0]["attention"]["metrics"], {"likes": 3})
                        self.assertEqual(output_entries[0]["attention"]["fetched_at"], FETCHED_AT)
                    else:
                        self.assertEqual(output_entries, entries)
                    if wrapped:
                        self.assertEqual(output["title"], "Catalog")
                        self.assertIn("updated", output)

    def test_invalid_input_fails_without_writing_target(self):
        for metrics_text, target_text in [
            ("not json", '[{"source_url": "https://x.com/demo/status/123"}]'),
            ('{"by_status_id": {"123": {"like_count": "invalid"}}}',
             '[{"source_url": "https://x.com/demo/status/123"}]'),
            ('{"by_status_id": {}}', '{"unsupported": []}'),
        ]:
            with self.subTest(metrics=metrics_text, target=target_text), tempfile.TemporaryDirectory() as directory:
                target = Path(directory) / "entries.json"
                metrics = Path(directory) / "metrics.json"
                target.write_text(target_text)
                metrics.write_text(metrics_text)
                result = subprocess.run(
                    [sys.executable, str(SCRIPT), "--metrics", str(metrics), "--targets", str(target)],
                    capture_output=True, text=True,
                )
                self.assertNotEqual(result.returncode, 0)
                self.assertTrue(result.stderr)
                self.assertEqual(target.read_text(), target_text)
                self.assertEqual(result.stdout, "")


if __name__ == "__main__":
    unittest.main()
