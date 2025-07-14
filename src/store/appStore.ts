import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppConfig } from '../services/configService';

export interface AppState {
  isLoading: boolean;
  config: AppConfig | null;
  theme: 'light' | 'dark';
  language: 'en' | 'es' | 'fr' | 'ar' | 'bn';
  isOnline: boolean;
  lastSyncTime: number;
  searchHistory: string[];
  
  // Actions
  setLoading: (loading: boolean) => void;
  setConfig: (config: AppConfig) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'en' | 'es' | 'fr' | 'ar' | 'bn') => void;
  setOnlineStatus: (isOnline: boolean) => void;
  updateLastSyncTime: () => void;
  addSearchTerm: (term: string) => void;
  clearSearchHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      config: null,
      theme: 'light',
      language: 'en',
      isOnline: true,
      lastSyncTime: 0,
      searchHistory: [],

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setConfig: (config: AppConfig) => {
        set({ config });
      },

      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
      },

      setLanguage: (language: 'en' | 'es' | 'fr' | 'ar' | 'bn') => {
        set({ language });
      },

      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
      },

      updateLastSyncTime: () => {
        set({ lastSyncTime: Date.now() });
      },

      addSearchTerm: (term: string) => {
        const currentHistory = get().searchHistory;
        const filteredHistory = currentHistory.filter(item => item !== term);
        const newHistory = [term, ...filteredHistory].slice(0, 10); // Keep only last 10 searches
        set({ searchHistory: newHistory });
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] });
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        searchHistory: state.searchHistory,
        config: state.config,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
); 