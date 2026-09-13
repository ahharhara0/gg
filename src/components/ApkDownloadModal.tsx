import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Terminal, 
  Github, 
  Layers, 
  QrCode, 
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const appUrl = window.location.origin;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white rounded-[28px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#095B3E] to-[#0E8A5E] px-6 py-5 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Smartphone className="w-6 h-6 text-[#F5A623]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                تثبيت وبناء تطبيق حضرموت هايبر (APK)
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                حزمة الأندرويد: com.hadramouthyper.app • إصدار 1.0.0
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-gray-800">
          {/* Option 1: PWA Immediate Install (Recommended for instant phone testing) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3 text-[#F5A623]" />
                  التثبيت الفوري الآن على هاتفك (Web APK)
                </span>
                <h3 className="text-sm font-black text-emerald-950">
                  تثبيت التطبيق على جوالك فوراً بدون انتظار
                </h3>
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  يعمل التطبيق كـ Progressive Web App معتمد، افتح الرابط في متصفح Chrome على هاتفك واضغط على (إضافة إلى الشاشة الرئيسية) ليعمل كتطبيق كامل ومستقل.
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between gap-2">
              <div className="text-xs font-mono text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 truncate flex-1" dir="ltr">
                {appUrl}
              </div>
              <button
                onClick={() => handleCopy('url', appUrl)}
                className="px-3.5 py-1.5 rounded-xl bg-[#095B3E] hover:bg-[#074730] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                {copied === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'url' ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>
            </div>
          </div>

          {/* Option 2: Automatic GitHub Actions Cloud Build */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center">
                <Github className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-900">
                  البناء السحابي التلقائي (GitHub Actions)
                </h4>
                <p className="text-[11px] text-gray-500">
                  تم تجهيز ملف البناء السحابي في المشروع تلقائياً (.github/workflows/build-apk.yml)
                </p>
              </div>
            </div>

            <ol className="text-xs text-gray-700 space-y-1.5 list-decimal list-inside font-medium leading-relaxed bg-white p-3 rounded-xl border border-gray-200">
              <li>صدّر المشروع إلى مستودع GitHub عبر خيار (Export to GitHub) من قائمة الإعدادات.</li>
              <li>في GitHub، افتح تبويب <strong>Actions</strong> ثم اختر <strong>Build Hadramout Hyper Android APK</strong>.</li>
              <li>اضغط على <strong>Run workflow</strong> لتبدأ خوادم قوقل/جيت هب بتجميع ملف الـ APK.</li>
              <li>ستجد ملف الـ <strong>.apk</strong> جاهزاً للتحميل المباشر بعد انتهاء التجميع.</li>
            </ol>
          </div>

          {/* Option 3: Local Android Studio Build (For Google Play AAB & Keystore) */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-900">
                  البناء عبر Android Studio لنشر Google Play Console
                </h4>
                <p className="text-[11px] text-gray-500">
                  مجلد المشروع android جاهز ومزامن بالكامل مع Capacitor
                </p>
              </div>
            </div>

            <div className="bg-gray-900 text-emerald-300 font-mono text-[11px] p-3 rounded-xl space-y-1" dir="ltr">
              <p className="text-gray-400"># 1. Build Debug APK:</p>
              <p>cd android && ./gradlew assembleDebug</p>
              <p className="text-gray-400 mt-2"># 2. Build Release AAB for Google Play Console:</p>
              <p>cd android && ./gradlew bundleRelease</p>
            </div>
          </div>

          {/* Package details info */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-100 pt-3">
            <span className="flex items-center gap-1 font-bold text-gray-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              جاهز 100% ومتوافق مع متطلبات متجر قوقل بلاي 2026
            </span>
            <span className="font-mono text-gray-400">Target SDK 36</span>
          </div>
        </div>
      </div>
    </div>
  );
};
