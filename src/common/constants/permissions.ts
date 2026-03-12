import { EmployeeRole } from '@prisma/client';

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Movies/Events
  EVENTS_VIEW: 'events.view',
  EVENTS_CREATE: 'events.create',
  EVENTS_UPDATE: 'events.update',
  EVENTS_DELETE: 'events.delete',

  // Shows
  SHOWS_VIEW: 'shows.view',
  SHOWS_CREATE: 'shows.create',
  SHOWS_UPDATE: 'shows.update',
  SHOWS_DELETE: 'shows.delete',

  // Theaters
  THEATERS_VIEW: 'theaters.view',
  THEATERS_CREATE: 'theaters.create',
  THEATERS_UPDATE: 'theaters.update',
  THEATERS_DELETE: 'theaters.delete',

  // Bookings/Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_CANCEL: 'orders.cancel',

  // Employees
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_INVITE: 'employees.invite',
  EMPLOYEES_UPDATE: 'employees.update',
  EMPLOYEES_DELETE: 'employees.delete',

  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_UPDATE: 'customers.update',

  // Promo Codes
  PROMO_CODES_VIEW: 'promo-codes.view',
  PROMO_CODES_CREATE: 'promo-codes.create',
  PROMO_CODES_UPDATE: 'promo-codes.update',
  PROMO_CODES_DELETE: 'promo-codes.delete',

  // Reports
  REPORTS_VIEW: 'reports.view',
  AUDIT_LOGS_VIEW: 'audit-logs.view',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<EmployeeRole, Permission[]> = {
  [EmployeeRole.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions

  [EmployeeRole.ADMIN]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.EVENTS_CREATE,
    PERMISSIONS.EVENTS_UPDATE,
    PERMISSIONS.EVENTS_DELETE,
    PERMISSIONS.SHOWS_VIEW,
    PERMISSIONS.SHOWS_CREATE,
    PERMISSIONS.SHOWS_UPDATE,
    PERMISSIONS.SHOWS_DELETE,
    PERMISSIONS.THEATERS_VIEW,
    PERMISSIONS.THEATERS_CREATE,
    PERMISSIONS.THEATERS_UPDATE,
    PERMISSIONS.THEATERS_DELETE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_INVITE,
    PERMISSIONS.EMPLOYEES_UPDATE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.PROMO_CODES_VIEW,
    PERMISSIONS.PROMO_CODES_CREATE,
    PERMISSIONS.PROMO_CODES_UPDATE,
    PERMISSIONS.PROMO_CODES_DELETE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW,
  ],

  [EmployeeRole.MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.SHOWS_VIEW,
    PERMISSIONS.SHOWS_CREATE,
    PERMISSIONS.SHOWS_UPDATE,
    PERMISSIONS.THEATERS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.PROMO_CODES_VIEW,
  ],

  [EmployeeRole.STAFF]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
  ],
};
