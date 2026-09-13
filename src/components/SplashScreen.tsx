import React, { useState, useEffect } from 'react';
import { DEVELOPER_INFO } from '../data/initialCatalog';
import { Sparkles, Cpu, CheckCircle2, ArrowLeft } from 'lucide-react';
import { HadramoutLogo } from './HadramoutLogo';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('تهيئة محرك التطبيق وقنوات الاتصال...');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusText('فحص التحديثات السحابية عبر Shorebird Code Push...');
    }, 700);

    const timer2 = setTimeout(() => {
      setProgress(80);
      setStatusText('مزامنة الكتالوج المحلي والعروض الحارقة...');
    }, 1500);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('التطبيق جاهز للتشغيل بنجاح');
      setCompleted(true);
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#0B253A] via-[#095B3E] to-[#0E8A5E] text-white p-6 sm:p-10 select-none overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#0E8A5E]/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#F5A623]/20 blur-3xl pointer-events-none" />

      {/* Top OS & Version Chip */}
      <div className="w-full flex items-center justify-between text-xs text-emerald-200/80 pt-2 z-10">
        <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <Cpu className="w-3.5 h-3.5 text-[#F5A623]" />
          <span>v{DEVELOPER_INFO.version} (Build {DEVELOPER_INFO.buildNumber})</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Shorebird Engine Ready</span>
        </div>
      </div>

      {/* Main Center Logo & Brand Identity */}
      <div className="flex flex-col items-center text-center my-auto z-10">
        {/* Official Brand Logo */}
        <div className="mb-4 transform hover:scale-105 transition-transform duration-500">
          <HadramoutLogo variant="full" size={110} lightText />
        </div>
        <p className="text-emerald-100/90 text-sm sm:text-base font-medium max-w-sm">
          متعة التسوق السريع • جودة طازجة • وتوصيل فوري
        </p>

        {/* Features Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1 text-[11px] bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-emerald-100 border border-white/5">
            <Sparkles className="w-3 h-3 text-[#F5A623]" />
            مساعد صوتي ذكي
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-emerald-100 border border-white/5">
            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
            تتبع مباشر للطلبات
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-emerald-100 border border-white/5">
            منتجات حضرمية أصلية
          </span>
        </div>
      </div>

      {/* Bottom Loading Progress & Developer Signature */}
      <div className="w-full max-w-md flex flex-col items-center gap-4 z-10 pb-4">
        {/* Progress bar */}
        <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden p-0.5 backdrop-blur-sm">
          <div
            className="bg-gradient-to-r from-[#F5A623] to-emerald-300 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-xs text-emerald-200">
          <span className="truncate">{statusText}</span>
          <span className="font-mono font-bold text-[#F5A623]">{progress}%</span>
        </div>

        {completed ? (
          <button
            onClick={onDismiss}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F5A623] to-[#E09015] hover:brightness-110 active:scale-[0.98] text-[#0B253A] font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-950/40 transition-all cursor-pointer"
          >
            <span>ابدأ التسوق الآن</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onDismiss}
            className="text-xs text-emerald-200/70 hover:text-white underline cursor-pointer transition-colors"
          >
            تخطي شاشة البداية والبدء مباشرة
          </button>
        )}

        {/* Mandatory Developer Signature Card */}
        <div className="w-full bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center mt-2">
          <p className="text-xs font-bold text-[#F5A623]">
            {DEVELOPER_INFO.developerTitle}
          </p>
          <p className="text-[10px] text-emerald-200/70 mt-0.5">
            معرف الحزمة: {DEVELOPER_INFO.packageId} • {DEVELOPER_INFO.supportedOS}
          </p>
        </div>
      </div>
    </div>
  );
};
