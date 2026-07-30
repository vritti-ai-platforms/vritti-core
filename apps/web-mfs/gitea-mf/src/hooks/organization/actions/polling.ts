// How often a run, job or log is re-read while the git service still reports work in flight. Every query
// that uses it turns polling off the moment `isActive` goes false, so no interval outlives its subject.
export const ACTIVE_POLL_INTERVAL_MS = 5000;
