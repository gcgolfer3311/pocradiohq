# PocRadioHQ — Review Publishing Checklist

Why reviews "disappear": a finished review file in `reviews/` builds fine and is
reachable by direct URL, but without the steps below it's an **orphan page** —
not in the sitemap, not linked anywhere on the site, invisible to Google and
to visitors browsing normally.

## Every time you publish a new review

- [ ] **1. File goes in `reviews/`** — e.g. `reviews/brand-model-review.html`.
      Never in a root-level folder, never in `data/`.
- [ ] **2. Photo goes in `images/`** — e.g. `images/brand_model_pic.png`.
      Reference it in the review as `../images/brand_model_pic.png`.
- [ ] **3. Run `node build.js` locally (or let Netlify build) and check the log**
      for `Standalone review override: <your file>.html`. If it's missing,
      the file isn't in the right folder.
- [ ] **4. Sitemap — now automatic.** `build.js` auto-detects any review in
      `reviews/` that isn't in `data/reviews.json` and adds it to
      `sitemap.xml` itself (fixed Aug 2026). Confirm with:
      `grep "your-slug" dist/sitemap.xml` after building.
- [ ] **5. Add a pick card to `data/homepage.html` — still manual, always will be.**
      Copy an existing `<h3><a href="./reviews/...">...</a></h3>` block in the
      picks grid, update the name/badge/price/blurb, point the link at your
      new review's filename. This is the step that's easiest to forget because
      nothing errors if you skip it — the page just never shows up in the grid.
- [ ] **6. (Optional but recommended) Add an entry to `data/reviews.json`**
      even though the standalone file overrides the auto-generated page.
      This keeps the review in the Organization/ItemList schema on the
      homepage and in any future logic that reads `reviews.json` directly.
- [ ] **7. Cross-link it** — add it to the "Compare with other POC radios"
      block at the bottom of 2–3 related existing reviews, same pattern as
      the `related` div in any review file.
- [ ] **8. Push to GitHub in the correct folders**, then confirm the Netlify
      build log shows the same `Standalone review override:` and
      `Auto-added to sitemap:` lines before considering it done.

## Quick sanity check after any publish

```
node build.js
grep -c "<url>" dist/sitemap.xml      # should go up by 1 vs last count
grep "your-slug" dist/sitemap.xml     # should return a match
grep "your-slug" dist/index.html      # should return a match (homepage link)
```

If either grep comes back empty, the review is still an orphan — go back to
step 4 or step 5.
