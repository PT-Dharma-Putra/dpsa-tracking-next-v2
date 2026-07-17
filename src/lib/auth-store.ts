import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/features/auth/types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    hydrated: boolean;

    // Actions
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    setHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            hydrated: false,

            setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => {
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('hasSeenQuote');
                }
                set({ user: null, token: null, isAuthenticated: false });
            },
            setHydrated: (state) => set({ hydrated: state }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
        }
    )
);
