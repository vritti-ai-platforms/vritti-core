import { gql } from '@apollo/client';

export const PROFILE_QUERY = gql`
  query Profile {
    profile {
      id
      email
      fullName
      displayName
      status
      hasPassword
      locale
      timezone
      createdAt
      lastLoginAt
    }
  }
`;

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
