/**
 * Publishes the visible viewport as CSS variables. On phones the on-screen
 * keyboard shrinks the *visual* viewport but not the layout viewport, so
 * `100dvh` still reaches under the keyboard. Full-screen dialogs
 * (styles/dialog.css) size themselves with these instead:
 *   --vv-height  height of the visible area
 *   --vv-top     its offset from the top of the layout viewport
 * Without `window.visualViewport` nothing is set and the CSS falls back.
 */
export function initViewportVars() {
  const viewport = window.visualViewport;
  if (!viewport) return;

  const update = () => {
    const root = document.documentElement.style;
    root.setProperty('--vv-height', `${viewport.height}px`);
    root.setProperty('--vv-top', `${viewport.offsetTop}px`);
  };

  viewport.addEventListener('resize', update);
  viewport.addEventListener('scroll', update);
  update();
}
