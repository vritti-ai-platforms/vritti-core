export const VAP_NEXT_KEY = 'vapNext';

export type VapNextConfig = {
  routes: {
    login: string;
    home: string;
    account?: string;
    addresses?: string;
  };
  cookieName?: string;
  messagesGlobal?: string;
  collection?: string;
};
