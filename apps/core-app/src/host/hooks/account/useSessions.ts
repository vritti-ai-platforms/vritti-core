import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import type { SessionData } from '../../types/account';

export const SESSIONS_QUERY = gql`
  query Sessions {
    sessions {
      sessionId
      device
      ipAddress
      lastActive
      isCurrent
    }
  }
`;

interface SessionsQueryResult {
  sessions: SessionData[];
}

export function useSessions() {
  return useQuery<SessionsQueryResult>(SESSIONS_QUERY);
}
