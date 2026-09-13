import React, { useState } from 'react';
import { 
  Code2, 
  Users, 
  Terminal, 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  RefreshCw, 
  Cpu, 
  Activity, 
  KeyRound, 
  Sparkles,
  Layers,
  SlidersHorizontal,
  Lock,
  UserCheck
} from 'lucide-react';
import { AppUser, UserRole } from '../types';

interface DeveloperDashboardViewProps {
  devUser?: AppUser;
  developer?: AppUser;
  users?: AppUser[];
  allUsers?: AppUser[];
  onUpdateUser: (updatedUser: AppUser) => void;
  onSwitchUser?: (user: AppUser) => void;
  onDeleteUser?: (userId: string) => void;
  onAddUser?: (newUser: AppUser) => void;
  onResetData: () => void;
  onBackToApp: () => void;
}

export const DeveloperDashboardView: React.FC<DeveloperDashboardViewProps> = ({
  devUser,
  developer,
  users,
  allUsers,
  onUpdateUser,
  onSwitchUser,
  onResetData,
  onBackToApp,
}) => {
  const effectiveDev = developer || devUser || { name: 'م. أحمد أمين بن حرهره', role: 'developer' as const };
  const effectiveUsers = users || allUsers || [];

  const [activeTab, setActiveTab] = useState<'users' | 'system' | 'logs'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [systemLogs, setSystemLogs] = useState<string[]>([
    '[INIT] Core Hadramout Hyper Kernel v2.3.7 initialized.',
    '[AUTH] RBAC Engine: Developer permissions verified (Ahmed Amin Bin Harharah).',
    '[ROUTING] Dynamic Subdomain sa.qeu1.app routing OK.',
    '[DB] In-Memory & LocalStorage synchronization active.',
    '[DELIVERY] Realtime courier tracking service online on port 3000.',
  ]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const userToUpdate = effectiveUsers.find((u) => u.id === userId);
    if (!userToUpdate) return;
    const updated = { ...userToUpdate, role: newRole };
    onUpdateUser(updated);
    setSystemLogs((prev) => [
      `[USER_MGMT] Developer changed role of user ${userToUpdate.name} (${userId}) to ${newRole}.`,
      ...prev,
    ]);
  };

  const filteredUsers = (effectiveUsers || []).filter(
    (u) =>
      u &&
      ((u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone || '').includes(searchQuery) ||
      (u.role || '').includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col flex-1 bg-[#090D16] text-white pb-16 font-sans text-right">
      {/* Dev Header */}
      <div className="bg-[#0D1527] border-b border-purple-500/30 p-4 sticky top-0 z-20 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              title="العودة للمتجر"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black flex items-center gap-1.5">
                  <Code2 className="w-5 h-5 text-purple-400" />
                  <span>مركز تحكم مطور التطبيق (Developer Console)</span>
                </h2>
                <span className="text-[10px] bg-purple-600 text-white font-black px-2 py-0.5 rounded-full">
                  ROOT ACCESS
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                المطور: <strong className="text-purple-300">{effectiveDev.name}</strong> • التحكم الشامل بجميع المستخدمين وقواعد البيانات
              </p>
            </div>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex gap-2 mt-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-300" />
            <span>التحكم بالمستخدمين واليوزر ({effectiveUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'system' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-300" />
            <span>حالة النظام والبيئة</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'logs' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-300" />
            <span>سجلات التشغيل (Live Logs)</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 space-y-4">
        {/* Tab 1: Full User & Account Control */}
        {activeTab === 'users' && (
          <div className="bg-[#0F1A30] border border-purple-500/20 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-purple-300 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span>التحكم الكامل بحسابات المستخدمين وتعديل الصلاحيات الفورية</span>
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  بصفتك مطور التطبيق، يحق لك تعديل رتبة أي حساب (مطور، مدير، تاجر، مندوب، عميل) أو تسجيل الدخول باسمه مباشرة.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن أي مستخدم في قاعدة البيانات..."
                className="w-full bg-[#090D16] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>

            {/* User List */}
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-2xl bg-[#0B1325] border border-white/10 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-400 font-bold">#{u.id}</span>
                      <h5 className="font-black text-white">{u.name}</h5>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-gray-300">
                        {u.phone}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      البريد: {u.email} • {u.storeName ? `المتجر: ${u.storeName}` : u.vehicleType ? `المركبة: ${u.vehicleType}` : 'حساب مستخدم قياسي'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Role changer dropdown */}
                    <div className="flex items-center gap-1.5 bg-[#090D16] px-2 py-1 rounded-xl border border-white/10">
                      <span className="text-[10px] text-gray-400">الصلاحية:</span>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="bg-transparent text-xs font-black text-purple-300 outline-none cursor-pointer"
                      >
                        <option value="developer" className="bg-[#090D16]">مطور (Developer)</option>
                        <option value="admin" className="bg-[#090D16]">مدير (Admin)</option>
                        <option value="merchant" className="bg-[#090D16]">تاجر (Merchant)</option>
                        <option value="driver" className="bg-[#090D16]">مندوب توصيل (Driver)</option>
                        <option value="customer" className="bg-[#090D16]">عميل (Customer)</option>
                      </select>
                    </div>

                    {/* Impersonate / Switch to this user */}
                    <button
                      onClick={() => onSwitchUser && onSwitchUser(u)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      title="محاكاة والدخول الفوري بالحساب"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>دخول كـ {u.name ? u.name.split(' ')[0] : 'مستخدم'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: System & Environment Info */}
        {activeTab === 'system' && (
          <div className="bg-[#0F1A30] border border-purple-500/20 rounded-3xl p-5 space-y-4 shadow-xl text-xs">
            <h4 className="text-sm font-black text-purple-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>معلومات بيئة تشغيل التطبيق (System Kernel)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#090D16] border border-white/10 space-y-1">
                <span className="text-gray-400 block text-[11px]">معمارية التطبيق</span>
                <span className="font-mono text-purple-300 font-bold">React 18 + Vite + Tailwind CSS v4</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#090D16] border border-white/10 space-y-1">
                <span className="text-gray-400 block text-[11px]">خادم النشر السحابي</span>
                <span className="font-mono text-emerald-400 font-bold">Google Cloud Run (Port 3000 Ingress)</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#090D16] border border-white/10 space-y-1">
                <span className="text-gray-400 block text-[11px]">المعرف التعريفي للتطبيق (Applet ID)</span>
                <span className="font-mono text-gray-300">b32f17eb-2bf6-4927-b056-eac60e5baed6</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#090D16] border border-white/10 space-y-1">
                <span className="text-gray-400 block text-[11px]">نظام الصلاحيات (RBAC)</span>
                <span className="font-mono text-amber-300 font-bold">Role-Based Multi-Tenancy Active</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-300 block">إعادة تهيئة البيانات الافتراضية (Seed Data):</span>
                <span className="text-[11px] text-gray-500">يقوم بإعادة تعيين المستخدمين والطلبات للمقادير الابتدائية للتجربة.</span>
              </div>
              <button
                onClick={onResetData}
                className="px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 border border-red-500/30 text-red-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة ضبط البيانات الافتراضية</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Logs */}
        {activeTab === 'logs' && (
          <div className="bg-[#090D16] border border-purple-500/30 rounded-3xl p-4 font-mono text-xs text-green-400 space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between text-gray-400 pb-2 border-b border-white/10">
              <span className="flex items-center gap-1.5 font-sans font-bold">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>Console Output</span>
              </span>
              <button
                onClick={() => setSystemLogs(['[LOGS_CLEARED] Session reset.'])}
                className="text-[10px] text-gray-400 hover:text-white cursor-pointer"
              >
                مسح السجلات
              </button>
            </div>

            <div className="space-y-1 max-h-72 overflow-y-auto">
              {systemLogs.map((log, i) => (
                <p key={i} className="text-[11px] leading-relaxed">
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
