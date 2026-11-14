#!/usr/bin/env bash
# commit-and-verify - the verdict is "did the data land?", not "did git exit 0".
#
# SPDX-FileCopyrightText: 2026 Dr Sohil Momin
# SPDX-License-Identifier: LicenseRef-Forge-Proprietary
#
# WHY THIS EXISTS (F-97)
#
# A commit step is the one step that can fail AFTER the work succeeded. Three times
# in two days a workflow put its file on the branch correctly and concluded
# `failure` anyway: forge/kit-audit.yml once, dashboard/refresh.yml twice. The
# conclusion described the last non-zero exit; the artifact described what reached
# the branch. Those are different questions and the run reported only the first.
#
# A red run that did its job teaches people to ignore red runs. So this script
# separates the two:
#
#   1. Record the blob sha of every file we intend to land.
#   2. Commit and push, retrying with backoff when the branch moves under us.
#   3. THEN ASK THE BRANCH. Fetch it and compare each file's blob sha with the one
#      recorded in step 1. Success is equality. Nothing else counts.
#
# Consequences, both intended:
#   * A push that failed because another run landed identical content is a SUCCESS.
#     The data is there; who pushed it does not matter.
#   * A commit that succeeded locally but never reached the branch is a FAILURE,
#     even though every git command exited 0.
#   * Red now means exactly one thing in this estate: the data is not on the branch.
#
# Usage:
#   tools/commit-and-verify.sh "<commit message>" [branch] -- <path> [path...]
#
# Exit codes:
#   0  every named file that existed is present on the branch with the intended bytes
#   1  at least one file is missing or differs on the branch, or nothing was produced
#   2  usage error
#
# A file that does not exist locally is NOT a failure here - a workflow that
# legitimately produces a subset of its outputs must not fail on the rest. It is
# reported as a warning, and it is not part of the equality check.

set -uo pipefail

if [ "$#" -lt 4 ]; then
  echo "usage: commit-and-verify.sh \"<message>\" [branch] -- <path> [path...]" >&2
  exit 2
fi

MSG="$1"; shift
if [ "$1" = "--" ]; then
  BR="${GITHUB_REF_NAME:-main}"
else
  BR="$1"; shift
fi
[ "${1:-}" = "--" ] && shift
PATHS=("$@")

if [ "${#PATHS[@]}" -eq 0 ]; then
  echo "::error::commit-and-verify: no paths given" >&2
  exit 2
fi

git config user.name  >/dev/null 2>&1 || git config user.name  "${GIT_AUTHOR_NAME:-forge-agent}"
git config user.email >/dev/null 2>&1 || git config user.email "${GIT_AUTHOR_EMAIL:-forge-agent@users.noreply.github.com}"

# ---- 1. what we intend to land -------------------------------------------------
MANIFEST="$(mktemp)"
present=0
for f in "${PATHS[@]}"; do
  # -f, not -e: a DIRECTORY passed here would make `git hash-object` fail and be
  # recorded as an empty sha, which the verdict would then report as "did not land" -
  # a false red. intake.yml legitimately stages a path that may be a directory, so
  # this must warn and skip rather than lie.
  if [ -f "$f" ]; then
    printf '%s %s\n' "$(git hash-object -- "$f")" "$f" >> "$MANIFEST"
    present=$((present+1))
  else
    echo "::warning::$f is not a regular file (missing, or a directory) - not verified"
  fi
done

if [ "$present" -eq 0 ]; then
  echo "::error::this run produced none of the files it was supposed to produce"
  rm -f "$MANIFEST"
  exit 1
fi

git add -- "${PATHS[@]}" 2>/dev/null || true

# NOT an early exit. "Nothing staged" does NOT mean "the data is on the branch" -
# it can also mean the add failed. This shortcut used to `exit 0` here, which is the
# same disease in miniature: claiming success without asking the branch. It now falls
# through to the verdict below, which is the only thing allowed to say yes.
if git diff --staged --quiet; then
  echo "nothing staged - skipping commit and push, going straight to the verdict"
else
  git commit -q -m "$MSG" || { echo "::error::git commit failed"; rm -f "$MANIFEST"; exit 1; }
  echo "committed: $MSG"

  # Recompute the expected blob sha for one path, after this run deliberately wrote
# something other than the bytes it first recorded (the manifest merge below).
set_expected() {
  local p="$1" sha tmp
  sha="$(git hash-object -- "$p")" || return 1
  tmp="$(mktemp)"
  while read -r w q; do
    [ -n "${q:-}" ] || continue
    if [ "$q" = "$p" ]; then printf '%s %s\n' "$sha" "$q" >> "$tmp"
    else printf '%s %s\n' "$w" "$q" >> "$tmp"; fi
  done < "$MANIFEST"
  mv "$tmp" "$MANIFEST"
}

