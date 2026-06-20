import { useQuery } from '@apollo/client/react';
import { PROFILE_QUERY } from '../../graphql/account';
import type { Profile } from '../../types/account';

interface ProfileQueryResult {
  profile: Profile;
}

export function useProfile() {
  return useQuery<ProfileQueryResult>(PROFILE_QUERY);
}
