import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayISO, startOfLocalDay, msUntilNextLocalMidnight, compareISODate } from '../../src/core/dates.js';

test('todayISO formats local date as YYYY-MM-DD', () => {
  const now = new Date(2026, 2, 5, 14, 30, 0); // March 5 2026, local
  assert.equal(todayISO(now), '2026-03-05');
});

test('todayISO pads single-digit month and day', () => {
  const now = new Date(2026, 0, 9, 0, 0, 0); // Jan 9 2026
  assert.equal(todayISO(now), '2026-01-09');
});

test('startOfLocalDay zeroes out the time', () => {
  const now = new Date(2026, 5, 15, 23, 59, 59, 999);
  const start = startOfLocalDay(now);
  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 5);
  assert.equal(start.getDate(), 15);
  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(start.getSeconds(), 0);
  assert.equal(start.getMilliseconds(), 0);
});

test('msUntilNextLocalMidnight: just before midnight', () => {
  const now = new Date(2026, 2, 5, 23, 59, 59, 500);
  const ms = msUntilNextLocalMidnight(now);
  assert.equal(ms, 500);
});

test('msUntilNextLocalMidnight: just after midnight', () => {
  const now = new Date(2026, 2, 5, 0, 0, 0, 500);
  const ms = msUntilNextLocalMidnight(now);
  // 1 day minus 500ms already elapsed
  assert.equal(ms, 24 * 60 * 60 * 1000 - 500);
});

test('msUntilNextLocalMidnight: exactly at midnight', () => {
  const now = new Date(2026, 2, 5, 0, 0, 0, 0);
  assert.equal(msUntilNextLocalMidnight(now), 24 * 60 * 60 * 1000);
});

test('compareISODate orders dates lexicographically', () => {
  assert.equal(compareISODate('2026-01-01', '2026-01-02') < 0, true);
  assert.equal(compareISODate('2026-01-02', '2026-01-01') > 0, true);
  assert.equal(compareISODate('2026-01-01', '2026-01-01'), 0);
  assert.equal(compareISODate('2025-12-31', '2026-01-01') < 0, true);
});
