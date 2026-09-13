import { UserRole, AppUser } from '../../types';

export type Permission =
  // User & Identity
  | 'MANAGE_USERS'
  | 'ASSIGN_ROLES'
  | 'VIEW_USER_PROFILES'
  | 'ACCEPT_MERCHANTS'
  | 'ACCEPT_DRIVERS'
  
  // Catalog & Products
  | 'MANAGE_CATALOG'
  | 'MANAGE_PRICING'
  | 'ADJUST_INVENTORY'
  
  // Orders & Dispatch
  | 'MANAGE_ORDERS'
  | 'CANCEL_ORDERS'
  | 'DISPATCH_ORDERS'
  | 'VIEW_ALL_ORDERS'
  | 'TRACK_DELIVERIES'
  
  // CMS & Marketing
  | 'MANAGE_CMS'
  | 'MANAGE_BANNERS'
  | 'MANAGE_CATEGORIES'
  
  // Finance & Payments
  | 'VIEW_FINANCE'
  | 'MANAGE_PAYMENTS'
  | 'AUTOMATE_PAYMENTS'
  | 'PROCESS_REFUNDS'
  
  // Customer Service
  | 'HANDLE_COMPLAINTS'
  
  // Technical & Developer
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_FEATURE_FLAGS'
  | 'CONFIGURE_SYSTEM'
  | 'TOGGLE_MAINTENANCE'
  | 'TRIGGER_KILL_SWITCH'
  | 'MANAGE_FIREBASE'
  | 'RESET_DATABASE'
  | 'EXPORT_DATA'
  | 'VIEW_SYSTEM_METRICS'
  | 'VIEW_SECURITY_CENTER'
  | 'COLLECT_COD'
  
  // Center & Dashboard Access
  | 'ACCESS_ADMIN_CENTER'
  | 'ACCESS_DEVELOPER_CENTER'
  | 'ACCESS_DRIVER_DASHBOARD'
  | 'ACCESS_MERCHANT_DASHBOARD'
  | 'ACCESS_SUPPORT_CENTER';

export interface RoleConfig {
  role: UserRole;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  level: number; // Higher is more privileged
  permissions: Permission[];
}

