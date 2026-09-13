import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  ToggleLeft, 
  ToggleRight, 
  AlertOctagon, 
  Save, 
  RotateCcw, 
  Check, 
  ShieldAlert, 
  Zap, 
  Sparkles,
  Truck,
  Wallet,
  Percent,
  Settings
} from 'lucide-react';
import { systemConfig, FeatureFlags, RemoteConfig, KillSwitches } from '../system/systemConfig';
import { AppUser } from '../../types';

interface FeatureFlagsRemoteConfigProps {
  currentUser: AppUser;
}

export const FeatureFlagsRemoteConfig: React.FC<FeatureFlagsRemoteConfigProps> = ({
  currentUser,
}) => {
  const [flags, setFlags] = useState<FeatureFlags>(systemConfig.getConfig().flags);
  const [remote, setRemote] = useState<RemoteConfig>(systemConfig.getConfig().remote);
  const [killSwitches, setKillSwitches] = useState<KillSwitches>(systemConfig.getConfig().killSwitches);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsub = systemConfig.subscribe((cfg) => {
      setFlags(cfg.flags);
      setRemote(cfg.remote);
      setKillSwitches(cfg.killSwitches);
    });
    return () => unsub();
  }, []);

  const handleToggleFlag = async (key: keyof FeatureFlags) => {
    const nextVal = !flags[key];
    const update = { [key]: nextVal };
    setFlags((prev) => ({ ...prev, ...update }));
    await systemConfig.updateFeatureFlags(update, currentUser.name, currentUser.role);
    triggerSaved();
  };

  const handleToggleKillSwitch = async (key: keyof KillSwitches) => {
    const nextVal = !killSwitches[key];
    if (nextVal) {
      const confirmed = confirm(`تنبيه حرج! هل أنت متأكد تماماً من تفعيل قاطع الطوارئ [${key}]؟ سيؤدي ذلك لإيقاف الوظيفة فوراً على كل الأجهزة.`);
      if (!confirmed) return;
    }
    setKillSwitches((prev) => ({ ...prev, [key]: nextVal }));
    await systemConfig.toggleKillSwitch(key, nextVal, currentUser.name, currentUser.role);
    triggerSaved();
  };

  const handleSaveRemoteConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await systemConfig.updateRemoteConfig(remote, currentUser.name, currentUser.role);
    triggerSaved();
  };

  const triggerSaved = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 text-right">
      {/* Emergency Kill Switches Section */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-200">
                قواطع الطوارئ اللحظية (Critical Emergency Kill Switches)
              </h3>
              <p className="text-xs text-rose-300/70 mt-0.5">
                تتيح لمهندس النظام إيقاف الوظائف الحيوية فوراً في حالات الاختراق، الأعطال، أو التحديثات الحساسة.
              </p>
            </div>
          </div>

          {savedSuccess && (
            <div className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>تم تحديث وتوثيق التغيير في سجل التدقيق</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Maintenance Mode */}
          <div className={`p-4 rounded-xl border transition-all ${
            killSwitches.maintenanceMode 
              ? 'bg-rose-600/30 border-rose-500 shadow-lg shadow-rose-900/50' 
              : 'bg-white/5 border-white/5 hover:border-white/10'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white">وضع الصيانة العام</span>
              <button 
                onClick={() => handleToggleKillSwitch('maintenanceMode')}
                className="cursor-pointer"
              >
                {killSwitches.maintenanceMode ? (
                  <ToggleRight className="w-7 h-7 text-rose-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              إغلاق المتجر أمام العملاء وعرض شاشة الصيانة التقنية.
            </p>
            <span className={`inline-block mt-3 text-[10px] font-bold px-2 py-0.5 rounded ${
              killSwitches.maintenanceMode ? 'bg-rose-500 text-white font-black' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {killSwitches.maintenanceMode ? 'مفعل (المتجر مغلق)' : 'غير مفعل (المتجر متاح)'}
            </span>
          </div>

          {/* Kill Checkout */}
          <div className={`p-4 rounded-xl border transition-all ${
            killSwitches.killSwitchCheckout 
              ? 'bg-rose-600/30 border-rose-500 shadow-lg shadow-rose-900/50' 
              : 'bg-white/5 border-white/5 hover:border-white/10'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white">قاطع إتمام الطلبات</span>
              <button 
                onClick={() => handleToggleKillSwitch('killSwitchCheckout')}
                className="cursor-pointer"
              >
                {killSwitches.killSwitchCheckout ? (
                  <ToggleRight className="w-7 h-7 text-rose-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              إيقاف عمليات الدفع وإتمام الطلب عند وجود مشاكل بالسداد.
            </p>
            <span className={`inline-block mt-3 text-[10px] font-bold px-2 py-0.5 rounded ${
              killSwitches.killSwitchCheckout ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {killSwitches.killSwitchCheckout ? 'معطل مؤقتاً' : 'يعمل طبيعياً'}
            </span>
          </div>

          {/* Kill Registrations */}
          <div className={`p-4 rounded-xl border transition-all ${
            killSwitches.killSwitchRegistrations 
              ? 'bg-rose-600/30 border-rose-500 shadow-lg shadow-rose-900/50' 
              : 'bg-white/5 border-white/5 hover:border-white/10'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white">قاطع التسجيل الجديد</span>
              <button 
                onClick={() => handleToggleKillSwitch('killSwitchRegistrations')}
                className="cursor-pointer"
              >
                {killSwitches.killSwitchRegistrations ? (
                  <ToggleRight className="w-7 h-7 text-rose-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              منع فتح حسابات مناديب أو تجار جديدة أثناء الحملات.
            </p>
            <span className={`inline-block mt-3 text-[10px] font-bold px-2 py-0.5 rounded ${
              killSwitches.killSwitchRegistrations ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {killSwitches.killSwitchRegistrations ? 'التسجيل مغلق' : 'التسجيل متاح'}
            </span>
          </div>

          {/* Kill Driver Acceptance */}
          <div className={`p-4 rounded-xl border transition-all ${
            killSwitches.killSwitchDriverAcceptance 
              ? 'bg-rose-600/30 border-rose-500 shadow-lg shadow-rose-900/50' 
              : 'bg-white/5 border-white/5 hover:border-white/10'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white">قاطع قبول الكباتن</span>
              <button 
                onClick={() => handleToggleKillSwitch('killSwitchDriverAcceptance')}
                className="cursor-pointer"
              >
                {killSwitches.killSwitchDriverAcceptance ? (
                  <ToggleRight className="w-7 h-7 text-rose-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              تجميد توزيع واستلام الطلبات من قبل المناديب مؤقتاً.
            </p>
            <span className={`inline-block mt-3 text-[10px] font-bold px-2 py-0.5 rounded ${
              killSwitches.killSwitchDriverAcceptance ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {killSwitches.killSwitchDriverAcceptance ? 'استلام الطلبات مجمد' : 'المناديب نشطة'}
            </span>
          </div>
        </div>
      </div>

      {/* Feature Flags Grid */}
      <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-5 shadow-xl">
        <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>مفاتيح الميزات البرمجية (Dynamic Feature Flags)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Flag 1 */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>المساعد الذكي واقتراحات الوصفات (AI Assistant)</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                تفعيل محرك Gemini لتوليد وصفات الطبخ ومقترحات التسوق الذكية.
              </p>
            </div>
            <button onClick={() => handleToggleFlag('enableAiAssistant')} className="cursor-pointer">
              {flags.enableAiAssistant ? <ToggleRight className="w-7 h-7 text-purple-400" /> : <ToggleLeft className="w-7 h-7 text-gray-500" />}
            </button>
          </div>

          {/* Flag 2 */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>التتبع المباشر لخريطة المندوب (Realtime Courier GPS)</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                تحديث مسار سيارة أو دراجة المندوب لحظياً عبر الخريطة التفاعلية.
              </p>
            </div>
            <button onClick={() => handleToggleFlag('enableRealtimeCourierGps')} className="cursor-pointer">
              {flags.enableRealtimeCourierGps ? <ToggleRight className="w-7 h-7 text-purple-400" /> : <ToggleLeft className="w-7 h-7 text-gray-500" />}
            </button>
          </div>

          {/* Flag 3 */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                <span>السحب الفوري لمحفظة المندوب والتاجر (Instant Payouts)</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                تحويل مستحقات التوصيل فور تسليم الطلب إلى محفظة بنك الكريمي.
              </p>
            </div>
            <button onClick={() => handleToggleFlag('enableInstantWalletPayouts')} className="cursor-pointer">
              {flags.enableInstantWalletPayouts ? <ToggleRight className="w-7 h-7 text-purple-400" /> : <ToggleLeft className="w-7 h-7 text-gray-500" />}
            </button>
          </div>

          {/* Flag 4 */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span>خصومات الشراء بالجملة والكرتون (Volume Discounts)</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                تطبيق خصم تلقائي عند شراء كرتون كامل أو كميات تزيد عن 5 حبات.
              </p>
            </div>
            <button onClick={() => handleToggleFlag('enableVolumeDiscounts')} className="cursor-pointer">
              {flags.enableVolumeDiscounts ? <ToggleRight className="w-7 h-7 text-purple-400" /> : <ToggleLeft className="w-7 h-7 text-gray-500" />}
            </button>
          </div>
        </div>
      </div>

      {/* Remote Config Form */}
      <form onSubmit={handleSaveRemoteConfig} className="bg-[#0D1527] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
            <span>الإعدادات السحابية المتغيرة (Remote Config Parameters)</span>
          </h4>
          <span className="text-[11px] text-gray-400 font-mono">نسخة التطبيق: {remote.appVersion}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-gray-300 font-bold mb-1.5">مدة التوصيل المعتمدة (SLA بالدقائق):</label>
            <input
              type="number"
              value={remote.deliverySlaMinutes}
              onChange={(e) => setRemote({ ...remote, deliverySlaMinutes: parseInt(e.target.value) || 30 })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1.5">الحد الأدنى للطلب (ريال يمني):</label>
            <input
              type="number"
              value={remote.minimumOrderAmountYER}
              onChange={(e) => setRemote({ ...remote, minimumOrderAmountYER: parseInt(e.target.value) || 0 })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1.5">حد التوصيل المجاني (ريال يمني):</label>
            <input
              type="number"
              value={remote.freeDeliveryThresholdYER}
              onChange={(e) => setRemote({ ...remote, freeDeliveryThresholdYER: parseInt(e.target.value) || 0 })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1.5">عمولة الكابتن من رسوم التوصيل (%):</label>
            <input
              type="number"
              value={remote.driverCommissionPercent}
              onChange={(e) => setRemote({ ...remote, driverCommissionPercent: parseInt(e.target.value) || 0 })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1.5">رقم هاتف الدعم الفني المباشر:</label>
            <input
              type="text"
              value={remote.customerSupportPhone}
              onChange={(e) => setRemote({ ...remote, customerSupportPhone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1.5">تنويه الطوارئ الشريطي (إن وجد):</label>
            <input
              type="text"
              value={remote.emergencyNoticeAr || ''}
              onChange={(e) => setRemote({ ...remote, emergencyNoticeAr: e.target.value })}
              placeholder="مثال: يرجى العلم بوجود أعمال صيانة الليلة..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-white/10">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وتحديث الإعدادات السحابية</span>
          </button>
        </div>
      </form>
    </div>
  );
};
