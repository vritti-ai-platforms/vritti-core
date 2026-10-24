import { useQueryClient } from '@tanstack/react-query';
import { OFFERINGS_KEY } from './keys';

// Every write in this folder invalidates the same reads, so they share one invalidator
export function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: OFFERINGS_KEY });
}
