import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Key, 
  Search, 
  UserCheck, 
  AlertCircle, 
  Check, 
  X, 
  ArrowUpDown, 
  Lock,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { AppUser, UserRole } from '../../types';
import { 
  ROLE_CONFIGS, 
  hasPermission, 
  Permission, 
  canManageRole,
  ALL_SYSTEM_PERMISSIONS,
  getDynamicRolePermissions,
  updateDynamicRolePermissions,
  resetDynamicRolePermissions,
  subscribeToPermissions
} from '../auth/permissions';
import { auditLogger } from '../audit/auditLogger';

interface SecurityRbacCenterProps {
  currentUser: AppUser;
  allUsers: AppUser[];
  onUpdateUser: (user: AppUser) => void;
}

export const SecurityRbacCenter: React.FC<SecurityRbacCenterProps> = ({
  currentUser,
  allUsers,
  onUpdateUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'matrix' | 'simulator'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AppUser | null>(null);
  const [newRoleForUser, setNewRoleForUser] = useState<UserRole>('customer');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [, setMatrixRefreshTicker] = useState(0);

  useEffect(() => {
    const unsub = subscribeToPermissions(() => {
      setMatrixRefreshTicker((prev) => prev + 1);
    });
    return () => unsub();
  }, []);

  // Simulator State
  const [simActor, setSimActor] = useState<UserRole>('operations');
  const [simPermission, setSimPermission] = useState<Permission>('MANAGE_ORDERS');

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone || '').includes(searchQuery) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (user: AppUser, newRole: UserRole) => {
    if (user.id === currentUser.id && newRole !== currentUser.role && currentUser.role === 'developer') {
      const confirmSelf = confirm('تحذير أمني: هل أنت متأكد من تعديل دور حسابك الحالي؟ قد تفقد صلاحيات الوصول لمركز المطور.');
      if (!confirmSelf) return;
    }

    const oldRole = user.role;
    const updated = { ...user, role: newRole };
    onUpdateUser(updated);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'USER_ROLE_ESCALATION_OR_CHANGE',
      category: 'security',
      targetEntity: 'AppUser',
      targetId: user.id,
      details: {
        targetUserName: user.name,
        targetUserPhone: user.phone,
        oldRole,
        newRole
      },
      severity: newRole === 'super_admin' || newRole === 'developer' ? 'critical' : 'warning',
      status: 'SUCCESS'
    });

    setStatusMessage(`تم تغيير دور ${user.name} بنجاح من (${oldRole}) إلى (${newRole})`);
    setTimeout(() => setStatusMessage(null), 4000);
    setSelectedUserForEdit(null);
  };

  const allPermissionsList: { id: Permission; labelAr: string; category: string }[] = [
    { id: 'MANAGE_USERS', labelAr: 'إدارة المستخدمين', category: 'الهوية والصلاحيات' },
    { id: 'ASSIGN_ROLES', labelAr: 'تعيين وتغيير الأدوار', category: 'الهوية والصلاحيات' },
    { id: 'VIEW_USER_PROFILES', labelAr: 'الاطلاع على ملفات العملاء', category: 'الهوية والصلاحيات' },
    { id: 'MANAGE_CATALOG', labelAr: 'إدارة المنتجات والأقسام', category: 'المتجر والكتالوج' },
    { id: 'MANAGE_PRICING', labelAr: 'تعديل الأسعار والخصومات', category: 'المتجر والكتالوج' },
    { id: 'ADJUST_INVENTORY', labelAr: 'تعديل المخزون المتاح', category: 'المتجر والكتالوج' },
    { id: 'MANAGE_ORDERS', labelAr: 'معالجة وتجهيز الطلبات', category: 'العمليات واللوجستيات' },
    { id: 'CANCEL_ORDERS', labelAr: 'إلغاء الطلبات وإرجاعها', category: 'العمليات واللوجستيات' },
    { id: 'DISPATCH_ORDERS', labelAr: 'توجيه المناديب للطلبات', category: 'العمليات واللوجستيات' },
    { id: 'VIEW_ALL_ORDERS', labelAr: 'استعراض كل الطلبات الحية', category: 'العمليات واللوجستيات' },
    { id: 'MANAGE_CMS', labelAr: 'إدارة محتوى التطبيق والبنرات', category: 'المحتوى والتسويق' },
    { id: 'VIEW_FINANCE', labelAr: 'الاطلاع على التقارير المالية', category: 'المالية والمحاسبة' },
    { id: 'MANAGE_PAYMENTS', labelAr: 'إدارة بوابات وطرق الدفع', category: 'المالية والمحاسبة' },
    { id: 'HANDLE_COMPLAINTS', labelAr: 'معالجة الشكاوى والدعم', category: 'خدمة العملاء' },
    { id: 'VIEW_AUDIT_LOGS', labelAr: 'عرض سجل التدقيق الأمني', category: 'الأمان والتقنية' },
    { id: 'MANAGE_FEATURE_FLAGS', labelAr: 'التحكم بمفاتيح الميزات', category: 'الأمان والتقنية' },
    { id: 'TOGGLE_MAINTENANCE', labelAr: 'تفعيل وضع الصيانة', category: 'الأمان والتقنية' },
    { id: 'TRIGGER_KILL_SWITCH', labelAr: 'تفعيل قواطع الطوارئ', category: 'الأمان والتقنية' },
    { id: 'RESET_DATABASE', labelAr: 'إعادة ضبط قاعدة البيانات', category: 'الأمان والتقنية' },
  ];

  return (
    <div className="space-y-6 text-right">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'users'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>حسابات المستخدمين وتعيين الأدوار ({allUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'matrix'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>مصفوفة الصلاحيات (RBAC Permission Matrix)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'simulator'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>محاكي التحقق من الصلاحيات (Zero-Trust Simulator)</span>
          </button>
        </div>

        {statusMessage && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* SubTab 1: Users List & Role Modifier */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، رقم الهاتف، أو البريد الإلكتروني..."
                className="w-full bg-[#0D1527] border border-white/10 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
              {(['all', 'super_admin', 'developer', 'admin', 'manager', 'operations', 'finance', 'support', 'merchant', 'driver', 'customer'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRoleFilter(r)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedRoleFilter === r
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  {r === 'all' ? 'الكل' : ROLE_CONFIGS[r]?.labelAr.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* User Table */}
          <div className="bg-[#0D1527] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-gray-400">
                    <th className="p-3 font-bold">المستخدم</th>
                    <th className="p-3 font-bold">رقم الهاتف / البريد</th>
                    <th className="p-3 font-bold">الدور الحالي</th>
                    <th className="p-3 font-bold">المحفظة / الرصيد</th>
                    <th className="p-3 font-bold">الإجراءات والصلاحيات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => {
                    const cfg = ROLE_CONFIGS[u.role] || ROLE_CONFIGS.customer;
                    const isSelf = u.id === currentUser.id;

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 font-black flex items-center justify-center text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.2 rounded-md">
                                    حسابك أنت
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-gray-400 font-mono">{u.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-mono text-gray-300">
                          <div>{u.phone}</div>
                          {u.email && <div className="text-[10px] text-gray-500">{u.email}</div>}
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText}`}>
                            <Shield className="w-3 h-3" />
                            <span>{cfg.labelAr}</span>
                          </span>
                        </td>

                        <td className="p-3 font-mono text-emerald-400 font-bold">
                          {(u.walletBalance || 0).toLocaleString()} ر.ي
                        </td>

                        <td className="p-3">
                          <button
                            onClick={() => {
                              setSelectedUserForEdit(u);
                              setNewRoleForUser(u.role);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3 text-purple-400" />
                            <span>تعديل الدور والصلاحيات</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Role Edit Modal */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1527] border border-purple-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>ترقية أو تغيير دور المستخدم</span>
              </h3>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400">المستخدم المستهدف:</p>
                <p className="text-sm font-black text-white mt-0.5">{selectedUserForEdit.name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedUserForEdit.phone}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">
                  اختر الدور الأمني الجديد:
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((r) => {
                    const cfg = ROLE_CONFIGS[r];
                    const isSelected = newRoleForUser === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setNewRoleForUser(r)}
                        className={`w-full text-right p-2.5 rounded-xl border text-xs transition-colors cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-600/20 border-purple-500 text-white font-black'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{cfg.labelAr}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{cfg.descriptionAr}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleRoleChange(selectedUserForEdit, newRoleForUser)}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-colors cursor-pointer"
                >
                  حفظ وتطبيق الدور في سجل التدقيق
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Interactive Dynamic Matrix */}
      {activeSubTab === 'matrix' && (
        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white">مصفوفة الصلاحيات الديناميكية التفاعلية (Dynamic RBAC Customizer)</h4>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
                  انقر على أي علامة لتغيير الصلاحية فوراً
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                صلاحية خاصة بمهندس النظام: انقر على أي خانة لمنح أو حجب الصلاحية عن أي دور. يتم الحفظ والتطبيق اللحظي في كامل المتجر.
              </p>
            </div>

            <button
              onClick={() => {
                if (confirm('هل تريد إعادة تعيين جميع الصلاحيات للوضع الافتراضي؟')) {
                  resetDynamicRolePermissions();
                  setStatusMessage('تمت استعادة الصلاحيات الافتراضية بنجاح.');
                  setTimeout(() => setStatusMessage(null), 3000);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>إعادة ضبط للمصنع</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-white/5 text-gray-300 border-b border-white/10">
                  <th className="p-2.5 font-bold border-l border-white/10 min-w-[190px]">الصلاحية (Permission)</th>
                  <th className="p-2 font-bold border-l border-white/10 text-center text-rose-300 text-[11px]">Super Admin</th>
                  <th className="p-2 font-bold border-l border-white/10 text-center text-purple-300 text-[11px]">Developer</th>
                  <th className="p-2 font-bold border-l border-white/10 text-center text-emerald-300 text-[11px]">Admin</th>
                  <th className="p-2 font-bold border-l border-white/10 text-center text-blue-300 text-[11px]">Operations</th>
                  <th className="p-2 font-bold border-l border-white/10 text-center text-amber-300 text-[11px]">Finance</th>
                  <th className="p-2 font-bold border-l border-white/10 text-center text-cyan-300 text-[11px]">Support</th>
                  <th className="p-2 font-bold border-l border-white/10 text-center text-yellow-300 text-[11px]">Merchant</th>
                  <th className="p-2 font-bold border-l border-white/10 text-center text-green-300 text-[11px]">Driver</th>
                  <th className="p-2 font-bold text-center text-slate-300 text-[11px]">Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {ALL_SYSTEM_PERMISSIONS.map((perm) => (
                  <tr key={perm.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-2.5 font-sans border-l border-white/10">
                      <span className="font-bold text-white block text-xs">{perm.labelAr}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{perm.id} • {perm.category}</span>
                    </td>
                    {(['super_admin', 'developer', 'admin', 'manager', 'operations', 'finance', 'support', 'merchant', 'driver', 'customer'] as const).map((r) => {
                      const isRoot = r === 'super_admin' || r === 'developer';
                      const currentPerms = getDynamicRolePermissions(r);
                      const allowed = isRoot ? true : currentPerms.includes(perm.id);

                      const handleToggle = () => {
                        if (isRoot) {
                          alert('مهندس النظام والمدير العام يمتلكان صلاحيات جذرية ثابتة (Root Access).');
                          return;
                        }
                        const next = allowed ? currentPerms.filter(p => p !== perm.id) : [...currentPerms, perm.id];
                        updateDynamicRolePermissions(r, next);
                        setStatusMessage(`تم تحديث صلاحية [${perm.id}] للدور [${r}]`);
                        setTimeout(() => setStatusMessage(null), 2500);
                      };

                      return (
                        <td key={r} className="p-1.5 text-center border-l border-white/10">
                          <button
                            disabled={isRoot}
                            onClick={handleToggle}
                            title={isRoot ? 'صلاحية شاملة ثابتة' : `انقر لتغيير صلاحية ${perm.id} للدور ${r}`}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                              allowed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:scale-105'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:scale-105'
                            } ${isRoot ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {allowed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 3: Simulator */}
      {activeSubTab === 'simulator' && (
        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-5 shadow-xl space-y-5">
          <div>
            <h4 className="text-sm font-black text-white">محاكي اختبار الصلاحيات اللحظي (Zero-Trust Rule Tester)</h4>
            <p className="text-xs text-gray-400 mt-1">
              اختبر ما إذا كان دور معين يمتلك صلاحية لتنفيذ أمر محدد قبل تفعيله في الإنتاج.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">اختر الدور الأمني (Actor Role):</label>
              <select
                value={simActor}
                onChange={(e) => setSimActor(e.target.value as UserRole)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((r) => (
                  <option key={r} value={r} className="bg-[#0D1527]">
                    {ROLE_CONFIGS[r].labelAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">اختر الصلاحية المراد اختبارها (Permission Target):</label>
              <select
                value={simPermission}
                onChange={(e) => setSimPermission(e.target.value as Permission)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {allPermissionsList.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0D1527]">
                    {p.labelAr} ({p.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result Box */}
          {(() => {
            const isAllowed = hasPermission(simActor, simPermission);
            return (
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isAllowed 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                    isAllowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {isAllowed ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  </div>
                  <div>
                    <h5 className="font-black text-sm">
                      {isAllowed ? 'النتيجة: مسموح (ACCESS GRANTED)' : 'النتيجة: محظور (PERMISSION DENIED)'}
                    </h5>
                    <p className="text-xs opacity-80 mt-0.5">
                      {isAllowed 
                        ? `الدور [${ROLE_CONFIGS[simActor].labelAr}] يمتلك حق تنفيذ [${simPermission}] وفق قواعد النظام.`
                        : `الدور [${ROLE_CONFIGS[simActor].labelAr}] لا يمتلك صلاحية [${simPermission}] وسيتم رفض الطلب بواسطة Zero-Trust Guard.`}
                    </p>
                  </div>
                </div>

                <span className={`text-xs font-mono font-black px-3 py-1 rounded-full ${
                  isAllowed ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
                }`}>
                  {isAllowed ? 'ALLOW' : 'DENY'}
                </span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
