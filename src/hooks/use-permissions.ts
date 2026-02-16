import { useAuthStore } from '@/lib/auth-store';

export function usePermissions() {
    const user = useAuthStore((s) => s.user);

    const can = (permission: string): boolean => {
        if (!user?.permissions) return false;
        if (user.role === 'Super-Admin') return true;
        return user.permissions.includes(permission);
    };

    const hasClientCategory = (category: string): boolean => {
        return user?.client_categories?.includes(category) ?? false;
    };

    const canViewPrice = can('view price');
    const canViewConfidential = can('view confidential');
    const canManageMDL = can('manage mdl');
    const canOrderInternational =
        user?.role !== 'Client' || hasClientCategory('internasional');

    return {
        can,
        hasClientCategory,
        canViewPrice,
        canViewConfidential,
        canManageMDL,
        canOrderInternational,
    };
}
