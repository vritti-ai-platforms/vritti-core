import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import type { Profile } from '../../types/account';

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

interface ProfileQueryResult {
  profile: Profile;
}

export function useProfile() {
  return useQuery<ProfileQueryResult>(PROFILE_QUERY);
}