export const ALL_SYSTEM_PERMISSIONS: { id: Permission; labelAr: string; category: string }[] = [
  { id: 'MANAGE_USERS', labelAr: 'إدارة المستخدمين وحساباتهم', category: 'الهوية والأدوار' },
  { id: 'ASSIGN_ROLES', labelAr: 'ترقية وتغيير أدوار المستخدمين', category: 'الهوية والأدوار' },
  { id: 'VIEW_USER_PROFILES', labelAr: 'الاطلاع على ملفات وبيانات العملاء', category: 'الهوية والأدوار' },
  { id: 'ACCEPT_MERCHANTS', labelAr: 'مراجعة وقبول واعتماد التجار الجدد', category: 'الهوية والأدوار' },
  { id: 'ACCEPT_DRIVERS', labelAr: 'مراجعة وقبول واعتماد المناديب الجدد', category: 'الهوية والأدوار' },
  
  { id: 'MANAGE_CATALOG', labelAr: 'إضافة وتعديل وحذف المنتجات', category: 'الكتالوج والمخزون' },
  { id: 'MANAGE_PRICING', labelAr: 'تعديل أسعار المنتجات والخصومات', category: 'الكتالوج والمخزون' },
  { id: 'ADJUST_INVENTORY', labelAr: 'تعديل الكميات المتاحة في المخزون', category: 'الكتالوج والمخزون' },
  
  { id: 'MANAGE_ORDERS', labelAr: 'إدارة وتحديث مراحل الطلبات', category: 'العمليات واللوجستيات' },
  { id: 'CANCEL_ORDERS', labelAr: 'إلغاء الطلبات وإرجاعها', category: 'العمليات واللوجستيات' },
  { id: 'DISPATCH_ORDERS', labelAr: 'توجيه وتعيين المناديب للطلبات', category: 'العمليات واللوجستيات' },
  { id: 'VIEW_ALL_ORDERS', labelAr: 'استعراض جميع الطلبات الحية', category: 'العمليات واللوجستيات' },
  { id: 'TRACK_DELIVERIES', labelAr: 'التتبع الحي لمسارات المناديب', category: 'العمليات واللوجستيات' },
  
  { id: 'MANAGE_CMS', labelAr: 'تعديل واجهة المتجر والبنرات', category: 'المحتوى والأقسام' },
  { id: 'MANAGE_CATEGORIES', labelAr: 'إضافة وتعديل وحذف الأقسام والتصنيفات', category: 'المحتوى والأقسام' },
  { id: 'MANAGE_BANNERS', labelAr: 'تعديل البنرات الإعلانية الترويجية', category: 'المحتوى والأقسام' },
  
  { id: 'VIEW_FINANCE', labelAr: 'الاطلاع على التقارير المالية والإيرادات', category: 'المالية والمدفوعات' },
  { id: 'MANAGE_PAYMENTS', labelAr: 'إضافة وتعديل وإدارة طرق الدفع', category: 'المالية والمدفوعات' },
  { id: 'AUTOMATE_PAYMENTS', labelAr: 'أتمتة الدفع وقواعد التحقق اللحظي', category: 'المالية والمدفوعات' },
  { id: 'PROCESS_REFUNDS', labelAr: 'إصدار المبالغ المستردة للمحفظة', category: 'المالية والمدفوعات' },
  
  { id: 'HANDLE_COMPLAINTS', labelAr: 'معالجة والرد على شكاوى العملاء', category: 'خدمة العملاء' },
  
  { id: 'CONFIGURE_SYSTEM', labelAr: 'تعديل إعدادات وتخصيصات التطبيق بالكامل', category: 'النظام والتحكم التقني' },
  { id: 'MANAGE_FEATURE_FLAGS', labelAr: 'إدارة وتفعيل الميزات البرمجية', category: 'النظام والتحكم التقني' },
  { id: 'VIEW_AUDIT_LOGS', labelAr: 'الاطلاع على سجل التدقيق الأمني', category: 'النظام والتحكم التقني' },
  { id: 'TOGGLE_MAINTENANCE', labelAr: 'تفعيل وإلغاء وضع الصيانة العام', category: 'النظام والتحكم التقني' },
  { id: 'TRIGGER_KILL_SWITCH', labelAr: 'تشغيل قواطع الطوارئ اللحظية', category: 'النظام والتحكم التقني' },
  { id: 'MANAGE_FIREBASE', labelAr: 'مزامنة وإدارة قاعدة بيانات Firebase', category: 'النظام والتحكم التقني' },
  
  { id: 'ACCESS_ADMIN_CENTER', labelAr: 'دخول لوحة تحكم الإدارة والعمليات', category: 'الوصول للوحات التحكم' },
  { id: 'ACCESS_DEVELOPER_CENTER', labelAr: 'دخول لوحة تحكم مهندس النظام (ROOT)', category: 'الوصول للوحات التحكم' },
  { id: 'ACCESS_DRIVER_DASHBOARD', labelAr: 'دخول لوحة تحكم مندوب التوصيل', category: 'الوصول للوحات التحكم' },
  { id: 'ACCESS_MERCHANT_DASHBOARD', labelAr: 'دخول لوحة تحكم التاجر الشريك', category: 'الوصول للوحات التحكم' },
];

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  developer: {
    role: 'developer',
    labelAr: 'مهندس النظام (System Engineer / Developer)',
    labelEn: 'System Engineer & Developer',
    descriptionAr: 'صلاحيات تحكم كاملة وجذرية (Root) في جميع أجزاء التطبيق، تعديل سياسات الخصوصية والإرجاع، طرق الدفع وأتمتتها، الميزات الحية، ومصفوفة الأمان.',
    descriptionEn: 'Full omnipotent root access across the application, privacy & return policies, payments automation, and dynamic features.',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-400',
    level: 100,
    permissions: ALL_SYSTEM_PERMISSIONS.map(p => p.id)
  },
  super_admin: {
    role: 'super_admin',
    labelAr: 'المشرف الأعلى (Super Admin)',
    labelEn: 'Super Administrator',
    descriptionAr: 'صلاحيات إشراف شاملة مع كامل صلاحيات مهندس النظام.',
    descriptionEn: 'Full administrative and system engineer oversight.',
    badgeBg: 'bg-indigo-500/15',
    badgeBorder: 'border-indigo-500/40',
    badgeText: 'text-indigo-400',
    level: 95,
    permissions: ALL_SYSTEM_PERMISSIONS.map(p => p.id)
  },
  manager: {
    role: 'manager',
    labelAr: 'المدير',
    labelEn: 'Manager',
    descriptionAr: 'صلاحيات إدارة الأعمال والطلبات والمخزون والمدفوعات والشحن والتقارير، دون صلاحيات مهندس النظام أو إدارة الأدوار الجذرية.',
    descriptionEn: 'Business management access for orders, inventory, payments, delivery and reports without system-engineer privileges.',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/40',
    badgeText: 'text-emerald-400',
    level: 80,
    permissions: [
      'VIEW_USER_PROFILES', 'ACCEPT_MERCHANTS', 'ACCEPT_DRIVERS',
      'MANAGE_CATALOG', 'MANAGE_PRICING', 'ADJUST_INVENTORY',
      'MANAGE_ORDERS', 'CANCEL_ORDERS', 'DISPATCH_ORDERS', 'VIEW_ALL_ORDERS', 'TRACK_DELIVERIES',
      'MANAGE_CMS', 'MANAGE_BANNERS', 'MANAGE_CATEGORIES',
      'VIEW_FINANCE', 'MANAGE_PAYMENTS', 'PROCESS_REFUNDS', 'HANDLE_COMPLAINTS', 'EXPORT_DATA',
      'ACCESS_ADMIN_CENTER'
    ]
  },
  admin: {
    role: 'admin',
    labelAr: 'المدير العام (General Manager)',
    labelEn: 'General Manager',
    descriptionAr: 'صلاحيات إدارة العمليات، مراقبة الطلبات وتوجيه المناديب، قبول واعتماد التجار والمناديب الجدد، إدارة الكتالوج والأقسام، ومتابعة التقارير المالية.',
    descriptionEn: 'General management over store operations, orders, merchant & driver approvals, catalog & categories.',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/40',
    badgeText: 'text-emerald-400',
    level: 80,
    permissions: [
      'VIEW_USER_PROFILES',
      'ACCEPT_MERCHANTS',
      'ACCEPT_DRIVERS',
      'MANAGE_CATALOG',
      'MANAGE_PRICING',
      'ADJUST_INVENTORY',
      'MANAGE_ORDERS',
      'CANCEL_ORDERS',
      'DISPATCH_ORDERS',
      'VIEW_ALL_ORDERS',
      'TRACK_DELIVERIES',
      'MANAGE_CMS',
      'MANAGE_BANNERS',
      'MANAGE_CATEGORIES',
      'VIEW_FINANCE',
      'MANAGE_PAYMENTS',
      'HANDLE_COMPLAINTS',
      'EXPORT_DATA',
      'ACCESS_ADMIN_CENTER'
    ]
  },
  operations: {
    role: 'operations',
    labelAr: 'مدير العمليات واللوجستيات (Operations Manager)',
    labelEn: 'Operations Manager',
    descriptionAr: 'متابعة حركة الطلبات، إدارة السائقين والتسليم.',
    descriptionEn: 'Logistics, delivery tracking, and courier management.',
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-500/40',
    badgeText: 'text-blue-400',
    level: 60,
    permissions: [
      'MANAGE_ORDERS',
      'DISPATCH_ORDERS',
      'VIEW_ALL_ORDERS',
      'TRACK_DELIVERIES',
      'ACCESS_ADMIN_CENTER'
    ]
  },
  finance: {
    role: 'finance',
    labelAr: 'المدير المالي (Finance Manager)',
    labelEn: 'Finance Manager',
    descriptionAr: 'متابعة المدفوعات والتقارير المالية وحسابات التجار.',
    descriptionEn: 'Financial reporting, reconciliation, and merchant balances.',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-400',
    level: 50,
    permissions: [
      'VIEW_FINANCE',
      'EXPORT_DATA',
      'ACCESS_ADMIN_CENTER'
    ]
  },
  merchant: {
    role: 'merchant',
    labelAr: 'التاجر الشريك (Merchant)',
    labelEn: 'Partner Merchant',
    descriptionAr: 'إدارة متجر التاجر، أسعار منتجاته ومخزونه، ومتابعة مبيعاته (لا يمكنه الدخول إلا بعد موافقة المدير العام).',
    descriptionEn: 'Manages own store catalog and inventory (requires General Manager approval).',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-400',
    level: 30,
    permissions: [
      'ACCESS_MERCHANT_DASHBOARD',
      'MANAGE_CATALOG',
      'ADJUST_INVENTORY'
    ]
  },
  driver: {
    role: 'driver',
    labelAr: 'مندوب التوصيل (Courier / Driver)',
    labelEn: 'Courier / Driver',
    descriptionAr: 'استلام وتوصيل الطلبات، التتبع الحي والأرباح (لا يمكنه الدخول إلا بعد موافقة المدير العام).',
    descriptionEn: 'Order delivery dispatch and earnings (requires General Manager approval).',
    badgeBg: 'bg-green-500/15',
    badgeBorder: 'border-green-500/40',
    badgeText: 'text-green-400',
    level: 20,
    permissions: [
      'ACCESS_DRIVER_DASHBOARD',
      'TRACK_DELIVERIES'
    ]
  },
  support: {
    role: 'support',
    labelAr: 'خدمة العملاء (Customer Support)',
    labelEn: 'Customer Support',
    descriptionAr: 'واجهة مخصصة فقط لعرض شكاوى ورسائل العملاء، مع صلاحيات الرد عليها ومعالجتها فقط.',
    descriptionEn: 'Dedicated view showing customer tickets and inquiries with reply-only capabilities.',
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/40',
    badgeText: 'text-cyan-400',
    level: 15,
    permissions: [
      'ACCESS_SUPPORT_CENTER',
      'HANDLE_COMPLAINTS'
    ]
  },
  customer: {
    role: 'customer',
    labelAr: 'العميل (Customer)',
    labelEn: 'Consumer',
    descriptionAr: 'تصفح المتجر، الشراء، الدفع، التتبع المباشر للطلبات، والمحفظة الرقمية.',
    descriptionEn: 'Shopping, ordering, live tracking, and digital wallet.',
    badgeBg: 'bg-slate-500/15',
    badgeBorder: 'border-slate-500/40',
    badgeText: 'text-slate-400',
    level: 10,
    permissions: []
  }
};

