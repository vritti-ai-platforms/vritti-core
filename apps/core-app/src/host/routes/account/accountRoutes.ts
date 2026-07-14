import type { PushScreenConfig } from "@vritti/quantum-ui-native/PushNavigator";
import { PasswordScreen } from "../../screens/account/PasswordScreen";
import { ProfileScreen } from "../../screens/account/ProfileScreen";
import { SessionsScreen } from "../../screens/account/SessionsScreen";
import { AccountScreen } from "../../screens/account/AccountScreen";

export type AccountDetailRoute =
  | "AccountProfile"
  | "AccountPassword"
  | "AccountSessions"
  | "Account";

export const accountRoutes: ReadonlyArray<
  PushScreenConfig<AccountDetailRoute>
> = [
  { name: "Account", title: "Account", component: AccountScreen },
  { name: "AccountProfile", title: "Profile", component: ProfileScreen },
  { name: "AccountPassword", title: "Password", component: PasswordScreen },
  { name: "AccountSessions", title: "Sessions", component: SessionsScreen },
];
