import { registerPlugin } from '@capacitor/core';

export interface AppGroupStoragePlugin {
  saveToken(options: { token: string }): Promise<void>;
  getToken(): Promise<{ token: string | null }>;
  removeToken(): Promise<void>;
}

export const AppGroupStorage = registerPlugin<AppGroupStoragePlugin>('AppGroupStorage', {
  web: () => ({
    saveToken: async () => {
      console.log('[AppGroupStorage] Web platform - no-op');
    },
    getToken: async () => ({ token: null }),
    removeToken: async () => {
      console.log('[AppGroupStorage] Web platform - no-op');
    },
  }),
});
