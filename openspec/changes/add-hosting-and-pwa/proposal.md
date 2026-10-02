# Proposal

## Why

The app only runs on the machine that has the repo checked out and `npm run serve`
running, so it cannot be used on other computers or shared with other people. A
GitHub Pages workflow exists but has never deployed: the repository is private and
Pages is not enabled, so there is no URL to open.

Once other people use it, their tasks live only in their browser's storage: clearing
site data deletes a board for good, and there is no way to carry a board to another
computer. A file export and import gives both a backup and a manual way to move.

## What Changes

- Publish the app at a public URL on GitHub Pages
  (`https://lucijanblagonic.github.io/productivity-decision-matrix/`). This requires
  making the repository public and enabling Pages with GitHub Actions as the source.
- Make the app installable as a Progressive Web App: a web app manifest and an app
  icon, so browsers offer "Install" and the app opens in its own window.
- Make the app work offline after the first visit, using a service worker that
  caches the app's own files.
- Make sure a new deploy is picked up on the next online load, rather than being
  hidden behind the offline cache.
- Add **Export** and **Import** to Settings. Export saves all tasks to a JSON file
  on the user's device. Import reads such a file and, after a confirmation that
  states how many tasks will be replaced and how many will be loaded, **replaces**
  the board with it. Files that are invalid or from a newer version are rejected
  and change nothing. Tasks only; preferences are not included. No network involved.
- Add **Copy** and **Paste** next to them: Copy puts the same content on the
  clipboard as text, and Paste imports from the clipboard with the same confirmation
  and the same checks. This makes moving a board between an iPhone and a Mac a
  copy on one and a paste on the other, using Apple's shared clipboard.
- Document the live URL, how to install the app, that each browser keeps its own
  separate board, and how to back up or move a board with export/import or
  copy/paste.

Not in this change: automatic syncing between computers, merging an imported file
into an existing board, a Chrome new-tab extension, or any backend. How tasks are
stored is unchanged.

## Capabilities

### New Capabilities
- `installable-app`: how the app is reached and installed — available at a public
  URL, installable as a standalone app, usable offline after the first visit, and
  kept up to date when a new version is deployed.

### Modified Capabilities
- `data-persistence`: adds requirements for exporting tasks to a file, importing
  tasks from a file (replace, with confirmation and a kept backup), doing the same
  through the clipboard, and rejecting content that cannot be used. Existing requirements, including "Data stays local",
  are unchanged; the service worker only caches the app's own static files and
  never touches task data.

## Impact

- **New files**: `manifest.webmanifest`, `sw.js`, `icons/` (SVG sources and PNG
  renders), `scripts/render-icons.mjs` (dev-only), `src/core/transfer.js`,
  `src/ui/data-transfer.js`, `tests/unit/sw-precache.test.js`,
  `tests/unit/transfer.test.js`, `tests/e2e/pwa.spec.js`,
  `tests/e2e/transfer.spec.js`.
- **Edited files**: `index.html` (manifest, icon and theme-color tags; a "Data"
  section in Settings), `src/main.js` (service worker registration; wiring
  export/import), `src/core/store.js` (replace all tasks in one step),
  `styles/dialog.css` (Data section), `src/ui/theme.js` (keep the browser
  theme colour in step with a manual theme choice), `.github/workflows/pages.yml`
  (deploy the new files), `playwright.config.js` (block service workers in existing
  specs), `README.md`.
- **Repository and hosting**: repository visibility changes from private to public
  (source, OpenSpec documents, git history and commit author email become publicly
  readable); GitHub Pages is enabled. No task data is exposed: tasks exist only in
  each visitor's own browser storage.
- **Dependencies**: none added. Playwright (already a devDependency) is reused to
  render the icon PNGs. There is still no build step and no runtime dependency.
