import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUADRANTS, QUADRANT_IDS, LAYOUTS, getQuadrant, horizontalNeighbour } from '../../src/core/quadrants.js';

test('QUADRANTS is ordered by priority do, plan, limit, drop', () => {
  assert.deepEqual(
    QUADRANTS.map((q) => q.id),
    ['do', 'plan', 'limit', 'drop'],
  );
  assert.deepEqual(
    QUADRANTS.map((q) => q.priority),
    [1, 2, 3, 4],
  );
});

test('QUADRANTS carries the exact titles and subtitles from the spec', () => {
  assert.deepEqual(getQuadrant('do'), {
    id: 'do',
    priority: 1,
    title: 'Do',
    subtitle: 'Urgent and important',
    gridArea: 'do',
  });
  assert.deepEqual(getQuadrant('plan'), {
    id: 'plan',
    priority: 2,
    title: 'Plan',
    subtitle: 'Important but not urgent',
    gridArea: 'plan',
  });
  assert.deepEqual(getQuadrant('limit'), {
    id: 'limit',
    priority: 3,
    title: 'Delegate',
    subtitle: 'Urgent but not important',
    gridArea: 'limit',
  });
  assert.deepEqual(getQuadrant('drop'), {
    id: 'drop',
    priority: 4,
    title: 'Eliminate',
    subtitle: 'Not urgent and not important',
    gridArea: 'drop',
  });
});

test('QUADRANT_IDS matches QUADRANTS order', () => {
  assert.deepEqual(QUADRANT_IDS, ['do', 'plan', 'limit', 'drop']);
});

test('getQuadrant returns undefined for unknown id', () => {
  assert.equal(getQuadrant('nope'), undefined);
});

test('horizontalNeighbour: plan <-> do', () => {
  assert.equal(horizontalNeighbour('plan', 'right'), 'do');
  assert.equal(horizontalNeighbour('do', 'left'), 'plan');
});

test('horizontalNeighbour: drop <-> limit', () => {
  assert.equal(horizontalNeighbour('drop', 'right'), 'limit');
  assert.equal(horizontalNeighbour('limit', 'left'), 'drop');
});

test('horizontalNeighbour: null at edges', () => {
  assert.equal(horizontalNeighbour('do', 'right'), null);
  assert.equal(horizontalNeighbour('plan', 'left'), null);
  assert.equal(horizontalNeighbour('limit', 'right'), null);
  assert.equal(horizontalNeighbour('drop', 'left'), null);
});

test('LAYOUTS lists the default first', () => {
  assert.deepEqual(LAYOUTS, ['urgent-right', 'urgent-left']);
});

test('horizontalNeighbour: explicit urgent-right matches the default', () => {
  for (const id of QUADRANT_IDS) {
    for (const dir of /** @type {const} */ (['left', 'right'])) {
      assert.equal(horizontalNeighbour(id, dir, 'urgent-right'), horizontalNeighbour(id, dir));
    }
  }
});

test('horizontalNeighbour: urgent-left mirrors the columns', () => {
  // Layout: 'do plan' / 'limit drop'
  assert.equal(horizontalNeighbour('do', 'right', 'urgent-left'), 'plan');
  assert.equal(horizontalNeighbour('plan', 'left', 'urgent-left'), 'do');
  assert.equal(horizontalNeighbour('limit', 'right', 'urgent-left'), 'drop');
  assert.equal(horizontalNeighbour('drop', 'left', 'urgent-left'), 'limit');
});

test('horizontalNeighbour: urgent-left null at edges', () => {
  assert.equal(horizontalNeighbour('do', 'left', 'urgent-left'), null);
  assert.equal(horizontalNeighbour('plan', 'right', 'urgent-left'), null);
  assert.equal(horizontalNeighbour('limit', 'left', 'urgent-left'), null);
  assert.equal(horizontalNeighbour('drop', 'right', 'urgent-left'), null);
});
