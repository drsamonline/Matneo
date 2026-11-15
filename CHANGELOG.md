# Changelog

## 2.1.1 — 2026-11-15

### Fixed — the paperback now has its own page on Amazon, and the entry says so

The print edition's ASIN is `B0HRJTCD79`, found by running the search with Amazon's paperback binding
filter rather than a keyword search: unfiltered, Amazon merges both formats onto the Kindle's
identifier in a single result card, which is why the earlier passes kept returning `B0HQP2K44S`.
The paperback entry now links straight to its own listing instead of to the shared page with a
"choose Paperback" label.

Checking the listing corrected three things the entry had wrong, all inherited from the Kindle page:
the print edition is **750 pages**, not the ebook's 1,104; it was published **10 November 2026**,
four days after the ebook; and it carries **ISBN 979-8140354640** at 6 × 1.69 × 9 in, 2.7 lb. The
cover is the print artwork rather than the Kindle thumbnail.

## 2.1.0 — 2026-11-15

### Added — a front page with a point of view

The home page opened with the same soft gradient every other page had. It now opens on an ink band:
a deep indigo field, one oversized serif line — *Written, built and sold by one person* — and a
fanned stack of the three things actually on sale, each carrying its own price. Below it a ticker
runs the catalogue titles across the fold, then the page returns to paper for the categories and the
featured products. The hero's counts are read from `products.json`, and "Titles published" counts
distinct ASINs, so a book with two editions is one book rather than two.

### Changed — a product page wears the colour of what it sells

Every product page used one copper accent. A book, a course and a software licence are not the same
kind of object, so the detail page now reads the product's category and sets `data-tone` on the body:
books take amber, the NTET course takes academic blue, licences take indigo, and the copper stays as
the fallback. Dark-mode counterparts are defined for each.

### Changed — the mark and the favicon

The old mark was a constellation of dots that turned to mush at 16px. The new one is a monogram: a
gradient tile with an M drawn in a single stroked path, which survives being scaled down. It is
applied everywhere the brand appears, and `favcon.ico` was rebuilt from it at 16/32/48/64 —
it had been a 428 KB file, which is a strange weight for an icon nobody sees at full size. Now 4.9 KB.
`assets/icon-192.png`, `icon-512.png` and `apple-touch-icon.png` are generated from the same source,
and every page links the SVG, the ICO and the touch icon.

### Fixed — the paperback said it was a Kindle edition

The product page's price line keyed off `type: "book"` alone, so the $39.00 paperback was labelled
"Kindle edition · priced in USD on Amazon". It now reads `format` and says Paperback.

## 2.0.0 — 2026-11-15

### Rebuilt — one design system, six identities

The site had one palette (violet → blue) applied to every page, so the shop, the blog and the
downloads page were the same design wearing the same colours. `docs/css/style.css` is now a token
system — type scale, spacing, radii, depth, motion — with the accent set per section on
`<body data-section="...">`: indigo for home, teal for the store, copper for a product page, rose
for the blog, cyan for the free resources, slate for 404. The bones stay put; only the colour
changes, which is what keeps six palettes reading as one shop. Headings moved to a display serif
against a sans body, and the glassmorphism gave way to hairline borders and paper-toned surfaces.

The course page at `ntet/` keeps its own layout — it is a product landing page, not a shop page —
but moved from the shop's violet to an academic blue so a shared link reads as a course.

### Fixed — the books were missing from the home page, and the reason was structural

The home page listed six categories by hand — HTML Apps, Homeopathy, Health Tools, Games,
Utilities, Data — every one of them at "0 products", while the three categories that actually had
stock (licences, the course, the books) had no card at all. A hand-written list of categories goes
stale the first time a product is added, so the grid is now generated from `data/products.json`:
whatever is in the catalogue is what the home page offers, sorted by how much of it there is. The
hero's product count is read from the same file instead of being the literal `6`.

### Fixed — every link that pointed at nothing

- `docs/free/` was deleted in the 2026-11-05 audit but the product page still linked to it as
  "All free apps" for open-source products. It now goes to the hub, in a new tab.
- Four footers linked to Templates, AI Resources and Printables — categories that no longer exist.
  They now point at Books (ebooks), Books (paperbacks), Education and Licences.
