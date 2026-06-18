import { useCallback, useEffect, useState } from 'react';
import { getDeployments } from '../../services/auth/deployment.service';
import type { Deployment } from '../../types/deployment';

interface UseDeploymentsResult {
  data: Deployment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Plain data hook for deployment discovery. Deployment discovery uses fetch (no Apollo/axios,
// no tenant base URL yet), so this is a self-contained useState/useEffect wrapper rather than
// a TanStack or Apollo hook.
export function useDeployments(): UseDeploymentsResult {
  const [data, setData] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    getDeployments()
      .then((deployments) => {
        if (active) setData(deployments);
      })
      .catch((err: Error) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  return { data, isLoading, error, refetch: load };
}
