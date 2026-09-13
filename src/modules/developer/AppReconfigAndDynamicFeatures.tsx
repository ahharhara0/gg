import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Settings, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  AlertOctagon, 
  Zap, 
  Truck, 
  Store, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Percent, 
  ToggleLeft, 
  ToggleRight, 
  Globe,
  Tag,
  Users
} from 'lucide-react';
import { systemConfig, FeatureFlags, RemoteConfig } from '../system/systemConfig';
import { AppUser, UserRole } from '../../types';
import { auditLogger } from '../audit/auditLogger';

export interface CustomDynamicFeature {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  description: string;
  targetRole: UserRole | 'all';
  isEnabled: boolean;
  createdAt: string;
}

const STORAGE_CUSTOM_FEATURES_KEY = 'hadramout_custom_dynamic_features_v1';

function getStoredCustomFeatures(): CustomDynamicFeature[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_FEATURES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading custom features from storage:', e);
  }
  return [
    {
      id: 'feat-smart-barcode',
      key: 'enableSmartBarcodeAi',
      nameAr: 'الماسح الذكي للباركود مع اقتراح الوصفات',
      nameEn: 'AI Smart Barcode Scanner & Recipes',
      description: 'مسح باركود المنتجات في المنزل وإضافتها مباشرة لسلة التوصيل مع اقتراح أطباق حضرمية مرافقة.',
      targetRole: 'customer',
      isEnabled: true,
      createdAt: '2026-03-01'
    },
    {
      id: 'feat-express-20',
      key: 'enableExpress20Delivery',
      nameAr: 'الشحن الفائق خلال 20 دقيقة (Hyper Express)',
      nameEn: 'Ultra Fast 20-Min Delivery',
      description: 'توجيه الطلب لأقرب كابتن دراجة نارية في محيط 2 كم من الفرع لتوصيل السلع الأساسية فورياً.',
      targetRole: 'all',
      isEnabled: true,
      createdAt: '2026-03-05'
    },
    {
      id: 'feat-group-buying',
      key: 'enableNeighborhoodGroupBuy',
      nameAr: 'الشراء التشاركي مع الجيران (Neighbor Cart Split)',
      nameEn: 'Neighborhood Group Buying',
      description: 'تجميع طلبات نفس الحي أو المربع السكني وإلغاء رسوم التوصيل تلقائياً عند تجاوز 3 منازل.',
      targetRole: 'customer',
      isEnabled: false,
      createdAt: '2026-03-10'
    }
  ];
}

interface AppReconfigAndDynamicFeaturesProps {
  currentUser: AppUser;
}

