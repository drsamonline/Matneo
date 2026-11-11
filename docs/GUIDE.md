# Matneo — shop guide

**Version 1.1.0 · MIT**

A static storefront: AI-powered digital products, planners, templates and offline browser tools. The
whole site is the shop — plain HTML, CSS and JavaScript, no build step, served from `docs/` on GitHub
Pages.

- Shop: <https://drsamonline.github.io/Matneo/>
- Products: <https://drsamonline.github.io/Matneo/products/>

## Adding a product

The catalogue is driven by **one data file**: `docs/data/products.json`. A new product is an edit
there, not a new page — the listing, the product page and the search all read the same file, which is
why they cannot disagree.

The blog is generated separately by `build_posts.py`; posts live under `docs/` and are rebuilt by the
same push that publishes the site.

## Why static

No build step, no framework, no database. The shop is a folder of files, which means it loads fast on
a bad connection, works when a JavaScript CDN is blocked, and cannot break because a dependency
released a major version. A catalogue of digital goods does not need a server; it needs pages that
open.

## For a buyer

Nothing here is installed. Products are downloads, and the free tools are pages that run in the
browser — offline, once loaded, with no account.

## Licence

MIT. See [LICENSE](../LICENSE).
