# Tasks

## 1. Add form focus loop

- [x] 1.1 In `src/ui/render.js`, replace the input's Escape handler with a form-level `keydown` handler that closes on Escape and cycles focus among input, Add and Cancel on Tab / Shift+Tab; verify the focus-loop test in `tests/e2e/appearance.spec.js` in Chromium and WebKit

## 2. Quadrant surfaces

- [x] 2.1 In `styles/board.css`, make `.quadrant` see-through and keep the surface and shadow on `.quadrant-do`; update the "Do is the one raised quadrant" requirement in `openspec/changes/add-demo-tasks-and-inline-due/specs/matrix-board/spec.md`; verify the surfaces test in `tests/e2e/appearance.spec.js` in both themes and the axe scans in `tests/e2e/a11y.spec.js`

## 3. Small screens

- [x] 3.1 In `styles/board.css`, inside the small-screen media query, let the page grow and scroll as a whole and give the board bottom padding; verify the page-scroll test in `tests/e2e/mobile.spec.js`
- [x] 3.2 Create `src/ui/viewport.js` exporting `initViewportVars()` (sets `--vv-height` and `--vv-top` from `window.visualViewport`), call it first in `main()` in `src/main.js`, add it to `PRECACHE_URLS` in `sw.js`, and add `interactive-widget=resizes-content` to the viewport meta in `index.html`; verify `npm test` (precache test) passes
- [x] 3.3 In `styles/dialog.css`, add the scroll lock and, below 768px, the full-screen sheet with pinned heading and edit actions and 44px buttons; verify the edit-dialog, Settings, scroll-lock and visible-viewport tests in `tests/e2e/mobile.spec.js`
- [x] 3.4 In `src/ui/dialogs.js` and `index.html`, focus the heading instead of the title field when the primary pointer is coarse; verify the touch test in `tests/e2e/mobile.spec.js` (Chromium) and that the existing desktop edit tests still pass

## 4. Integration

- [x] 4.1 Run `npm test` and `npm run test:e2e`; verify no failures in Chromium and WebKit locally
- [ ] 4.2 Verify the Test workflow passes in all three browsers on the pull request
- [ ] 4.3 Manual check by the user on a real phone: open a task, tap Notes so the keyboard appears, and confirm Save and Cancel stay visible above it; scroll Settings to the end and confirm the close button stays; scroll the board to the end and confirm there is space under Eliminate
