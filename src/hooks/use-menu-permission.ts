'use client';

import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/lib/auth-store';

/**
 * Standard alias mapping for module keys that might have legacy or alternative permission names.
 * Single point of truth for permission aliases in the frontend.
 */
const MODULE_ALIASES: Record<string, string[]> = {
  'projects-v2/rekap-penagihan': ['rekap-penagihan', 'penagihan'],
  'projects-v2/marketing': ['marketing', 'projects-v2'],
  'projects-v2/perencanaan': ['perencanaan', 'ppic'],
  'projects-v2/piutang': ['piutang'],
  'projects-v2/purchasing': ['purchasing'],
  'master-data/clients': ['clients', 'client'],
};

/**
 * Scalable, route-aware menu permission hook.
 * 
 * Automatically resolves the module key from Next.js pathname,
 * or allows an explicit override for composite/multi-module pages.
 * 
 * @param moduleKeyOverride Optional explicit module key (e.g. 'projects-v2/rekap-penagihan')
 */
export function useMenuPermission(moduleKeyOverride?: string) {
  const pathname = usePathname();
  const { can } = usePermissions();
  const user = useAuthStore((s) => s.user);

  const isSuperAdmin = user?.role === 'Super-Admin' || 
    (Array.isArray(user?.roles) && user.roles.some((r: any) => typeof r === 'string' ? r === 'Super-Admin' : r?.name === 'Super-Admin'));

  // Normalize key from pathname: "/dashboard/projects-v2/rekap-penagihan" -> "projects-v2/rekap-penagihan"
  const resolvedKey = moduleKeyOverride ?? pathname
    ?.replace(/^\/dashboard\/?/, '')
    .split('?')[0]
    .replace(/\/+$/, '') ?? '';

  const shortKey = resolvedKey.split('/').pop() || resolvedKey;
  const extraAliases = MODULE_ALIASES[resolvedKey] || [];

  /**
   * Check whether the user has permission for a specific action on this menu module.
   * Checks multiple candidates:
   * 1. "{action} {resolvedKey}" (e.g. "delete projects-v2/rekap-penagihan")
   * 2. "{action} {shortKey}" (e.g. "delete rekap-penagihan")
   * 3. "{action} {alias}" (e.g. "delete penagihan")
   */
  const canAction = (action: 'read' | 'create' | 'update' | 'delete' | string): boolean => {
    if (isSuperAdmin) return true;

    const candidates = Array.from(new Set([
      `${action} ${resolvedKey}`,
      `${action} ${shortKey}`,
      ...extraAliases.map((alias) => `${action} ${alias}`),
    ]));

    return candidates.some((candidate) => can(candidate));
  };

  return {
    isSuperAdmin,
    canRead: canAction('read'),
    canCreate: canAction('create'),
    canUpdate: canAction('update'),
    canDelete: canAction('delete'),
    canAction,
  };
}
