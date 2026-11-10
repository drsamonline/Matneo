# Changelog

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
