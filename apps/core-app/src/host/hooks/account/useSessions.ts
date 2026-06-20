import { useQuery } from '@apollo/client/react';
import { SESSIONS_QUERY } from '../../graphql/account';
import type { SessionData } from '../../types/account';

interface SessionsQueryResult {
  sessions: SessionData[];
}

export function useSessions() {
  return useQuery<SessionsQueryResult>(SESSIONS_QUERY);
}
