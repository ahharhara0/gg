import React from 'react';
import { 
  Clock, 
  Store, 
  Car, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRightLeft, 
  AlertTriangle,
  FileText,
  UserCheck
} from 'lucide-react';
import { AppUser } from '../types';

interface PendingApprovalViewProps {
  currentUser: AppUser;
  onBackToApp: () => void;
  onSwitchUser?: (user: AppUser) => void;
  allUsers?: AppUser[];
  onOpenAdminApproval?: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({
  currentUser,
  onBackToApp,
  onSwitchUser,
  allUsers = [],
  onOpenAdminApproval,
}) => {
  const isMerchant = currentUser.role === 'merchant';
  const isDriver = currentUser.role === 'driver';

  // Find General Manager or Admin to switch to for instant approval test
  const adminUser = allUsers.find(
    (u) => u.role === 'admin' || u.role === 'super_admin' || u.role === 'developer'
  );

  return (
    <div className="min-h-screen bg-[#07131E] text-white flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="max-w-lg w-full bg-[#0B1E2E] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow background effects */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Icon Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/40">
              {isMerchant ? <Store className="w-10 h-10" /> : isDriver ? <Car className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs border-2 border-[#0B1E2E]">
              <Clock className="w-4 h-4 animate-spin text-black" style={{ animationDuration: '6s' }} />
            </div>
          </div>
        </div>

        {/* Status Tag */}
        <div className="flex justify-center mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>الحساب قيد المراجعة والاعتماد (Pending Approval)</span>
          </span>
        </div>

        {/* Main Title */}
        <h2 className="text-xl sm:text-2xl font-black text-center text-white mb-2 leading-tight">
          لا يمكن الدخول إلى لوحة التحكم حتى الموافقة
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 text-center leading-relaxed mb-6">
          وفقاً للنظام الأمني والرقابي لحضرموت هايبر، <span className="text-amber-300 font-bold">لا يُسمح للتاجر أو مندوب التوصيل بالدخول إلى لوحة التحكم أو إضافة أي منتجات أو استلام أي طلبات</span> حتى يتم مراجعة بياناتك واعتماد الحساب رسمياً من قِبل <span className="text-emerald-400 font-bold">المدير العام</span>.
        </p>

        {/* Registered Application Details Card */}
        <div className="bg-[#07131E] rounded-2xl p-4 border border-white/10 mb-6 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-gray-400">اسم {isMerchant ? 'المتجر والمسؤول' : 'الكابتن'}:</span>
            <span className="font-black text-white">{currentUser.storeName || currentUser.name}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-gray-400">رقم الهاتف المسجل:</span>
            <span className="font-mono text-emerald-400 font-bold">{currentUser.phone}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-gray-400">الدور المطلوب:</span>
            <span className="font-bold text-amber-300">
              {isMerchant ? 'تاجر شريك (Partner Merchant)' : 'مندوب توصيل (Delivery Courier)'}
            </span>
          </div>

          {isMerchant && currentUser.commercialId && (
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-gray-400">رقم السجل التجاري / الترخيص:</span>
              <span className="font-mono text-gray-200">{currentUser.commercialId}</span>
            </div>
          )}

          {isDriver && currentUser.vehicleType && (
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-gray-400">وسيلة التوصيل:</span>
              <span className="font-bold text-gray-200">
                {currentUser.vehicleType === 'motorcycle' ? 'دراجة نارية 🏍️' : 'سيارة 🚗'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-400">حالة الصلاحيات:</span>
            <span className="text-[11px] font-bold text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
              محظور من العمليات حتى الاعتماد
            </span>
          </div>
        </div>

        {/* Informative Step Box */}
        <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-6 text-xs text-gray-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            يقوم فريق الإدارة العامة حالياً بمطابقة الوثائق المقدمة. بمجرد قيام المدير العام بالنقر على <span className="text-emerald-400 font-bold">"قبول واعتماد"</span> في مركز الإدارة، سيتم فتح لوحة التحكم لك فورياً.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* 1. Quick Switch to General Manager for Testing/Approval */}
          {adminUser && onSwitchUser && (
            <button
              onClick={() => {
                onSwitchUser(adminUser);
                if (onOpenAdminApproval) onOpenAdminApproval();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-950/40 cursor-pointer active:scale-98"
            >
              <UserCheck className="w-4 h-4" />
              <span>التبديل لحساب المدير العام (لاعتماد هذا المتجر الآن)</span>
            </button>
          )}

          {/* 2. Return to Main App/Store */}
          <button
            onClick={onBackToApp}
            className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer active:scale-98"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة وتصفح المتجر كعميل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
