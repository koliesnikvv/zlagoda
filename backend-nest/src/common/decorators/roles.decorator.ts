import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type EmployeeRole = 'Manager' | 'Cashier';
export const Roles = (...roles: EmployeeRole[]) => SetMetadata(ROLES_KEY, roles);
