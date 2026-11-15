# Changelog

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