// Storage key for developer-customized permissions matrix
const DYNAMIC_PERMISSIONS_STORAGE_KEY = 'hadramout_dynamic_permissions_matrix_v1';

function getStoredDynamicPermissions(): Record<UserRole, Permission[]> {
  try {
    const raw = localStorage.getItem(DYNAMIC_PERMISSIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load dynamic permissions from storage:', e);
  }
  const initial: Record<string, Permission[]> = {};
  for (const roleKey of Object.keys(ROLE_CONFIGS)) {
    initial[roleKey] = [...ROLE_CONFIGS[roleKey as UserRole].permissions];
  }
  return initial as Record<UserRole, Permission[]>;
}

let dynamicPermissionsMap = getStoredDynamicPermissions();
const permissionListeners = new Set<() => void>();

export function getDynamicRolePermissions(role: UserRole): Permission[] {
  if (role === 'developer' || role === 'super_admin') {
    return ALL_SYSTEM_PERMISSIONS.map(p => p.id);
  }
  return dynamicPermissionsMap[role] || ROLE_CONFIGS[role]?.permissions || [];
}

export function updateDynamicRolePermissions(role: UserRole, permissions: Permission[]): void {
  // Developer and Super Admin cannot be restricted
  if (role === 'developer' || role === 'super_admin') return;

  dynamicPermissionsMap = {
    ...dynamicPermissionsMap,
    [role]: permissions
  };

  try {
    localStorage.setItem(DYNAMIC_PERMISSIONS_STORAGE_KEY, JSON.stringify(dynamicPermissionsMap));
  } catch (e) {
    console.warn('Failed to persist dynamic permissions:', e);
  }

  permissionListeners.forEach(listener => listener());
}

export function resetDynamicRolePermissions(): void {
  const initial: Record<string, Permission[]> = {};
  for (const roleKey of Object.keys(ROLE_CONFIGS)) {
    initial[roleKey] = [...ROLE_CONFIGS[roleKey as UserRole].permissions];
  }
  dynamicPermissionsMap = initial as Record<UserRole, Permission[]>;
  try {
    localStorage.removeItem(DYNAMIC_PERMISSIONS_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear dynamic permissions:', e);
  }
  permissionListeners.forEach(listener => listener());
}

export function subscribeToPermissions(listener: () => void): () => void {
  permissionListeners.add(listener);
  return () => permissionListeners.delete(listener);
}

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  // System Engineer (developer) & Super Admin have full omnipotent access across everything
  if (role === 'developer' || role === 'super_admin') {
    return true;
  }
  const perms = getDynamicRolePermissions(role);
  return perms.includes(permission);
}

export function canAccessAdminCenter(role: UserRole | undefined): boolean {
  return hasPermission(role, 'ACCESS_ADMIN_CENTER');
}

export function canAccessDeveloperCenter(role: UserRole | undefined): boolean {
  return hasPermission(role, 'ACCESS_DEVELOPER_CENTER');
}

export function isUserPendingApproval(user: AppUser | undefined): boolean {
  if (!user) return false;
  return (user.role === 'merchant' || user.role === 'driver') && user.status === 'pending';
}

export function canAccessDriverDashboard(userOrRole: AppUser | UserRole | undefined): boolean {
  if (!userOrRole) return false;
  if (typeof userOrRole === 'string') {
    return hasPermission(userOrRole, 'ACCESS_DRIVER_DASHBOARD');
  }
  // If user object
  if (userOrRole.role === 'developer' || userOrRole.role === 'super_admin' || userOrRole.role === 'admin' || userOrRole.role === 'manager') {
    return true;
  }
  // Driver MUST be active and approved to access dashboard
  if (userOrRole.status !== 'active') {
    return false;
  }
  return hasPermission(userOrRole.role, 'ACCESS_DRIVER_DASHBOARD');
}

export function canAccessMerchantDashboard(userOrRole: AppUser | UserRole | undefined): boolean {
  if (!userOrRole) return false;
  if (typeof userOrRole === 'string') {
    return hasPermission(userOrRole, 'ACCESS_MERCHANT_DASHBOARD');
  }
  // If user object
  if (userOrRole.role === 'developer' || userOrRole.role === 'super_admin' || userOrRole.role === 'admin' || userOrRole.role === 'manager') {
    return true;
  }
  // Merchant MUST be active and approved to access dashboard
  if (userOrRole.status !== 'active') {
    return false;
  }
  return hasPermission(userOrRole.role, 'ACCESS_MERCHANT_DASHBOARD');
}

export function canAccessSupportCenter(role: UserRole | undefined): boolean {
  return hasPermission(role, 'ACCESS_SUPPORT_CENTER');
}

export function isStaffRole(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['developer', 'manager', 'admin', 'support'].includes(role);
}

export function getRoleHierarchyLevel(role: UserRole): number {
  return ROLE_CONFIGS[role]?.level ?? 0;
}

export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === 'developer' || actorRole === 'manager' || actorRole === 'admin') return true;
  return false;
}

