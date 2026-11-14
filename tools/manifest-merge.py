#!/usr/bin/env python3
"""manifest-merge — merge two MANIFEST.json registers instead of replacing one.

WHY THIS EXISTS

`commit-and-verify.sh` lands a run's bytes by resetting to the remote tip and
copying this run's files back on top. That is right for a generated data file and
wrong for MANIFEST.json, because the manifest is a SHARED register: every run
carries a whole copy of it and records only its own paths.

So two runs in flight undo each other. It is not hypothetical — it happened on
2026-11-14: a store run recorded `docs/data/products.json` as
`e6e1436 … at 07:04:35` and landed it, and the blog run beside it (started before,
finished after) laid its own older copy over the top, putting `d627977 … 07:04:12`
back. The catalogue drift that two PRs had just fixed was back within the minute,
and it would come back on every pair of overlapping runs for ever.

The merge is per path, newest record wins, which is the only rule that makes sense
for an append-only register written by independent producers. Nothing is deleted:
a path only one side knows about is kept.

    python3 tools/manifest-merge.py <base.json> <theirs.json> [out.json]

`base` is what is on the branch now, `theirs` is what this run produced, `out`
defaults to `base`. Exits 0 on success, 1 on an unreadable/unparseable input (the
caller then keeps its own copy rather than writing a half-merged register).
"""
import json
import sys


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def merge(base, theirs):
    """Newest `at` wins, per path. Top-level keys are kept from `theirs`."""
    out = dict(theirs)
    files = dict(base.get("files") or {})
    for path, entry in (theirs.get("files") or {}).items():
        old = files.get(path)
        if old is None:
            files[path] = entry
            continue
        # ISO-8601 UTC sorts lexicographically; a missing `at` loses to a real one.
        if str(entry.get("at") or "") >= str(old.get("at") or ""):
            files[path] = entry
    out["files"] = files
    # A lock is a fact about the repository, not about one run: never lose it.
    out["locked"] = bool(base.get("locked")) or bool(theirs.get("locked"))
    stamps = [str(x.get("updated") or "") for x in (base, theirs)]
    out["updated"] = max(stamps) if any(stamps) else theirs.get("updated")
    return out


def self_test():
    """The lost update from 2026-11-14, both orders, plus what must never be lost."""
    base = {"schema": 1, "locked": False, "updated": "2026-11-14T07:04:12Z", "files": {
        "docs/data/products.json": {"sha": "d627977cb379", "at": "2026-11-14T07:04:12Z"},
        "README.md": {"sha": "aaa", "at": "2026-11-04T19:38:57Z"}}}
    theirs = {"schema": 1, "locked": False, "updated": "2026-11-14T07:04:35Z", "files": {
        "docs/data/products.json": {"sha": "e6e143671e09", "at": "2026-11-14T07:04:35Z"}}}
    checks = [
        ("the newer record wins", merge(base, theirs)["files"]["docs/data/products.json"]["sha"] == "e6e143671e09"),
        ("a stale run cannot revert it", merge(theirs, base)["files"]["docs/data/products.json"]["sha"] == "e6e143671e09"),
        ("a path only the branch knows survives", merge(base, theirs)["files"]["README.md"]["sha"] == "aaa"),
        ("a path only this run knows is kept", merge(theirs, base)["files"]["docs/data/products.json"]["sha"] == "e6e143671e09"),
        ("updated is the newest of the two", merge(base, theirs)["updated"] == "2026-11-14T07:04:35Z"),
        ("a lock is never lost", merge({"schema": 1, "locked": True, "files": {}}, theirs)["locked"] is True),
    ]
    bad = 0
    for name, ok in checks:
        print(("PASS  " if ok else "FAIL  ") + name)
        bad += 0 if ok else 1
    print("\n%d passed, %d failed" % (len(checks) - bad, bad))
    return 1 if bad else 0


def main(argv):
    if argv[:1] == ["--self-test"]:
        return self_test()
    if len(argv) not in (2, 3):
        print(__doc__.strip().splitlines()[-1], file=sys.stderr)
        return 1
    base_path, theirs_path = argv[0], argv[1]
    out_path = argv[2] if len(argv) == 3 else base_path
    try:
        merged = merge(load(base_path), load(theirs_path))
    except Exception as e:
        print("manifest-merge: %s: %s" % (type(e).__name__, e), file=sys.stderr)
        return 1
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(merged, f, indent=2, sort_keys=True)
        f.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
