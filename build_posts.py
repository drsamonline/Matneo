#!/usr/bin/env python3
"""Generate docs/data/posts.json - one post per recently updated product repo.

Runs in GitHub Actions on a schedule (no PAT needed). The blog page renders
these, so new and updated apps appear automatically, with a link and an image.

    GH_TOKEN=... python3 build_posts.py
"""
import json, os, urllib.request, datetime

OWNER = "drsamonline"
# The store itself, the tooling, and the kits are not "posts".
EXCLUDE = {
    "drsamonline", "drsamonline.github.io", "app-builder", "skills", "profile-kit",
    "forge", "registry", "knowledge", "dashboard", "Matneo",
    # every kit is infrastructure, never a "post" (keep in sync with registry/deps.json)
    "web-kit", "optical-kit", "crypto-kit", "compress-kit", "lan-kit", "game-kit", "astro-kit",
    "repertory-kit", "search-kit", "srs-kit", "book-kit", "case-kit", "frame-kit", "export-kit",
}
MAX_POSTS = 24


def fetch(url):
    req = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github+json",
        "User-Agent": "forge-blog",
    })
    tok = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if tok:
        req.add_header("Authorization", "Bearer " + tok)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def first_sentence(s):
    s = (s or "").strip()
    for end in (". ", "! ", "? "):
        if end in s:
            return s.split(end)[0] + end.strip()
    return s


def main():
    repos = fetch("https://api.github.com/users/%s/repos" % OWNER)
    posts = []
    for r in repos:
        n = r["name"]
        if n in EXCLUDE or r.get("fork"):
            continue
        desc = (r.get("description") or "").strip()
        posts.append({
            "title": first_sentence(desc) or n,
            "repo": n,
            "category": "App update",
            "date": (r.get("pushed_at") or "")[:10],
            "summary": desc,
            "url": r.get("homepage") or ("https://drsamonline.github.io/%s/" % n),
            "source": r.get("html_url"),
            "image": "https://drsamonline.github.io/assets/shots/%s.webp" % n,
            "kind": "update",
        })
    posts.sort(key=lambda p: p["date"], reverse=True)
    posts = posts[:MAX_POSTS]
    data = {"generated": datetime.date.today().isoformat(), "posts": posts}
    with open("docs/data/posts.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    print("wrote posts.json:", len(posts), "posts")


if __name__ == "__main__":
    main()
