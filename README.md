# Copy Branch

A tiny Chrome extension that adds a one-click **copy** button next to every
branch in GitHub's branch switcher dropdown. Click it → the branch name lands on
your clipboard. No more selecting and copying the name by hand.

## Features

- Copy button on each branch row in the branch picker (the "Switch branches/tags"
  dropdown on a repo's code page).
- A brief ✓ confirmation when copied.
- Works with the live, virtualized branch list — buttons reappear as you scroll
  or filter.
- Zero dependencies, no build step, no tracking.

## Install (load unpacked)

1. Open `chrome://extensions` in Chrome.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this `copy-branch` folder.
4. Open any GitHub repo, click the branch dropdown — each branch now has a copy
   button on the right.

To update after pulling changes, click the **reload** icon on the extension card.

## How it works

The extension is a single content script (`src/content.js`) that runs on
`github.com`. GitHub renders the branch list as a virtualized React component,
so the script:

1. Watches the DOM with a `MutationObserver` and injects a copy button into each
   branch row (idempotently).
2. Reads the branch name **fresh at click time** from the row, because the list
   recycles row elements as you scroll/filter.
3. Writes the name to the clipboard and flashes a ✓.

Output formatting goes through a single `formatBranch(name, format)` seam, so
adding more formats later (e.g. `git checkout <branch>`, branch URL) is additive.

## Project layout

```
copy-branch/
├── manifest.json     # MV3 config
├── src/
│   ├── content.js    # observer + button injection + copy logic
│   └── styles.css    # button styling
├── icons/            # 16 / 48 / 128 px icons
└── docs/             # design doc
```

## Notes

GitHub's markup changes over time. The fragile part — the branch-row selector
and name extraction — is isolated in `getBranchName()` and the
`BRANCH_ITEM_SELECTOR` constant in `src/content.js`, so a future markup change is
a one-spot fix.
# copy-branch
# copy-branch
