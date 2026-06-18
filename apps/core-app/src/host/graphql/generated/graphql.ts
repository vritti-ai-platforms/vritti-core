export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string; }
};

export type ChangePasswordInput = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};

export type LookupOrganization = {
  __typename?: 'LookupOrganization';
  id: Scalars['ID']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  subdomain: Scalars['String']['output'];
};

export type MessageResponse = {
  __typename?: 'MessageResponse';
  message: Scalars['String']['output'];
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type MobileAuthSession = {
  __typename?: 'MobileAuthSession';
  accessToken?: Maybe<Scalars['String']['output']>;
  expiresIn?: Maybe<Scalars['Int']['output']>;
  isAuthenticated?: Maybe<Scalars['Boolean']['output']>;
  refreshToken?: Maybe<Scalars['String']['output']>;
};

export type MobileLoginInput = {
  email: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  password: Scalars['String']['input'];
};

export type MobileRefreshInput = {
  refreshToken: Scalars['String']['input'];
};

export type MobileTokens = {
  __typename?: 'MobileTokens';
  accessToken: Scalars['String']['output'];
  expiresIn: Scalars['Int']['output'];
  refreshToken: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  changePassword: MessageResponse;
  mobileLogin: MobileAuthSession;
  mobileLogout: MessageResponse;
  mobileRefreshTokens: MobileTokens;
  revokeAllSessions: MessageResponse;
  revokeSession: MessageResponse;
};


export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};


export type MutationMobileLoginArgs = {
  input: MobileLoginInput;
};


export type MutationMobileRefreshTokensArgs = {
  input: MobileRefreshInput;
};


export type MutationRevokeSessionArgs = {
  sessionId: Scalars['ID']['input'];
};

export type Profile = {
  __typename?: 'Profile';
  createdAt: Scalars['DateTime']['output'];
  displayName?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  hasPassword: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  lastLoginAt?: Maybe<Scalars['DateTime']['output']>;
  locale: Scalars['String']['output'];
  status: Scalars['String']['output'];
  timezone: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  organizationsByEmail: Array<LookupOrganization>;
  profile: Profile;
  sessions: Array<UserSession>;
};


export type QueryOrganizationsByEmailArgs = {
  email: Scalars['String']['input'];
};

export type UserSession = {
  __typename?: 'UserSession';
  device: Scalars['String']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  isCurrent: Scalars['Boolean']['output'];
  lastActive: Scalars['DateTime']['output'];
  sessionId: Scalars['ID']['output'];
};
