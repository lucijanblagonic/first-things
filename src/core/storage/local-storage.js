/**
 * localStorage-backed storage adapter. Conforms to the
 * {@link import('./adapter.js').StorageAdapter} contract.
 */

const DATA_KEY = 'decision-matrix:data';
const BACKUP_PREFIX = 'decision-matrix:backup-';

/**
 * @returns {import('./adapter.js').StorageAdapter}
 */
export function createLocalStorageAdapter() {
  return {
    async load() {
      try {
        return window.localStorage.getItem(DATA_KEY);
      } catch {
        return null;
      }
    },

    async save(raw) {
      try {
        window.localStorage.setItem(DATA_KEY, raw);
      } catch (err) {
        throw err instanceof Error ? err : new Error('localStorage save failed');
      }
    },

    async backup(raw) {
      try {
        const key = `${BACKUP_PREFIX}${new Date().toISOString()}`;
        window.localStorage.setItem(key, raw);
      } catch {
        // Best-effort only; if we can't even back up, there's nothing more to do.
      }
    },

    subscribe(cb) {
      /** @param {StorageEvent} event */
      const handler = (event) => {
        if (event.storageArea === window.localStorage && event.key === DATA_KEY) {
          cb();
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },

    isAvailable() {
      try {
        const testKey = '__decision-matrix-test__';
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    },
  };
}
