import { gql } from '@apollo/client';

export const MOBILE_LOGIN = gql`
  mutation MobileLogin($input: MobileLoginInput!) {
    mobileLogin(input: $input) {
      accessToken
      refreshToken
      expiresIn
      isAuthenticated
    }
  }
`;

export const MOBILE_LOGOUT = gql`
  mutation MobileLogout {
    mobileLogout {
      message
      success
    }
  }
`;
