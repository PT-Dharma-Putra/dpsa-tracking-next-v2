import { useAuthStore } from '@/lib/auth-store';

export function usePermissions() {
    const user = useAuthStore((s) => s.user);

    const can = (permission: string): boolean => {
        if (!user) return false;
        const isSuperAdmin = user.role === 'Super-Admin' || 
            (Array.isArray(user.roles) && user.roles.some((r: any) => typeof r === 'string' ? r === 'Super-Admin' : r.name === 'Super-Admin'));
        if (isSuperAdmin) return true;
        if (!user.permissions) return false;
        return user.permissions.includes(permission);
    };

    const hasClientCategory = (category: string): boolean => {
        return user?.client_categories?.includes(category) ?? false;
    };

    const canViewPrice = can('view price');
    const canViewConfidential = can('view confidential');
    const canManageMDL = can('manage mdl');
    const canUpdateDeadline = can('update deadline');
    const canUploadDokubah = can('upload dokubah');
    const canOrderInternational =
        user?.role !== 'Client' || hasClientCategory('internasional');

    return {
        can,
        hasClientCategory,
        canViewPrice,
        canViewConfidential,
        canManageMDL,
        canUpdateDeadline,
        canOrderInternational,
        canUploadDokubah
    };
}
