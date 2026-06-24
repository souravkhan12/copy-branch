# Copy Branch — Chrome Extension Design

**Date:** 2026-06-22
**Status:** Approved (pending spec review)

## Problem

Existing "copy branch name" extensions on the Chrome Web Store don't do what's
needed. We want a one-click way to copy a branch's name straight from GitHub's
branch switcher dropdown on a repo's code page.

## Goal (v1)

Add a small copy icon next to each branch in GitHub's branch dropdown. Clicking
it copies that branch's **name** to the clipboard, with a brief "Copied!"
confirmation.

## Non-Goals (v1)

- git command / URL formats (architected for, not shipped — see Extensibility)
- Branches page (`/branches`), PR header, or right-click context menu
- GitLab / Bitbucket support
- Any build step, framework, or external dependency

## Approach

GitHub's branch switcher is dynamically injected when opened, so the extension
is a **content script** (Manifest V3) that:

1. Runs a `MutationObserver` on the page to detect when the branch dropdown /
   its branch rows are added to the DOM.
2. Injects a copy button into each branch row (idempotently — never double-inject).
3. On click: reads the branch name from the row, writes it via
   `navigator.clipboard.writeText`, and shows a transient "Copied!" tooltip.

Plain vanilla JS + CSS. No build, no bundler. Load unpacked.

## File Structure

```
copy-branch/
├── manifest.json        # MV3; matches https://github.com/*; registers content script + css
├── src/
│   ├── content.js       # observer, button injection, copy logic, tooltip
│   └── styles.css       # copy button + tooltip styling
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── docs/
│   └── 2026-06-22-copy-branch-design.md
└── README.md            # how to load unpacked + usage
```

## Key Components

- **`observeBranchMenu()`** — sets up the `MutationObserver`; on relevant
  mutations calls `injectButtons()`.
- **`injectButtons()`** — finds branch rows lacking a copy button and adds one;
  marks rows with a data attribute to stay idempotent.
- **`getBranchName(row)`** — extracts the clean branch name from a row.
- **`formatBranch(name, format)`** — single formatting seam. v1 only handles
  `"name"`; future formats (`"git-checkout"`, `"url"`) slot in here.
- **`copyToClipboard(text)` + `showCopiedTooltip(el)`** — clipboard write +
  visual confirmation.

## Risk: GitHub DOM selectors

GitHub markup changes over time and the branch-row selector is the fragile part.
Mitigation: keep the selector logic isolated in `getBranchName()` /
`injectButtons()` so a future markup change is a one-spot fix. The actual
selectors will be confirmed against live GitHub DOM during implementation.

## Extensibility

The `formatBranch(name, format)` seam means adding a multi-format menu later is
additive: add menu items + new format cases, no rearchitecting of the
injection/observer code.

## Testing (manual)

1. Load unpacked in `chrome://extensions` (Developer mode on).
2. Open any GitHub repo's code page, open the branch dropdown.
3. Confirm a copy icon appears on each branch row.
4. Click → branch name is on clipboard, "Copied!" tooltip shows.
5. Open/close the dropdown repeatedly → no duplicate buttons.
