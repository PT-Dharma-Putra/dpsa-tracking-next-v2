import { useAuthStore } from "@/lib/auth-store"

export function useAuth() {
    const { user, isAuthenticated, setAuth, logout } = useAuthStore()

    return {
        user,
        isAuthenticated,
        setAuth,
        logout,
        // Helper to check role
        hasRole: (role: string) => user?.role === role,
        // Helper to check permission
        can: (permission: string) => {
            if (user?.role === 'Super-Admin') return true
            return user?.permissions?.includes(permission) || false
        }
    }
}
