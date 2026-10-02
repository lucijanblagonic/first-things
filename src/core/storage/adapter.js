/**
 * The storage adapter contract. Any adapter plugged into `createStore` must
 * satisfy this shape so task/UI behaviour never depends on which one is used.
 *
 * @typedef {Object} StorageAdapter
 * @property {() => Promise<string | null>} load
 *   Returns the raw stored document string, or null if nothing is stored.
 * @property {(raw: string) => Promise<void>} save
 *   Persists the raw document string. May reject (e.g. quota exceeded).
 * @property {(raw: string) => Promise<void>} [backup]
 *   Preserves raw data that failed to parse/validate, under a separate key.
 * @property {(cb: () => void) => () => void} [subscribe]
 *   Notifies `cb` when the underlying storage changes from *outside* this
 *   adapter instance (e.g. another browser tab). Returns an unsubscribe function.
 * @property {() => boolean} [isAvailable]
 *   Synchronous, best-effort check for whether this adapter can be used at all.
 */

export {};
