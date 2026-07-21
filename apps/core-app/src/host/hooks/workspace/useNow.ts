import { useEffect, useState } from 'react';

// A ticking clock so time-derived UI (e.g. per-site local time) stays fresh; re-renders on the interval.
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