- The FAQ, the JSON-LD `FAQPage` block and the hero copy all described the old six categories, and
  the hero's mock browser panel advertised three prices for products that are not for sale.
- `404.html` referenced `/Matneo/…` for its icon and nothing at all for its stylesheet, so it
  rendered as unstyled HTML whenever the base path moved. It is self-contained again.
- `sitemap.xml` was missing the NTET page.

### Fixed — three rendering bugs found while checking the work

- **`--acc-grad` was resolved in the wrong place.** A custom property is computed on the element
  that declares it, not where it is used, so the gradient declared once on `:root` with `var(--acc)`
  inside baked in the home accent and every section inherited violet buttons. Each section now
  composes its own gradient.
- **The star rating had no styles at all.** `ratings.js` emits `.rating`, `.rating__star`,
  `.rating-box` and friends; nothing ever targeted them, so five default browser buttons rendered
  under every card. They are styled now.
- **The theme button threw on load.** Four pages called `themeLabel.textContent` against an element
  that does not exist, so the first `sync()` raised before it could set `aria-pressed`.

## 1.2.0 — 2026-11-15

### Added — the books are in the store, as a publication section of their own

The shop sold licences and one course; the books lived only behind a link to an Amazon author
store, which is a page the reader has to leave to discover anything. All five titles are now
catalogue entries like every other product: cover, price, description, format, page count, ASIN
and a direct link to the edition on sale.

They are filed under two categories rather than one, because a paperback and a Kindle edition are
different products with different prices, and a reader filtering the shop wants one or the other:
`Publication — Ebooks` and `Publication — Paperbacks`. Five of the six entries are Kindle today;
Open Materia Medica exists in both, so it appears twice — $3.18 as a Kindle edition and $39.00
in print. The two are separate catalogue entries, not one entry with two buttons, because a
reader filtering for print should not have to open a Kindle listing to find the paperback.

Two rendering fixes came with it. Book covers are served by the retailer's image CDN, which
refuses a referrer from another origin and answers with nothing, so the card fell back to its
category icon; images now load with `referrerpolicy="no-referrer"`. And the product detail page
used to tell every non-open-source visitor that they would get "one-time · instant digital
delivery" — true for a licence, wrong for a book that Amazon ships, so a book now says what it is
and notes that the price shown is the list price in US dollars.

One limitation is recorded here rather than hidden: Amazon does not expose the print edition's own
ASIN to any of the scrapers used here — the search card carries both formats but only the Kindle
ASIN — so the paperback entry links to the shared product page, where Paperback is the second
option, and its button says so. Swap in the direct `/dp/` link when the ASIN is to hand.

## 1.1.0 — 2026-11-10

### Fixed — the blog refresh had been red for days, and the retry loop was the bug

`Refresh blog posts` failed on every run while `Refresh store catalogue` beside it passed, and the
log said the same thing each time: *rebase onto origin/main failed on attempt 1 … 6*, then *the
bytes on main are not the bytes this run computed*.

The rebase was never going to work. `docs/data/posts.json` is **generated on both sides**, so a
rebase conflicts on that file every time — and a retry loop that repeats a conflict is not a retry
strategy. Giving the checkout a full history (2026-11-06) removed one cause and left this one
standing.

`tools/commit-and-verify.sh` now lands the bytes instead of rebasing them: fetch, reset to
`origin/$BR`, copy this run's generated files back on top, commit, push. There is nothing left to
conflict with, and if a concurrent run already landed identical bytes the commit is empty and the
verdict passes without a push. The verdict itself is unchanged — red still means exactly one thing,
that the data is not on the branch.

### Added

- A support block in the README and on the landing page: UPI, Ko-fi, PayPal, the author's other
  books, the project index and the email address.

## 1.0.0 — 2026-10-25

- **Licence: PolyForm Noncommercial 1.0.0.** Every repository now carries the canonical text
  from polyformproject.org with the Required Notice line, and the four places a repo states
  its licence agree: LICENSE, the SPDX headers, the README and package.json.
- **The public demo is the app.** A build now fails if `docs/play/index.html` is not the app,
  because a demo running older code is two code paths for one program.