# ---- 2. land the bytes on the branch, retrying when it moves under us ---------
  # A rebase CANNOT fix this one. The file is generated on both sides, so a rebase
  # conflicts on docs/data/posts.json every single time - which is exactly what
  # happened: six attempts, six identical failures, red for days. Retrying a
  # conflict is not a retry strategy.
  #
  # The generated file is ours to write, so the branch is reset to the remote tip
  # and our bytes are laid back on top of it. There is nothing left to conflict
  # with, and if a concurrent run already landed identical bytes the commit is
  # empty and the verdict below says so without a push.
  STAGE="$(mktemp -d)"
  for f in "${PATHS[@]}"; do
    if [ -f "$f" ]; then
      mkdir -p "$STAGE/$(dirname "$f")"
      cp -p "$f" "$STAGE/$f"
    fi
  done

  pushed=0
  attempt=0
  for wait in ${CV_BACKOFF:-0 4 8 16 30 30}; do
    attempt=$((attempt+1))
    [ "$wait" = "0" ] || sleep "$wait"
    if ! git fetch origin "$BR" --quiet 2>/dev/null; then
      echo "::warning::fetch of origin/$BR failed on attempt $attempt"
      continue
    fi
    if ! git reset --hard "origin/$BR" >/dev/null 2>&1; then
      echo "::warning::could not reset onto origin/$BR on attempt $attempt"
      continue
    fi
    for f in "${PATHS[@]}"; do
      if [ -f "$STAGE/$f" ]; then
        mkdir -p "$(dirname "$f")"
        cp -p "$STAGE/$f" "$f"
      fi
    done
    # A SHARED REGISTER IS NOT A GENERATED FILE.
    #
    # Everything above is right for a file this run alone produces, and wrong for
    # MANIFEST.json: every run carries a whole copy of it and records only its own
    # paths, so laying one copy wholesale over another is a lost update. On
    # 2026-11-14 a store run recorded docs/data/products.json as e6e1436 at
    # 07:04:35 and landed it; the blog run beside it - started before, finished
    # after - laid its older copy back on top and put d627977 (07:04:12) back. The
    # drift two PRs had just fixed returned within the minute, and would have
    # returned on every pair of overlapping runs.
    #
    # So for a manifest the two copies are MERGED, per path, newest record wins.
    # Nothing is deleted: a path only the branch knows about is kept.
    for f in "${PATHS[@]}"; do
      case "$f" in
        *MANIFEST.json)
          if [ -f "$STAGE/$f" ]; then
            BASE="$(mktemp)"
            if git show "origin/$BR:$f" > "$BASE" 2>/dev/null && [ -s "$BASE" ] \
               && ! cmp -s "$BASE" "$STAGE/$f"; then
              if python3 tools/manifest-merge.py "$BASE" "$STAGE/$f" "$f"; then
                # The merged file is deliberately NOT the bytes this run computed, so
                # the verdict must expect the merged bytes - otherwise a successful
                # merge reads as "the data never landed" and the run goes red for
                # doing the right thing. (It did exactly that at 07:14 on 2026-11-14.)
                set_expected "$f" || echo "::warning::could not re-record the expected sha for $f"
                echo "merged $f with the branch's copy (per path, newest record wins)"
              else
                echo "::warning::manifest merge failed - keeping this run's copy of $f"
                cp -p "$STAGE/$f" "$f"
              fi
            fi
            rm -f "$BASE"
          fi ;;
      esac
    done
    git add -- "${PATHS[@]}" 2>/dev/null || true
    if git diff --staged --quiet; then
      echo "attempt $attempt: origin/$BR already carries these bytes - nothing to push"
      pushed=1
      break
    fi
    git commit -q -m "$MSG" || { echo "::warning::commit failed on attempt $attempt"; continue; }
    if git push origin "HEAD:$BR" 2>&1 | tail -3; then
      echo "pushed on attempt $attempt"
      pushed=1
      break
    fi
    echo "::warning::push rejected on attempt $attempt - the branch moved again"
  done
  rm -rf "$STAGE"
  if [ "$pushed" -ne 1 ]; then
    echo "::warning::could not push after $attempt attempts. Not failing yet -"
    echo "::warning::the data may still be on the branch, committed by a concurrent run. Checking."
  fi
fi

# ---- 3. the verdict: ask the branch -------------------------------------------
git fetch origin "$BR" --quiet 2>/dev/null || true

missing=0
while read -r want path; do
  [ -n "$path" ] || continue
  got="$(git rev-parse "origin/$BR:$path" 2>/dev/null || echo "absent")"
  if [ "$got" = "$want" ]; then
    echo "landed: $path"
  else
    echo "::error::$path is NOT on origin/$BR with the bytes this run computed"
    echo "::error::  intended ${want}"
    echo "::error::  found    ${got}"
    missing=$((missing+1))
  fi
done < "$MANIFEST"
rm -f "$MANIFEST"

if [ "$missing" -eq 0 ]; then
  echo "VERIFIED: every file this run produced is on origin/$BR. This is what success means here."
  exit 0
fi

echo "::error::$missing file(s) did not reach origin/$BR. Red means the data is missing - that is the whole rule."
exit 1
