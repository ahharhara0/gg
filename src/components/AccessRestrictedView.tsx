import React from 'react';
import { ShieldAlert, ArrowRight, ArrowRightLeft, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { ROLE_CONFIGS } from '../modules/auth/permissions';

interface AccessRestrictedViewProps {
  currentUser: AppUser;
  requestedArea: string;
  requiredPermission?: string;
  onBackToApp: () => void;
  onSwitchUser?: (user: AppUser) => void;
  allUsers?: AppUser[];
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  currentUser,
  requestedArea,
  requiredPermission,
  onBackToApp,
  onSwitchUser,
  allUsers = [],
}) => {
  const currentRole = currentUser?.role || 'customer';
  const roleConfig = ROLE_CONFIGS[currentRole];

  // Authorized candidates
  const authorizedUsers = allUsers.filter(
    (u) => u.role === 'developer' || u.role === 'super_admin' || u.role === 'admin' || u.role === 'manager'
  );

  return (
    <div className="min-h-screen bg-[#07131E] text-white flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="max-w-lg w-full bg-[#0B1E2E] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-900/20">
            <ShieldAlert className="w-9 h-9" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-center text-white mb-2">
          منطقة محظورة - غير مصرح بالدخول
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 text-center leading-relaxed mb-6">
          حسابك الحالي لا يمتلك الصلاحية المطلوبة للوصول إلى <span className="text-amber-400 font-bold">"{requestedArea}"</span>. تم ضبط النظام بحيث يقتصر كل مستخدم على صلاحياته المحددة فقط.
        </p>

        {/* Current Account Details */}
        <div className="bg-[#07131E] rounded-2xl p-4 border border-white/10 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">الحساب الحالي:</span>
            <span className="text-xs font-black text-white">{currentUser.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">نوع الدور:</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${roleConfig?.badgeBg || 'bg-slate-700'} ${roleConfig?.badgeText || 'text-white'} ${roleConfig?.badgeBorder || 'border-white/20'}`}>
              {roleConfig?.labelAr || currentRole}
            </span>
          </div>
          {requiredPermission && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-gray-400">الصلاحية المطلوبة:</span>
              <span className="text-[11px] font-mono text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                {requiredPermission}
              </span>
            </div>
          )}
        </div>

        {/* RBAC Notice */}
        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 text-xs text-amber-200">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            وفقاً لسياسة إدارة الأدوار والتحكم في الوصول (RBAC)، فإن <span className="font-bold text-white">مهندس النظام</span> هو المسؤول الحصري عن إدارة وتحديد الصلاحيات بين الحسابات وتخصيص الوصول.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onBackToApp}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30 cursor-pointer active:scale-98"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للواجهة المسموحة لدوري الحالي</span>
          </button>

          {onSwitchUser && authorizedUsers.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] text-gray-400 text-center mb-2">أو التبديل لحساب يملك الصلاحيات الكاملة:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {authorizedUsers.slice(0, 2).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onSwitchUser(user)}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 hover:text-white flex items-center justify-between transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden text-right">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{user.name}</span>
                    </div>
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded shrink-0">
                      {user.role === 'developer' ? 'مهندس النظام' : 'المدير'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
