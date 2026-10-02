/**
 * Escape-to-dismiss for CSS tooltips (design D22). Showing/hiding on hover
 * and focus is pure CSS; this only adds the WCAG 1.4.13 "dismissible" part.
 */

/**
 * @param {Element} anchor
 */
function isShowing(anchor) {
  if (anchor.hasAttribute('data-dismissed')) return false;
  const tooltip = anchor.querySelector('.tooltip');
  return !!tooltip && getComputedStyle(tooltip).visibility === 'visible';
}

/**
 * @param {ParentNode} [root]
 */
export function initTooltips(root = document) {
  const anchors = [...root.querySelectorAll('.tooltip-anchor')];

  for (const anchor of anchors) {
    const reset = () => anchor.removeAttribute('data-dismissed');
    anchor.addEventListener('mouseleave', reset);
    anchor.addEventListener('focusout', reset);
  }

  // Capture phase on document runs before the global shortcut handler, so an
  // Escape that closes a tooltip does nothing else (focus stays put).
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      const showing = anchors.filter(isShowing);
      if (showing.length === 0) return;
      for (const anchor of showing) anchor.setAttribute('data-dismissed', '');
      event.stopPropagation();
      event.preventDefault();
    },
    true,
  );
}
