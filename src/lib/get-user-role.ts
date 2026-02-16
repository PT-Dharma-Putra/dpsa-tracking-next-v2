import { User } from '@/features/auth/types';

export type BusinessRole = 'marketing' | 'studio' | 'supervisor' | 'finance' | 'other';

/**
 * Derives the user's business role from their auth profile.
 * Used to render role-appropriate views in the tracking system.
 */
export function getUserBusinessRole(user: User | null): BusinessRole {
    if (!user) return 'other';

    // Check from roles array first (backward compat)
    const roleNames = [
        user.role?.toLowerCase(),
        ...(user.roles?.map(r => r.name.toLowerCase()) || []),
        ...(user.roles_list?.map(r => r.toLowerCase()) || []),
    ].filter(Boolean);

    if (roleNames.some(r => r === 'marketing')) return 'marketing';
    if (roleNames.some(r => r === 'studio')) return 'studio';
    if (roleNames.some(r => r === 'super-admin' || r === 'super_admin' || r === 'ppic')) return 'supervisor';
    if (roleNames.some(r => r === 'keuangan' || r === 'finance')) return 'finance';

    return 'other';
}

/** Check helpers */
export const canViewPricing = (role: BusinessRole) => role === 'marketing' || role === 'finance' || role === 'supervisor';
export const canUploadDesign = (role: BusinessRole) => role === 'studio';
export const canApproveDesign = (role: BusinessRole) => role === 'supervisor';
export const canManageSPH = (role: BusinessRole) => role === 'marketing';
export const canApproveSPH = (role: BusinessRole) => role === 'supervisor';
export const canReviseDocs = (role: BusinessRole) => role === 'marketing' || role === 'supervisor';
