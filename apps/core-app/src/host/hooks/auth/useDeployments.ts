import { useCallback, useEffect, useState } from 'react';
import { getDeployments } from '../../services/auth';
import type { Deployment } from '../../types/deployment';

interface UseDeploymentsResult {
  data: Deployment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Plain data hook for deployment discovery — uses fetch (no tenant base URL yet), so it's a self-contained useState/useEffect wrapper.
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
