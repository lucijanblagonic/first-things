/**
 * In-memory storage adapter used by unit tests and as a fallback when
 * localStorage is unavailable. Conforms to the {@link import('./adapter.js').StorageAdapter} contract.
 * @param {{ throwOnSave?: boolean }} [options]
 * @returns {import('./adapter.js').StorageAdapter}
 */
export function createMemoryAdapter(options = {}) {
  let raw = /** @type {string | null} */ (null);
  const throwOnSave = Boolean(options.throwOnSave);

  return {
    async load() {
      return raw;
    },
    async save(value) {
      if (throwOnSave) {
        throw new Error('Simulated storage failure');
      }
      raw = value;
    },
    async backup() {
      // No-op: nothing outside the process to preserve data in.
    },
    subscribe() {
      return () => {};
    },
    isAvailable() {
      return true;
    },
  };
}
