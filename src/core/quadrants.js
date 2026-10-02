/**
 * Quadrant metadata, ordered by priority (1 = most important & urgent).
 * @typedef {{ id: string, priority: number, title: string, subtitle: string, gridArea: string }} Quadrant
 */

/** @type {Quadrant[]} */
export const QUADRANTS = [
  { id: 'do', priority: 1, title: 'Do', subtitle: 'Urgent and important', gridArea: 'do' },
  { id: 'plan', priority: 2, title: 'Plan', subtitle: 'Important but not urgent', gridArea: 'plan' },
  { id: 'limit', priority: 3, title: 'Delegate', subtitle: 'Urgent but not important', gridArea: 'limit' },
  { id: 'drop', priority: 4, title: 'Eliminate', subtitle: 'Not urgent and not important', gridArea: 'drop' },
];

export const QUADRANT_IDS = QUADRANTS.map((q) => q.id);

/** Layout directions: which column holds the urgent quadrants (design D16). */
export const LAYOUTS = ['urgent-right', 'urgent-left'];

/** @type {Record<string, string | null>} */
const LEFT_NEIGHBOUR = { do: 'plan', limit: 'drop', plan: null, drop: null };
/** @type {Record<string, string | null>} */
const RIGHT_NEIGHBOUR = { plan: 'do', drop: 'limit', do: null, limit: null };

/**
 * @param {string} id
 * @returns {Quadrant | undefined}
 */
export function getQuadrant(id) {
  return QUADRANTS.find((q) => q.id === id);
}

/**
 * Visually adjacent quadrant to the left or right of `id`, or null at an edge.
 * The urgent-left layout is an exact horizontal mirror of the default, so it
 * just swaps the direction (design D17).
 * @param {string} id
 * @param {'left' | 'right'} direction
 * @param {string} [layout] one of LAYOUTS
 * @returns {string | null}
 */
export function horizontalNeighbour(id, direction, layout = 'urgent-right') {
  const mirrored = layout === 'urgent-left';
  const goLeft = (direction === 'left') !== mirrored;
  const map = goLeft ? LEFT_NEIGHBOUR : RIGHT_NEIGHBOUR;
  return map[id] ?? null;
}