export const AppReconfigAndDynamicFeatures: React.FC<AppReconfigAndDynamicFeaturesProps> = ({
  currentUser,
}) => {
  const [remote, setRemote] = useState<RemoteConfig>(systemConfig.getConfig().remote);
  const [flags, setFlags] = useState<FeatureFlags>(systemConfig.getConfig().flags);
  const [customFeatures, setCustomFeatures] = useState<CustomDynamicFeature[]>(getStoredCustomFeatures());
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // App Branding & Store Global Config
  const [storeNameAr, setStoreNameAr] = useState('حضرموت هايبر ماركت');
  const [storeNameEn, setStoreNameEn] = useState('Hadramout Hypermarket');
  const [storeSloganAr, setStoreSloganAr] = useState('سوقكم الأول في اليمن • أسعار الجملة وجودة أصلية');
  const [workingHoursAr, setWorkingHoursAr] = useState('طوال أيام الأسبوع: 24/7 (خدمة التوصيل مستمرة)');
  const [exchangeRateYerToSar, setExchangeRateYerToSar] = useState(420); // 1 SAR = 420 YER

  // Modal for Adding Dynamic Feature
  const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState(false);
  const [newFeatureKey, setNewFeatureKey] = useState('');
  const [newFeatureNameAr, setNewFeatureNameAr] = useState('');
  const [newFeatureNameEn, setNewFeatureNameEn] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');
  const [newFeatureRole, setNewFeatureRole] = useState<UserRole | 'all'>('all');
  const [newFeatureEnabled, setNewFeatureEnabled] = useState(true);

  useEffect(() => {
    const unsub = systemConfig.subscribe((cfg) => {
      setFlags(cfg.flags);
      setRemote(cfg.remote);
    });
    return () => unsub();
  }, []);

  const handleSaveAppConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await systemConfig.updateRemoteConfig(remote, currentUser.name, currentUser.role);
    
    // Save brand preferences
    try {
      localStorage.setItem('hadramout_store_brand_meta', JSON.stringify({
        storeNameAr,
        storeNameEn,
        storeSloganAr,
        workingHoursAr,
        exchangeRateYerToSar
      }));
    } catch (err) {
      console.warn('Brand store error:', err);
    }

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'SYSTEM_SETTINGS_GLOBAL_RECONFIGURED',
      category: 'system',
      targetEntity: 'SystemConfig',
      targetId: 'remoteConfig',
      details: { remote, storeNameAr, exchangeRateYerToSar },
      severity: 'warning'
    });

    setSavedSuccess('تم حفظ ونشر جميع التعديلات والإعدادات على مستوى النظام بالكامل!');
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  const handleToggleCoreFlag = async (key: keyof FeatureFlags) => {
    const nextVal = !flags[key];
    const update = { [key]: nextVal };
    setFlags((prev) => ({ ...prev, ...update }));
    await systemConfig.updateFeatureFlags(update, currentUser.name, currentUser.role);
    setSavedSuccess(`تم تحديث حالة الميزة [${key}] إلى (${nextVal ? 'مفعلة' : 'معطلة'})`);
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleToggleCustomFeature = (featureId: string) => {
    const updated = customFeatures.map(f => {
      if (f.id === featureId) {
        return { ...f, isEnabled: !f.isEnabled };
      }
      return f;
    });
    setCustomFeatures(updated);
    try {
      localStorage.setItem(STORAGE_CUSTOM_FEATURES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving custom features:', e);
    }
  };

  const handleDeleteCustomFeature = (featureId: string, featureName: string) => {
    const confirmed = confirm(`هل أنت متأكد من حذف الميزة البرمجية [${featureName}] من النظام؟`);
    if (!confirmed) return;

    const updated = customFeatures.filter(f => f.id !== featureId);
    setCustomFeatures(updated);
    try {
      localStorage.setItem(STORAGE_CUSTOM_FEATURES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving custom features:', e);
    }
  };

  const handleCreateCustomFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeatureNameAr.trim() || !newFeatureKey.trim()) return;

    const newFeature: CustomDynamicFeature = {
      id: `feat-${Date.now()}`,
      key: newFeatureKey.trim().replace(/\s+/g, '_'),
      nameAr: newFeatureNameAr.trim(),
      nameEn: newFeatureNameEn.trim() || newFeatureKey.trim(),
      description: newFeatureDesc.trim() || 'ميزة برمجية ديناميكية مضافة بواسطة مهندس النظام.',
      targetRole: newFeatureRole,
      isEnabled: newFeatureEnabled,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newFeature, ...customFeatures];
    setCustomFeatures(updated);
    try {
      localStorage.setItem(STORAGE_CUSTOM_FEATURES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Error saving custom features:', err);
    }

    setIsAddFeatureModalOpen(false);
    setNewFeatureKey('');
    setNewFeatureNameAr('');
    setNewFeatureNameEn('');
    setNewFeatureDesc('');

    setSavedSuccess(`تمت إضافة الميزة البرمجية [${newFeature.nameAr}] بنجاح وتفعيلها في التطبيق!`);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Top Banner */}
      <div className="bg-[#0B1528] border border-purple-500/30 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                تعديل النظام الشامل وإضافة الميزات البرمجية (System Reconfig & Dynamic Features)
              </h3>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono">
                ROOT CONFIG v2.4
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              صلاحية كاملة لمهندس النظام: التحكم بأي متغير في التطبيق (الأسعار، الشحن، ساعات العمل، الهوية) وإضافة ميزات وتعديلات مخصصة.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddFeatureModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة ميزة برمجية جديدة (Add Custom Feature)</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Section 1: Global App Settings Form */}
      <form onSubmit={handleSaveAppConfig} className="bg-[#0E172A] border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">إعدادات التطبيق والمتجر العامة (Global App Parameters)</h4>
              <p className="text-[11px] text-gray-400">تعديل فوري ينعكس على السلة، رسوم التوصيل، والهوية المؤسسية</p>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>حفظ وتعميم التعديلات فوراً</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Store Name AR */}
          <div className="space-y-1">
            <label className="font-bold text-gray-300 block">اسم التطبيق والمتجر (بالعربية):</label>
            <input
              type="text"
              value={storeNameAr}
              onChange={(e) => setStoreNameAr(e.target.value)}
              className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          {/* Store Name EN */}
          <div className="space-y-1">
            <label className="font-bold text-gray-300 block">اسم التطبيق والمتجر (بالإنجليزية):</label>
            <input
              type="text"
              value={storeNameEn}
              onChange={(e) => setStoreNameEn(e.target.value)}
              className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 font-sans"
            />
          </div>

          {/* Slogan */}
          <div className="space-y-1">
            <label className="font-bold text-gray-300 block">الشعار الترويجي (Slogan):</label>
            <input
              type="text"
              value={storeSloganAr}
              onChange={(e) => setStoreSloganAr(e.target.value)}
              className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          {/* Working Hours */}
          <div className="space-y-1">
            <label className="font-bold text-gray-300 block">أوقات العمل واستقبال الطلبات:</label>
            <input
              type="text"
              value={workingHoursAr}
              onChange={(e) => setWorkingHoursAr(e.target.value)}
              className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
            />
          </div>

          {/* Minimum Order */}
          <div className="space-y-1">
            <label className="font-bold text-gray-300 block">الحد الأدنى لقيمة الطلب (ر.ي):</label>
            <input
              type="number"
              value={remote.minimumOrderAmountYER}
              onChange={(e) => setRemote({ ...remote, minimumOrderAmountYER: Number(e.target.value) })}
              className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-purple-300 font-mono outline-none focus:border-purple-500"
            />
          </div>

          {/* Free Delivery Threshold */}
          <div className="space-y-1">
            <label className="font-bold text-gray-300 block">حد التوصيل المجاني للعميل (ر.ي):</label>
            <input
              type="number"
              value={remote.freeDeliveryThresholdYER}
              onChange={(e) => setRemote({ ...remote, freeDeliveryThresholdYER: Number(e.target.value) })}
              className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-emerald-300 font-mono outline-none focus:border-purple-500"
            />
          </div>

          {/* Delivery SLA Minutes */}
          <div className="space-y-1">
            <label className="font-bold text-gray-300 block">وقت التوصيل المستهدف (دقيقة):</label>
            <input
              type="number"
              value={remote.deliverySlaMinutes}
              onChange={(e) => setRemote({ ...remote, deliverySlaMinutes: Number(e.target.value) })}
              className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-amber-300 font-mono outline-none focus:border-purple-500"
            />
          </div>

          {/* Tax Rate */}
          <div className="space-y-1">
            <label className="font-bold text-gray-300 block">نسبة الضريبة المضافة (%):</label>
            <input
              type="number"
              value={remote.taxRatePercent}
              onChange={(e) => setRemote({ ...remote, taxRatePercent: Number(e.target.value) })}
              className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-cyan-300 font-mono outline-none focus:border-purple-500"
            />
          </div>

          {/* Exchange Rate SAR to YER */}
          <div className="space-y-1">
            <label className="font-bold text-gray-300 block">سعر صرف الريال السعودي (1 ر.س = ؟ ر.ي):</label>
            <input
              type="number"
              value={exchangeRateYerToSar}
              onChange={(e) => setExchangeRateYerToSar(Number(e.target.value))}
              className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-yellow-300 font-mono outline-none focus:border-purple-500"
            />
          </div>

          {/* Support Phone */}
          <div className="space-y-1">
            <label className="font-bold text-gray-300 block">هاتف الدعم الفني وخدمة العملاء:</label>
            <input
              type="text"
              value={remote.customerSupportPhone}
              onChange={(e) => setRemote({ ...remote, customerSupportPhone: e.target.value })}
              className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-purple-500"
            />
          </div>

          {/* Emergency Notice */}
          <div className="sm:col-span-2 space-y-1">
            <label className="font-bold text-gray-300 block">شريط إعلان الطوارئ العام (يظهر أعلى المتجر للجميع):</label>
            <input
              type="text"
              value={remote.emergencyNoticeAr || ''}
              onChange={(e) => setRemote({ ...remote, emergencyNoticeAr: e.target.value })}
              placeholder="اكتب رسالة طارئة هنا أو اتركها فارغة للإخفاء..."
              className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-amber-300 outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </form>

      {/* Section 2: Custom Dynamic Features Manager */}
      <div className="bg-[#0E172A] border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                الميزات والتعديلات البرمجية المضافة ديناميكياً ({customFeatures.length})
              </h4>
              <p className="text-[11px] text-gray-400">
                ميزات برمجية أضافها مهندس النظام، يمكن التحكم بتشغيلها، تعطيلها، أو حذفها
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddFeatureModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة ميزة</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customFeatures.map((feat) => (
            <div
              key={feat.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                feat.isEnabled
                  ? 'bg-[#080D1A] border-purple-500/40 hover:border-purple-500/70 shadow-lg'
                  : 'bg-[#080D1A]/50 border-white/5 opacity-65'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className="text-xs font-black text-white">{feat.nameAr}</h5>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      feat.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {feat.isEnabled ? 'مفعلة' : 'معطلة'}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-purple-300 block mb-2">
                  Key: {feat.key}
                </span>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {feat.description}
                </p>

                <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 border-t border-white/5 pt-2">
                  <Users className="w-3 h-3 text-cyan-400" />
                  <span>الفئة المستهدفة: <strong className="text-gray-200">{feat.targetRole === 'all' ? 'جميع المستخدمين' : feat.targetRole}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-3">
                <button
                  onClick={() => handleToggleCustomFeature(feat.id)}
                  className={`text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    feat.isEnabled
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  }`}
                >
                  {feat.isEnabled ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>إيقاف الميزة</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>تشغيل الميزة</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDeleteCustomFeature(feat.id, feat.nameAr)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                  title="حذف الميزة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Core Feature Flags */}
      <div className="bg-[#0E172A] border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-black text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>مفاتيح ميزات النواة الأساسية للتطبيق (Core Feature Toggles)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {[
            { key: 'enableAiAssistant', label: 'المساعد الذكي للطبخ والمقادير', desc: 'اقتراح المنتجات التلقائي' },
            { key: 'enableRealtimeCourierGps', label: 'تتبع كابتن التوصيل على الخريطة', desc: 'تحديث الموقع الحي كل 5 ثواني' },
            { key: 'enableInstantWalletPayouts', label: 'السحب الفوري من المحفظة', desc: 'تحويل أرباح المناديب والتجار' },
            { key: 'enableVolumeDiscounts', label: 'خصومات الكميات وعروض الشراء', desc: 'خصم تلقائي بالسلة' },
            { key: 'enableLoyaltyWheel', label: 'عجلة الحظ ونقاط الولاء', desc: 'كسب النقاط والجوائز اليومية' },
            { key: 'enableGuestOrdering', label: 'الطلب السريع بدون تسجيل دخول', desc: 'إتمام الشراء السريع للزوار' },
            { key: 'enableZeroTrustTelemetry', label: 'تدقيق الأمان والقياس اللحظي', desc: 'حماية وحظر الجلسات المشبوهة' },
          ].map((item) => (
            <div
              key={item.key}
              className="p-3.5 rounded-2xl bg-[#080D1A] border border-white/10 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-white block">{item.label}</span>
                <span className="text-[10px] text-gray-400">{item.desc}</span>
              </div>
              <button
                onClick={() => handleToggleCoreFlag(item.key as keyof FeatureFlags)}
                className={`p-1.5 rounded-xl cursor-pointer transition-all ${
                  flags[item.key as keyof FeatureFlags]
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-gray-500 bg-gray-800'
                }`}
              >
                {flags[item.key as keyof FeatureFlags] ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Feature Modal */}
      {isAddFeatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0E172A] border border-purple-500/40 text-white rounded-3xl overflow-hidden shadow-2xl p-6 relative flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">إضافة ميزة برمجية جديدة للتطبيق</h4>
                  <p className="text-[11px] text-gray-400">تتيح لمهندس النظام استحداث خواص مخصصة فوراً</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddFeatureModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomFeature} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">المعرف البرمجي للميزة (Feature Key) *</label>
                <input
                  type="text"
                  required
                  value={newFeatureKey}
                  onChange={(e) => setNewFeatureKey(e.target.value)}
                  placeholder="e.g. enableDroneDelivery أو enableCryptoWallet"
                  className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-purple-300 font-mono outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">اسم الميزة بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={newFeatureNameAr}
                    onChange={(e) => setNewFeatureNameAr(e.target.value)}
                    placeholder="مثال: التوصيل بالطائرات المسيرة"
                    className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">اسم الميزة بالإنجليزية</label>
                  <input
                    type="text"
                    value={newFeatureNameEn}
                    onChange={(e) => setNewFeatureNameEn(e.target.value)}
                    placeholder="e.g. Drone Delivery Service"
                    className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">وصف الميزة وطريقة عملها</label>
                <textarea
                  rows={3}
                  value={newFeatureDesc}
                  onChange={(e) => setNewFeatureDesc(e.target.value)}
                  placeholder="وضح كيف تؤثر هذه الميزة على تجربة المستخدمين أو المبيعات..."
                  className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">الفئة المستهدفة:</label>
                  <select
                    value={newFeatureRole}
                    onChange={(e) => setNewFeatureRole(e.target.value as any)}
                    className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="all">جميع المستخدمين (All)</option>
                    <option value="customer">العملاء فقط (Customers)</option>
                    <option value="driver">مناديب التوصيل فقط (Drivers)</option>
                    <option value="merchant">التجار الشركاء فقط (Merchants)</option>
                    <option value="admin">الإدارة فقط (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">الحالة المبدئية:</label>
                  <button
                    type="button"
                    onClick={() => setNewFeatureEnabled(!newFeatureEnabled)}
                    className={`w-full py-2 rounded-xl font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      newFeatureEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {newFeatureEnabled ? 'مفعلة تلقائياً' : 'معطلة مبدئياً'}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddFeatureModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black cursor-pointer shadow-lg shadow-purple-600/30"
                >
                  إضافة الميزة البرمجية الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
