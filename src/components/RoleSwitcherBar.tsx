import React, { useState } from 'react';
import { 
  User, 
  Truck, 
  Store, 
  ShieldCheck, 
  Code2, 
  ChevronDown, 
  UserPlus, 
  Sparkles,
  ArrowRightLeft,
  Globe,
  Layers,
  Shield,
  Activity,
  Headphones,
  Clock
} from 'lucide-react';
import { AppUser, UserRole, AppLanguage } from '../types';
import { 
  ROLE_CONFIGS, 
  canAccessAdminCenter, 
  canAccessDeveloperCenter,
  canAccessSupportCenter
} from '../modules/auth/permissions';

interface RoleSwitcherBarProps {
  currentUser: AppUser;
  allUsers: AppUser[];
  activeRoleView?: string | null;
  language?: AppLanguage;
  onToggleLanguage?: () => void;
  onSwitchUser: (user: AppUser) => void;
  onOpenRegister: () => void;
  onToggleDashboard?: () => void;
  onOpenAdminCenter?: () => void;
  onOpenDeveloperCenter?: () => void;
  onOpenSupportCenter?: () => void;
  onLogout?: () => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({
  currentUser,
  allUsers,
  activeRoleView,
  language = 'ar',
  onToggleLanguage,
  onSwitchUser,
  onOpenRegister,
  onToggleDashboard,
  onOpenAdminCenter,
  onOpenDeveloperCenter,
  onOpenSupportCenter,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  if (currentUser?.role === 'customer') return null;

  const getRoleBadge = (role: UserRole) => {
    const cfg = ROLE_CONFIGS[role];
    if (cfg) {
      return {
        label: language === 'ar' ? cfg.labelAr : role,
        color: `${cfg.badgeBg} ${cfg.badgeText} border ${cfg.badgeBorder}`,
        dotColor: role === 'super_admin' ? 'bg-rose-400' : role === 'developer' ? 'bg-purple-400' : role === 'admin' ? 'bg-emerald-400' : role === 'support' ? 'bg-cyan-400' : role === 'driver' ? 'bg-blue-400' : 'bg-emerald-400',
        icon: role === 'developer' ? Code2 : role === 'driver' ? Truck : role === 'merchant' ? Store : role === 'support' ? Headphones : ShieldCheck
      };
    }
    return { 
      label: language === 'ar' ? 'حساب العميل' : 'Customer', 
      color: 'bg-emerald-600 text-white', 
      dotColor: 'bg-emerald-400',
      icon: User 
    };
  };

  const currentRole = currentUser?.role || 'customer';
  const currentBadge = getRoleBadge(currentRole);
  const CurrentIcon = currentBadge.icon;
  const canDev = canAccessDeveloperCenter(currentRole);
  const canAdmin = canAccessAdminCenter(currentRole);
  const canSupport = canAccessSupportCenter(currentRole);

  return (
    <div className="bg-[#071D2F] border-b border-emerald-900/60 px-3 py-1.5 text-xs text-white relative z-40">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Current Active Account Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
            {language === 'ar' ? 'الحساب النشط:' : 'Active Account:'}
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer"
          >
            <span className={`w-2 h-2 rounded-full ${currentBadge.dotColor} animate-pulse`} />
            <CurrentIcon className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-black text-[11px] text-white">{currentUser?.name || (language === 'ar' ? 'المستخدم' : 'User')}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${currentBadge.color}`}>
              {currentBadge.label}
            </span>
            {currentUser?.status === 'pending' && (
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {language === 'ar' ? 'معلق للموافقة ⏳' : 'Pending ⏳'}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Quick Actions & Language Switcher */}
        <div className="flex items-center gap-1.5">
          {/* Language Toggle Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1 text-[10px] font-black bg-red-500/10 hover:bg-red-500/20 text-red-200 px-2 py-1 rounded-lg border border-red-500/20 transition-all cursor-pointer"
              title={language === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
            >
              <span>{language === 'ar' ? 'خروج' : 'Logout'}</span>
            </button>
          )}

          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1 text-[10px] font-black bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white px-2 py-1 rounded-lg border border-white/15 transition-all cursor-pointer shadow-xs"
              title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            >
              <Globe className="w-3 h-3 text-amber-300" />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>
          )}

          {/* Developer Control Center Button */}
          {canDev && onOpenDeveloperCenter && (
            <button
              onClick={onOpenDeveloperCenter}
              className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 ${
                activeRoleView === 'developer'
                  ? 'bg-purple-500 text-white font-black'
                  : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/30'
              }`}
            >
              <Code2 className="w-3 h-3 text-purple-300" />
              <span>{language === 'ar' ? 'مركز المطور ⚡' : 'Dev Center ⚡'}</span>
            </button>
          )}

          {/* Admin Control Center Button */}
          {canAdmin && onOpenAdminCenter && (
            <button
              onClick={onOpenAdminCenter}
              className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 ${
                activeRoleView === 'admin'
                  ? 'bg-emerald-500 text-white font-black'
                  : 'bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 border border-emerald-500/30'
              }`}
            >
              <Layers className="w-3 h-3 text-emerald-300" />
              <span>{language === 'ar' ? 'مركز الإدارة 🛠️' : 'Admin Center 🛠️'}</span>
            </button>
          )}

          {/* Customer Support View Button */}
          {canSupport && onOpenSupportCenter && (
            <button
              onClick={onOpenSupportCenter}
              className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 ${
                activeRoleView === 'support'
                  ? 'bg-cyan-500 text-black font-black'
                  : 'bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/30'
              }`}
            >
              <Headphones className="w-3 h-3 text-cyan-300" />
              <span>{language === 'ar' ? 'خدمة العملاء 🎧' : 'Support 🎧'}</span>
            </button>
          )}

          {/* Toggle Store or Driver/Merchant View */}
          {activeRoleView ? (
            <button
              onClick={onToggleDashboard}
              className="flex items-center gap-1 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-[#0B253A] px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3 h-3" />
              <span>{language === 'ar' ? 'عرض المتجر 🛍️' : 'View Store 🛍️'}</span>
            </button>
          ) : (
            currentRole !== 'customer' && onToggleDashboard && (
              <button
                onClick={onToggleDashboard}
                className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 ${
                  currentUser?.status === 'pending'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {currentUser?.status === 'pending' ? (
                  <>
                    <Clock className="w-3 h-3 text-amber-200" />
                    <span>{language === 'ar' ? 'حالة الاعتماد ⏳' : 'Approval Status ⏳'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>{language === 'ar' ? 'لوحة التحكم ⚡' : 'Dashboard ⚡'}</span>
                  </>
                )}
              </button>
            )
          )}

          <button
            onClick={onOpenRegister}
            className="flex items-center gap-1 text-[10px] font-bold bg-[#0E8A5E] hover:bg-[#095B3E] text-white px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3 h-3 text-[#F5A623]" />
            <span className="hidden sm:inline">{language === 'ar' ? 'تسجيل جديد' : 'New User'}</span>
          </button>
        </div>
      </div>

      {/* Role Selection Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-3 sm:right-6 mt-1 w-80 bg-[#0B253A] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden p-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-2 py-1.5 border-b border-white/10 flex items-center justify-between text-[11px] text-gray-300">
            <span className="font-black text-white flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>{language === 'ar' ? 'التبديل بين الحسابات والأدوار' : 'Switch Role Account'}</span>
            </span>
            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">
              {(allUsers || []).length} {language === 'ar' ? 'حسابات' : 'accounts'}
            </span>
          </div>

          <div className="space-y-1 mt-1.5 max-h-72 overflow-y-auto">
            {(allUsers || []).map((user) => {
              const b = getRoleBadge(user.role);
              const Icon = b.icon;
              const isSelected = user.id === currentUser.id;

              return (
                <button
                  key={user.id}
                  onClick={() => {
                    onSwitchUser(user);
                    setIsOpen(false);
                  }}
                  className={`w-full text-right p-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0E8A5E]/30 border border-[#0E8A5E] text-white font-black'
                      : 'hover:bg-white/5 text-gray-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 text-amber-300">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-[11px] text-white">{user.name}</p>
                      <p className="text-[9px] text-gray-400 font-mono">
                        {user.storeName || user.vehicleType || user.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {user.status === 'pending' && (
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {language === 'ar' ? 'معلق ⏳' : 'Pending ⏳'}
                      </span>
                    )}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${b.color}`}>
                      {b.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-white/10">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenRegister();
              }}
              className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-bold text-emerald-300 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#F5A623]" />
              <span>{language === 'ar' ? 'إنشاء حساب جديد بدور مخصص' : 'Create New Account'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
