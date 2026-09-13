import React, { useState } from 'react';
import { 
  Code2, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Sliders, 
  Database, 
  ArrowRight, 
  Terminal, 
  Sparkles, 
  ExternalLink,
  Store,
  Layers,
  CreditCard,
  SlidersHorizontal,
  Zap
} from 'lucide-react';
import { AppUser, PaymentMethodConfig, Order } from '../../types';
import { SystemHealthMonitor } from './SystemHealthMonitor';
import { SecurityRbacCenter } from './SecurityRbacCenter';
import { AuditLogsViewer } from './AuditLogsViewer';
import { FeatureFlagsRemoteConfig } from './FeatureFlagsRemoteConfig';
import { FirebaseInspector } from './FirebaseInspector';
import { PaymentMethodsAndAutomation } from './PaymentMethodsAndAutomation';
import { AppReconfigAndDynamicFeatures } from './AppReconfigAndDynamicFeatures';

interface DeveloperControlCenterProps {
  currentUser: AppUser;
  allUsers: AppUser[];
  paymentMethods?: PaymentMethodConfig[];
  orders?: Order[];
  onUpdateUser: (user: AppUser) => void;
  onUpdatePaymentMethods?: (methods: PaymentMethodConfig[]) => void;
  onUpdateOrder?: (order: Order) => void;
  onResetData: () => void;
  onBackToApp: () => void;
  onOpenAdminCenter?: () => void;
}

export const DeveloperControlCenter: React.FC<DeveloperControlCenterProps> = ({
  currentUser,
  allUsers,
  paymentMethods = [],
  orders = [],
  onUpdateUser,
  onUpdatePaymentMethods = () => {},
  onUpdateOrder,
  onResetData,
  onBackToApp,
  onOpenAdminCenter,
}) => {
  const [activeTab, setActiveTab] = useState<'health' | 'security' | 'payments' | 'reconfig' | 'audit' | 'flags' | 'database'>('payments');

  return (
    <div className="flex flex-col flex-1 bg-[#070B14] text-white min-h-screen font-sans text-right">
      {/* SaaS Developer Header */}
      <header className="bg-[#0A101D] border-b border-purple-500/30 sticky top-0 z-30 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
              title="العودة للمتجر الرئيسي"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Code2 className="w-4 h-4" />
                </div>
                <h1 className="text-sm sm:text-base font-black text-white">
                  مركز تحكم المطور والأنظمة (Developer Control Center)
                </h1>
                <span className="text-[9px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full font-mono">
                  ROOT / KERNEL v2.4
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                إدارة الأمان، الصلاحيات، سجل التدقيق، البنية التحتية، ومفاتيح الميزات.
              </p>
            </div>
          </div>

          {/* Quick Switch to Admin Center & Store */}
          <div className="flex items-center gap-2">
            {onOpenAdminCenter && (
              <button
                onClick={onOpenAdminCenter}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>لوحة المدير والعمليات</span>
              </button>
            )}

            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-amber-300" />
              <span>عرض المتجر</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto flex items-center gap-1 border-t border-white/5 pt-1 pb-1">
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>طرق الدفع وأتمتة العمليات (Payments & Auto)</span>
          </button>

          <button
            onClick={() => setActiveTab('reconfig')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'reconfig'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-pink-400" />
            <span>تعديل النظام والميزات (App Reconfig & Features)</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>الأمان ومصفوفة الصلاحيات (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'health'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>صحة النظام والبنية التحتية</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>سجل التدقيق (Audit Trail)</span>
          </button>

          <button
            onClick={() => setActiveTab('flags')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'flags'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>الميزات وقواطع الطوارئ (Flags & Config)</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'database'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span>قاعدة البيانات وFirebase</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1">
        {activeTab === 'payments' && (
          <PaymentMethodsAndAutomation
            currentUser={currentUser}
            paymentMethods={paymentMethods}
            orders={orders}
            onUpdatePaymentMethods={onUpdatePaymentMethods}
            onUpdateOrder={onUpdateOrder}
          />
        )}
        {activeTab === 'reconfig' && (
          <AppReconfigAndDynamicFeatures currentUser={currentUser} />
        )}
        {activeTab === 'health' && <SystemHealthMonitor />}
        {activeTab === 'security' && (
          <SecurityRbacCenter
            currentUser={currentUser}
            allUsers={allUsers}
            onUpdateUser={onUpdateUser}
          />
        )}
        {activeTab === 'audit' && <AuditLogsViewer />}
        {activeTab === 'flags' && (
          <FeatureFlagsRemoteConfig currentUser={currentUser} />
        )}
        {activeTab === 'database' && (
          <FirebaseInspector
            currentUser={currentUser}
            onResetData={onResetData}
          />
        )}
      </main>
    </div>
  );
};
