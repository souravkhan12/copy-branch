// Copy Branch — content script
// Adds a copy button to each branch row in GitHub's branch switcher dropdown.
// The branch list is a virtualized React component, so we:
//   1. Observe the DOM and re-inject on every relevant mutation (React recycles rows).
//   2. Read the branch name FRESH at click time (a recycled row may now show a
//      different branch than when the button was first injected).

const BTN_CLASS = "cb-copy-branch-btn";
const COPIED_CLASS = "cb-copied";
// Marks a row whose layout we've adjusted to reserve space for the button.
const ROW_CLASS = "cb-has-copy-btn";
const BRANCH_ITEM_SELECTOR =
  'li[role="menuitemradio"][data-component="ActionList.Item"]';

// Single seam for output formatting. v1 only emits the plain name; future
// formats (git checkout command, branch URL, …) slot in here with no other
// changes to the injection/observer code.
function formatBranch(name, format = "name") {
  switch (format) {
    case "name":
    default:
      return name;
  }
}

// Branch rows carry a HighlightedText element holding just the ref name; the
// "default" badge is a sibling, so reading HighlightedText excludes it.
function getBranchName(item) {
  const highlighted = item.querySelector('[class*="HighlightedText"]');
  if (highlighted) return highlighted.textContent.trim();
  const label = item.querySelector('[id$="--label"]') || item;
  const clone = label.cloneNode(true);
  clone.querySelectorAll('[class*="prc-Label-Label"]').forEach((node) => node.remove());
  return clone.textContent.trim();
}

function isBranchItem(item) {
  return (
    item.matches(BRANCH_ITEM_SELECTOR) &&
    item.querySelector('[class*="HighlightedText"]') !== null
  );
}

function copyIconSvg() {
  return (
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
    '<path fill="currentColor" d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>' +
    '<path fill="currentColor" d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>' +
    "</svg>"
  );
}

function checkIconSvg() {
  return (
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
    '<path fill="currentColor" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>' +
    "</svg>"
  );
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for contexts where the async clipboard API is unavailable.
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    textarea.remove();
    return ok;
  }
}

function flashCopied(button) {
  button.classList.add(COPIED_CLASS);
  button.innerHTML = checkIconSvg();
  button.setAttribute("aria-label", "Copied!");
  window.setTimeout(() => {
    button.classList.remove(COPIED_CLASS);
    button.innerHTML = copyIconSvg();
    button.setAttribute("aria-label", "Copy branch name");
  }, 1200);
}

async function handleCopyClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const button = event.currentTarget;
  const item = button.closest(BRANCH_ITEM_SELECTOR);
  if (!item) return;
  const name = formatBranch(getBranchName(item), "name");
  if (!name) return;
  const ok = await copyToClipboard(name);
  if (ok) flashCopied(button);
}

function createCopyButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = BTN_CLASS;
  button.innerHTML = copyIconSvg();
  button.setAttribute("aria-label", "Copy branch name");
  button.title = "Copy branch name";
  // Stop the menu's own handlers from selecting/navigating or closing.
  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  button.addEventListener("click", handleCopyClick);
  return button;
}

function injectButtons() {
  const items = document.querySelectorAll(BRANCH_ITEM_SELECTOR);
  for (const item of items) {
    if (!isBranchItem(item)) continue;
    if (item.querySelector("." + BTN_CLASS)) continue;
    if (getComputedStyle(item).position === "static") {
      item.style.position = "relative";
    }
    // Reserve space on the right so the branch name / "default" badge stop
    // before the button instead of running underneath it.
    item.classList.add(ROW_CLASS);
    item.appendChild(createCopyButton());
  }
}

// Coalesce bursts of mutations into one injection pass per frame.
let scheduled = false;
function scheduleInject() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    injectButtons();
  });
}

function start() {
  injectButtons();
  const observer = new MutationObserver(scheduleInject);
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
