import React, { useState } from 'react';
import { 
  FileCode2, 
  Layers, 
  Cpu, 
  Terminal, 
  Database, 
  Share2, 
  Check, 
  X, 
  ExternalLink,
  Smartphone,
  ChevronDown
} from 'lucide-react';
import { DEVELOPER_INFO } from '../data/initialCatalog';

interface ArchitectureDocsViewProps {
  isOpen?: boolean;
  onClose: () => void;
}

export const ArchitectureDocsView: React.FC<ArchitectureDocsViewProps> = ({ isOpen = true, onClose }) => {
  const [activeDocTab, setActiveDocTab] = useState<'OVERVIEW' | 'DIAGRAMS' | 'SCREENS' | 'CHANNELS' | 'DB' | 'STUDIO'>('OVERVIEW');
  const [copied, setCopied] = useState(false);

  // Support ESC key to dismiss modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyDoc = () => {
    navigator.clipboard.writeText(
      `تطبيق حضرموت هايبر الرسمي | HADRAMOUT HYPER OFFICIAL APP\nالمبرمج: أحمد أمين بن هرهره\nالنسخة: 2.3.7 (Build 152)\nمعرف الحزمة: sa.qeu1.app`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-4xl h-[92vh] bg-[#0B253A] text-white rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top title bar */}
        <div className="bg-[#095B3E] p-4 flex items-center justify-between border-b border-white/10 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0E8A5E] text-[#F5A623] flex items-center justify-center font-bold">
              <FileCode2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">دليل التوثيق والهندسة المعمارية</h2>
                <span className="text-[10px] bg-[#F5A623] text-[#0B253A] font-black px-2 py-0.5 rounded-full">
                  رسمي معتمد
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                حضرموت هايبر • {DEVELOPER_INFO.developerTitle} • v{DEVELOPER_INFO.version} (Build {DEVELOPER_INFO.buildNumber})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyDoc}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
              title="نسخ ملخص التوثيق"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'تم النسخ' : 'مشاركة'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-red-500/80 hover:text-white flex items-center justify-center text-white cursor-pointer transition-all active:scale-95 shadow-sm"
              title="إغلاق دليل التوثيق (X)"
              aria-label="إغلاق دليل التوثيق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#081f30] px-4 py-2 border-b border-white/10 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveDocTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeDocTab === 'OVERVIEW'
                ? 'bg-[#0E8A5E] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            نظرة عامة وهوية المشروع
          </button>
          <button
            onClick={() => setActiveDocTab('DIAGRAMS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeDocTab === 'DIAGRAMS'
                ? 'bg-[#0E8A5E] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            المخططات المعمارية (ASCII)
          </button>
          <button
            onClick={() => setActiveDocTab('SCREENS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeDocTab === 'SCREENS'
                ? 'bg-[#0E8A5E] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            خريطة الـ 18 شاشة
          </button>
          <button
            onClick={() => setActiveDocTab('CHANNELS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeDocTab === 'CHANNELS'
                ? 'bg-[#0E8A5E] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            قنوات الربط (Platform Channels)
          </button>
          <button
            onClick={() => setActiveDocTab('DB')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeDocTab === 'DB'
                ? 'bg-[#0E8A5E] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            جداول SQLite والمخزن المحلي
          </button>
          <button
            onClick={() => setActiveDocTab('STUDIO')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeDocTab === 'STUDIO'
                ? 'bg-[#0E8A5E] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            دليل تشغيل Android Studio
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-sm text-gray-200">
          {/* OVERVIEW TAB */}
          {activeDocTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="bg-white/5 p-5 rounded-3xl border border-emerald-500/20">
                <h3 className="text-base font-black text-[#F5A623] mb-2">
                  1. نظرة عامة وهوية المشروع (Hadramout Hyper Rebranding)
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  تمت ترقية وتخصيص هذا التطبيق التجاري ليكون المنصة الرقمية الرائدة لـ &quot;حضرموت هايبر&quot;،
                  التي تقدم تجربة تسوق هايبر ماركت عصرية، فائقة السرعة، ومدعومة بأحدث تقنيات التجارة السريعة
                  (Quick Commerce) والذكاء الاصطناعي والمساعد الصوتي التفاعلي.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                    <span className="text-gray-400 block text-[10px]">مبرمج ومطور التطبيق:</span>
                    <strong className="text-white text-sm">أحمد أمين بن هرهره</strong>
                    <span className="text-emerald-300 block text-[10px] mt-0.5">Ahmed Ameen Bin Harhara</span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                    <span className="text-gray-400 block text-[10px]">بيانات البناء:</span>
                    <span className="text-white font-mono font-bold block">
                      النسخة: 2.3.7 | رقم البناء: 152
                    </span>
                    <span className="text-emerald-300 font-mono text-[10px] block">
                      معرف الحزمة: sa.qeu1.app
                    </span>
                  </div>
                </div>
              </div>

              {/* Color Palette Palette */}
              <div className="bg-white/5 p-5 rounded-3xl border border-emerald-500/20">
                <h4 className="text-xs font-black text-[#F5A623] mb-3">
                  الهوية البصرية المعتمدة لحضرموت هايبر:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-3 rounded-2xl bg-[#0E8A5E] text-white">
                    <span className="block font-black">أخضر زمردي</span>
                    <span className="font-mono text-[10px] opacity-80">#0E8A5E</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#095B3E] text-white">
                    <span className="block font-black">أخضر داكن</span>
                    <span className="font-mono text-[10px] opacity-80">#095B3E</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F5A623] text-[#0B253A]">
                    <span className="block font-black">ذهبي تجاري</span>
                    <span className="font-mono text-[10px] font-bold">#F5A623</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0B253A] text-white border border-white/20">
                    <span className="block font-black">كحلي ليلي</span>
                    <span className="font-mono text-[10px] opacity-80">#0B253A</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F4F8F5] text-[#0B253A]">
                    <span className="block font-black">سطح ثلجي</span>
                    <span className="font-mono text-[10px] font-bold">#F4F8F5</span>
                  </div>
                </div>
              </div>

              {/* Core hybrid architecture layers */}
              <div className="bg-white/5 p-5 rounded-3xl border border-emerald-500/20">
                <h4 className="text-xs font-black text-[#F5A623] mb-2">
                  المعمارية الهندسية الهجينة (Hybrid System Architecture):
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <strong className="text-emerald-300 block mb-1">أ) الطبقة الأصلية لنظام أندرويد (Native Android Host):</strong>
                    <p className="text-gray-300">
                      كوتلن (Kotlin & Android Jetpack) عبر <code>sa.qeu1.app.MainActivity</code>، إدارة دورة الحياة، أبعاد النتوء والحواف المنحنية (Screen Cutout & Corner Radius)، وتتبع إحالات متجر Google Play.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <strong className="text-emerald-300 block mb-1">ب) محرك فلاتر والتحديثات السحابية (Flutter & Shorebird Engine):</strong>
                    <p className="text-gray-300">
                      محرك Flutter C++ الرسومي عبر <code>libflutter.so</code> ومنطق AOT عبر <code>libapp.so</code> لمعمارية <code>arm64-v8a</code> مع محرك <code>libshorebird.so</code> للتحديثات السحابية الفورية دون تنزيل متجر.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                    <strong className="text-emerald-300 block mb-1">ج) طبقة إدارة الحالة (BLoC / Cubit Architecture):</strong>
                    <p className="text-gray-300">
                      فصل منطق العمل (Business Logic) تماماً عن طبقة العرض (UI)، وضمان تجاوب فائق وسلاسة 120Hz.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DIAGRAMS TAB */}
          {activeDocTab === 'DIAGRAMS' && (
            <div className="space-y-6">
              <div className="bg-black/50 p-4 rounded-3xl border border-emerald-500/30 font-mono text-[11px] overflow-x-auto leading-relaxed text-emerald-300">
                <div className="text-amber-400 font-bold mb-2">مخطط (1): المعمارية الهيكلية متعددة الطبقات (Layered System Architecture)</div>
                <pre>{` +---------------------------------------------------------------------------------------+
 |                     واجهة المستخدم التفاعلية (PRESENTATION LAYER)                     |
 |  +---------------------------------------------------------------------------------+  |
 |  | شاشات التطبيق: الرئيسية | الكتالوج | سلة التسوق | المساعد الصوتي | التتبع الحي   |  |
 |  +---------------------------------------------------------------------------------+  |
 |  | مكونات الهوية: شعارات وألوان حضرموت هايبر | بطاقات المنتجات | أشرطة العروض       |  |
 +---------------------------------------------------------------------------------------+
                                            |
                                            v
 +---------------------------------------------------------------------------------------+
 |                      إدارة الحالة والمنطق (BUSINESS LOGIC LAYER)                      |
 |  +--------------------+  +--------------------+  +--------------------+               |
 |  |  Auth & OTP Cubit  |  |   Cart & Checkout  |  | Voice Assist BLoC  |               |
 |  +--------------------+  +--------------------+  +--------------------+               |
 |  | Location & Delivery|  | Order Status BLoC  |  | Offers & Discounts |               |
 |  +--------------------+  +--------------------+  +--------------------+               |
 +---------------------------------------------------------------------------------------+
                                            |
                                            v
 +---------------------------------------------------------------------------------------+
 |                    قنوات الربط الأصلي (PLATFORM CHANNELS BRIDGE)                     |
 |  qeuapp/device_geometry  <--->  qeuapp/microphone_settings  <--->  hadramout/developer |
 +---------------------------------------------------------------------------------------+
                                            |
                       +--------------------+--------------------+
                       |                                         |
                       v                                         v
 +------------------------------------------+  +-----------------------------------------+
 |     المستودعات والشبكات (REMOTE API)     |  |       التخزين المحلي (LOCAL DATA)       |
 |  +------------------------------------+  |  |  +-----------------------------------+  |
 |  |  REST API Client (Dio Engine)      |  |  |  |  SQLite Database (Sqflite)        |  |
 |  |  - Auth, Orders, Catalog, Search   |  |  |  |  - Cart Items, Saved Addresses    |  |
 |  +------------------------------------+  |  |  +-----------------------------------+  |
 |  |  WebSocket Service (Pusher Client) |  |  |  |  Encrypted Shared Preferences     |  |
 |  |  - Real-time Driver GPS Tracking   |  |  |  |  - User Tokens, App Settings      |  |
 |  +------------------------------------+  |  |  +-----------------------------------+  |
 |  |  Payment Gateways (Tap & ApplePay) |  |  |  |  Image Cache & Asset Bundle       |  |
 +------------------------------------------+  +-----------------------------------------+
                       |                                         |
                       +--------------------+--------------------+
                                            |
                                            v
 +---------------------------------------------------------------------------------------+
 |                      نواة أندرويد الأصلية (ANDROID NATIVE OS LAYER)                   |
 |  - Kotlin MainActivity (sa.qeu1.app.MainActivity)                                      |
 |  - Shorebird Dynamic Engine (libshorebird.so)                                         |
 |  - Flutter C++ Engine (libflutter.so) & AOT Logic (libapp.so)                         |
 |  - Google Play Services (Location, Install Referrer, Maps SDK)                        |
 +---------------------------------------------------------------------------------------+`}</pre>
              </div>

              <div className="bg-black/50 p-4 rounded-3xl border border-emerald-500/30 font-mono text-[11px] overflow-x-auto leading-relaxed text-amber-300">
                <div className="text-emerald-400 font-bold mb-2">مخطط (2): تدفق عمليات المتجر وسلة التسوق (Data Flow & Shopping Lifecycle)</div>
                <pre>{` [ المستخدم ] 
     |
     v
 ( فتح التطبيق ) ---> [ التحقق من الموقع الجغرافي ] ---> [ جلب أقرب فرع لحضرموت هايبر ]
     |                                                                   |
     v                                                                   v
 [ تصفح المنتجات ] <-------------------------------------- [ عرض الكتالوج والعروض ]
     |
     +---> [ البحث الصوتي التفاعلي ] ---> ( تحليل الصوت عبر ML Kit ) ---> إضافة للمنتجات
     |
     +---> [ تصفح الوصفات الذكية ] ---> ( نقرة واحدة 1-Tap ) ---> إضافة مقادير الوجبة للعربة
     |
     v
 [ عربة التسوق ] ---> ( حساب الخصومات المركبة، كوبونات التوفير، وضريبة القيمة المضافة )
     |
     v
 [ إتمام الشراء ] ---> [ اختيار نافذة التوصيل: فوري (Quick Commerce) أو مجدول ]
     |
     v
 [ بوابة الدفع ] ---> { خيارات: بطاقات مدى / فيزا / ماستركارد عبر Tap | Apple Pay | عند الاستلام }
     |
     v (تم الدفع بنجاح)
 [ إرسال الطلب ] ---> [ إشعار خادم حضرموت هايبر وبدء تجهيز السلة من الفرع ]
     |
     v
 [ التتبع المباشر ] <--- ( تحديث إحداثيات مندوب التوصيل لحظياً عبر Pusher WebSockets )`}</pre>
              </div>

              <div className="bg-black/50 p-4 rounded-3xl border border-emerald-500/30 font-mono text-[11px] overflow-x-auto leading-relaxed text-cyan-300">
                <div className="text-amber-400 font-bold mb-2">مخطط (3): دورة حياة الطلب وحالاته (Order Lifecycle State Machine)</div>
                <pre>{`               +-----------------------+
               |  مسودة الطلب (DRAFT)  |
               +-----------------------+
                           |
                           v  (المستخدم يضغط "إتمام الطلب")
               +-----------------------+
               | تم الإنشاء (CREATED) |
               +-----------------------+
                           |
                           v  (تأكيد السداد عبر Tap / Apple Pay)
               +-----------------------------+
               | مدفوع ومؤكد (PAID/CONFIRMED)|
               +-----------------------------+
                           |
                           v  (بدء طاقم الهايبر ماركت بتجميع الأغراض)
               +--------------------------------+
               | قيد التجهيز (STORE PICKING)   |
               +--------------------------------+
                           |
                           v  (تغليف السلة وتعيين مندوب التوصيل)
               +--------------------------------+
               | جاهز للتسليم (READY_FOR_PICKUP)|
               +--------------------------------+
                           |
                           v  (المندوب يستلم السلة وينطلق)
               +--------------------------------+
               | في طريق التوصيل (IN_TRANSIT)  | <--- (بث الموقع GPS عبر WebSockets)
               +--------------------------------+
                           |
                           v  (المندوب يصل ويسلم الطلب للعميل)
               +--------------------------------+
               | تم التوصيل بنجاح (DELIVERED)  |
               +--------------------------------+
                           |
                           v  (إضافة الكاشباك لمحفظة العميل)
               +--------------------------------+
               | التقييم والمراجعة (REVIEWED)   |
               +--------------------------------+`}</pre>
              </div>
            </div>
          )}

          {/* SCREENS TAB */}
          {activeDocTab === 'SCREENS' && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-[#F5A623]">
                خريطة الشاشات الـ 18 ووظائف الأزرار في تطبيق حضرموت هايبر:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  { id: '1', title: 'شاشة الإقلاع والتحضير (Splash)', desc: 'فحص Shorebird، تهيئة المحرك، اعتماد المطور أحمد أمين بن هرهره' },
                  { id: '2', title: 'شاشات الترحيب والتعريف (Onboarding)', desc: '3 شرائح متحركة، زر التالي، زر التخطي، زر ابدأ التسوق' },
                  { id: '3', title: 'المصادقة وتسجيل الدخول (Auth & OTP)', desc: 'حقل الهاتف +966 / +967، الرمز السداسي، والدخول كضيف' },
                  { id: '4', title: 'تحديد الموقع الجغرافي (Location & Geofence)', desc: 'خريطة تفاعلية مع Pin، موقعي الحالي، وقائمة الأفرع' },
                  { id: '5', title: 'الرئيسية لمتجر حضرموت (Home Dashboard)', desc: 'البحث الصوتي، الباركود، البانرات، الأقسام، وصفات حضرموت' },
                  { id: '6', title: 'غرفة الانتظار والتدفق (Waiting Room)', desc: 'نظام إدارة الذروة، عداد تنازلي للدور، تنبيه فتح المتجر' },
                  { id: '7', title: 'تصفح الكتالوج والأقسام (Catalog Browser)', desc: 'فلترة متقدمة، تبديل العرض الشبكي والقائمي، البحث' },
                  { id: '8', title: 'تفاصيل المنتج والعروض (Product Details)', desc: 'معرض الصور، عداد الكمية، خصم الكميات، يشترى معاً' },
                  { id: '9', title: 'المساعد الصوتي والذكاء الاصطناعي (AI Voice)', desc: 'تموج صوتي تفاعلي، استخراج المنتجات آلياً، إضافة للسلة' },
                  { id: '10', title: 'عربة التسوق الذكية (Smart Cart)', desc: 'تعديل الكميات، كود الخصم، شريط التوصيل المجاني، الضريبة' },
                  { id: '11', title: 'إتمام الطلب والدفع (Checkout & Payments)', desc: 'نافذة التوصيل الفوري أو المجدول، مدى، Tap، Apple Pay' },
                  { id: '12', title: 'التتبع المباشر للطلب (Live Order Tracking)', desc: 'مراحل الطلب الـ 5، سيارة متحركة على الخريطة، مكالمة ودردشة' },
                  { id: '13', title: 'محفظة حضرموت الرقمية (Digital Wallet)', desc: 'بطاقة فيزا ذهبية، شحن الرصيد، الكاشباك، سجل العمليات' },
                  { id: '14', title: 'بطاقات الهدايا والإهداء (Gift Cards)', desc: 'شراء قسائم التسوق للأهل والأصدقاء وتوليد الكود' },
                  { id: '15', title: 'الملف الشخصي والإعدادات (Profile & Settings)', desc: 'سجل الطلبات مع Re-order بنقرة، اللغات، بطاقة المطور' },
                ].map((s) => (
                  <div key={s.id} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-black text-[#F5A623] block mb-0.5">الشاشة {s.id}</span>
                    <strong className="text-white text-xs block">{s.title}</strong>
                    <p className="text-[11px] text-gray-300 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHANNELS TAB */}
          {activeDocTab === 'CHANNELS' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-black text-[#F5A623]">
                قنوات الاتصال الثنائي بين المنصات (Flutter Platform Channels):
              </h3>
              <div className="space-y-3">
                <div className="bg-black/30 p-4 rounded-2xl border border-emerald-500/30 font-mono">
                  <span className="text-[#F5A623] font-bold">1. hadramout/developer_info</span>
                  <p className="text-gray-300 text-[11px] mt-1">
                    الدالة: <code>getDeveloperInfo</code> - ترجع بيانات المطور أحمد أمين بن هرهره ورقم البناء 152 واسم التطبيق الرسمي.
                  </p>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-emerald-500/30 font-mono">
                  <span className="text-[#F5A623] font-bold">2. qeuapp/device_geometry</span>
                  <p className="text-gray-300 text-[11px] mt-1">
                    الدالة: <code>cornerRadius</code> - قراءة نصف قطر انحناء زوايا الشاشة في Android 12+ (API 31+) لضبط الهوامش ومنع تداخل الأزرار مع زوايا الشاشة.
                  </p>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-emerald-500/30 font-mono">
                  <span className="text-[#F5A623] font-bold">3. qeuapp/microphone_settings</span>
                  <p className="text-gray-300 text-[11px] mt-1">
                    الدالة: <code>openAppSettings</code> - توجيه العميل فورياً لشاشة إعدادات أذونات الميكروفون عند تفعيل المساعد الصوتي لأول مرة.
                  </p>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-emerald-500/30 font-mono">
                  <span className="text-[#F5A623] font-bold">4. qeu/install_referrer</span>
                  <p className="text-gray-300 text-[11px] mt-1">
                    الدالة: <code>getReferrer</code> - الاتصال الآمن مع Google Play Store عبر InstallReferrerClient لجلب بيانات التثبيت وحملات التسويق.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DATABASE TAB */}
          {activeDocTab === 'DB' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-black text-[#F5A623]">
                نماذج البيانات وقواعد التخزين المحلي (SQLite Cache Schemas):
              </h3>
              <div className="space-y-4">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 font-mono">
                  <h4 className="text-emerald-300 font-bold mb-2">1. جدول سلة التسوق المحلية (local_cart_items):</h4>
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/20 text-[#F5A623]">
                        <th className="py-1">الحقل (Field)</th>
                        <th className="py-1">النوع (Type)</th>
                        <th className="py-1">الوصف (Description)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-gray-300">
                      <tr><td className="py-1">id</td><td>INTEGER PK</td><td>المعرف الفرعي التلقائي</td></tr>
                      <tr><td className="py-1">product_id</td><td>VARCHAR(64)</td><td>معرف المنتج في كتالوج حضرموت هايبر</td></tr>
                      <tr><td className="py-1">product_name</td><td>TEXT</td><td>اسم المنتج بالعربية</td></tr>
                      <tr><td className="py-1">unit_price</td><td>REAL</td><td>سعر الحبة الواحدة</td></tr>
                      <tr><td className="py-1">discounted_price</td><td>REAL</td><td>السعر المخفض بعد العرض</td></tr>
                      <tr><td className="py-1">quantity</td><td>INTEGER</td><td>عدد الحبات المطلوبة</td></tr>
                      <tr><td className="py-1">image_url</td><td>TEXT</td><td>رابط الصورة المخزن مؤقتاً</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 font-mono">
                  <h4 className="text-emerald-300 font-bold mb-2">2. جدول العناوين المفضلة (saved_user_addresses):</h4>
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/20 text-[#F5A623]">
                        <th className="py-1">الحقل</th>
                        <th className="py-1">النوع</th>
                        <th className="py-1">الوصف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-gray-300">
                      <tr><td className="py-1">address_id</td><td>INTEGER PK</td><td>المعرف الفريد للعنوان</td></tr>
                      <tr><td className="py-1">title</td><td>VARCHAR(50)</td><td>تسمية العنوان (المنزل، العمل)</td></tr>
                      <tr><td className="py-1">latitude / longitude</td><td>REAL</td><td>الإحداثيات الجغرافية GPS</td></tr>
                      <tr><td className="py-1">formatted_address</td><td>TEXT</td><td>اسم الحي والشارع ورقم المبنى</td></tr>
                      <tr><td className="py-1">is_default</td><td>BOOLEAN</td><td>العنوان الافتراضي للشحن السريع</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STUDIO TAB */}
          {activeDocTab === 'STUDIO' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-black text-[#F5A623]">
                دليل بيئة التطوير والتشغيل عبر Android Studio:
              </h3>
              <div className="bg-black/40 p-4 rounded-2xl border border-emerald-500/20 font-mono space-y-3">
                <div>
                  <span className="text-[#F5A623] block font-bold">1. مسار المشروع في الجهاز:</span>
                  <code className="text-emerald-300">C:\متجر\hadramout_hyper_app</code>
                </div>
                <div>
                  <span className="text-[#F5A623] block font-bold">2. إعدادات JDK (Java 21 JBR):</span>
                  <code className="text-emerald-300 block">org.gradle.java.home=C:\\Program Files\\Android\\Android Studio\\jbr</code>
                </div>
                <div>
                  <span className="text-[#F5A623] block font-bold">3. أوامر التجميع والفحص في Terminal:</span>
                  <div className="bg-black/60 p-2 rounded-lg text-gray-200 mt-1 space-y-1">
                    <p><strong className="text-emerald-400">.\gradlew.bat assembleDebug</strong> (بناء حزمة APK التجريبية)</p>
                    <p><strong className="text-emerald-400">.\gradlew.bat bundleRelease</strong> (بناء حزمة AAB الموجهة لـ Google Play)</p>
                    <p><strong className="text-emerald-400">.\gradlew.bat check</strong> (فحص الجودة والمطابقة البرمجية)</p>
                  </div>
                </div>
              </div>

              {/* Developer signature banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#095B3E] to-[#0E8A5E] text-center border border-[#F5A623]/30">
                <p className="font-black text-sm text-[#F5A623]">
                  {DEVELOPER_INFO.developerTitle}
                </p>
                <p className="text-[10px] text-emerald-100 mt-1">
                  تطبيق حضرموت هايبر الرسمي • معرف الحزمة: com.hadramouthyper.app • إصدار 1.0.0
                </p>
              </div>

              {/* GitHub Actions Cloud Build Info */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 font-mono space-y-2">
                <span className="text-amber-400 font-bold block">4. البناء السحابي التلقائي بدون برامج (GitHub Actions):</span>
                <p className="text-gray-300">
                  تم تضمين سير العمل السحابي في <code>.github/workflows/build-apk.yml</code>. عند ربط المستودع بـ GitHub، يمكنك تشغيل التجميع وتنزيل الـ APK المجمع جاهزاً بضغطة زر واحدة.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Action Bar */}
        <div className="p-3.5 sm:p-4 bg-[#081f30] border-t border-white/10 flex items-center justify-between gap-2">
          <div className="text-[11px] text-gray-400 hidden sm:block">
            اضغط زر <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white font-mono">ESC</kbd> أو انقر أي مكان خارج النافذة للإغلاق السريع
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#0E8A5E] hover:bg-emerald-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg"
          >
            <X className="w-4 h-4" />
            <span>إغلاق التوثيق والعودة للمتجر</span>
          </button>
        </div>
      </div>
    </div>
  );
};
