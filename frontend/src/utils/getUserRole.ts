import { TUserRole } from '../types';

const roleLabels: Record<TUserRole, string> = {
  Manager: 'Менеджер',
  Cashier: 'Касир',
};

export const getUserRoleLabel = (role: TUserRole | undefined): string => {
  if (!role) return roleLabels.Cashier;
  return roleLabels[role] ?? roleLabels.Cashier;
};
