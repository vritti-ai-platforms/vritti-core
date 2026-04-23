export type AccountDetailRoute =
  | 'AccountProfile'
  | 'AccountPassword'
  | 'AccountSessions'
  | 'AccountTheme';

export type HostAppRoute = 'HomeTabs' | AccountDetailRoute;
