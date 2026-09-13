import React, { useRef } from 'react';
import { 
  MapPin, 
  Bell, 
  Wallet, 
  Smartphone, 
  Monitor, 
  FileCode2, 
  Clock,
  ChevronDown,
  Globe 
} from 'lucide-react';
import { Branch, AppLanguage } from '../types';
import { HadramoutLogo } from './HadramoutLogo';

interface HeaderProps {
  currentBranch: Branch;
  walletBalance: number;
  unreadNotificationsCount: number;
  isMobileFrame: boolean;
  language?: AppLanguage;
  onToggleLanguage?: () => void;
  onToggleFrame: () => void;
  onOpenBranchPicker: () => void;
  onOpenNotifications: () => void;
  onOpenWallet: () => void;
  onOpenDocs: () => void;
  onOpenWaitingRoom: () => void;
  onHiddenStaffAccess?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentBranch,
  walletBalance,
  unreadNotificationsCount,
  isMobileFrame,
  language = 'ar',
  onToggleLanguage,
  onToggleFrame,
  onOpenBranchPicker,
  onOpenNotifications,
  onOpenWallet,
  onOpenDocs,
  onOpenWaitingRoom,
  onHiddenStaffAccess,
}) => {
  const isRtl = language === 'ar';
  const secretTapTimes = useRef<number[]>([]);
  const handleLogoSecretTap = () => {
    if (!onHiddenStaffAccess) return;
    const now = Date.now();
    secretTapTimes.current = [...secretTapTimes.current.filter(t => now - t < 3500), now];
    if (secretTapTimes.current.length >= 7) { secretTapTimes.current = []; onHiddenStaffAccess(); }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0E8A5E] text-white shadow-md">
      {/* Topmost utility bar */}
      <div className="bg-[#095B3E] px-4 py-1 text-xs flex items-center justify-between border-b border-emerald-700/40">
        <div className="flex items-center gap-2 text-emerald-100">
          <span className="inline-block w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
          <span className="font-medium">
            {isRtl
              ? `توصيل سريع متاح الآن من ${currentBranch.city} (${currentBranch.deliveryTime})`
              : `Express delivery available from ${currentBranch.cityEn || currentBranch.city} (${currentBranch.deliveryTime})`}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Language Toggle Button */}
          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1 text-[11px] font-bold text-white hover:text-amber-300 transition-colors cursor-pointer bg-white/15 px-2 py-0.5 rounded shadow-xs"
              title={isRtl ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <Globe className="w-3 h-3 text-[#F5A623]" />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>
          )}

          {/* Waiting room simulator button */}
          <button
            onClick={onOpenWaitingRoom}
            className="hidden sm:flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 transition-colors cursor-pointer bg-white/10 px-2 py-0.5 rounded"
            title="تجربة نظام غرفة الانتظار وقت الذروة"
          >
            <Clock className="w-3 h-3" />
            <span>{isRtl ? 'محاكاة الذروة' : 'Peak Simulator'}</span>
          </button>

          {/* Docs & Architecture Button */}
          <button
            onClick={onOpenDocs}
            className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-200 hover:text-white transition-colors cursor-pointer bg-white/10 px-2 py-0.5 rounded font-bold"
            title="استعراض المخططات ودليل التوثيق الشامل"
          >
            <FileCode2 className="w-3 h-3 text-[#F5A623]" />
            <span>{isRtl ? 'التوثيق والهندسة' : 'Architecture'}</span>
          </button>

          {/* Device Frame Toggle */}
          <button
            onClick={onToggleFrame}
            className="hidden md:flex items-center gap-1 text-[11px] text-emerald-100 hover:text-white transition-colors cursor-pointer bg-white/10 px-2 py-0.5 rounded"
            title={isMobileFrame ? "التحويل للشاشة الكاملة" : "التحويل لوضع إطار الهاتف"}
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3 h-3 text-amber-300" />
                <span>{isRtl ? 'شاشة كاملة' : 'Desktop'}</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3 h-3 text-amber-300" />
                <span>{isRtl ? 'إطار الهاتف' : 'Mobile'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Header bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand identity & Logo */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleLogoSecretTap} aria-label="Store" className="select-none"><HadramoutLogo variant="compact" size={38} lightText language={language} /></button>
        </div>

        {/* Branch / Address selector */}
        <button
          onClick={onOpenBranchPicker}
          className="flex-1 max-w-xs mx-1 sm:mx-2 bg-[#095B3E]/80 hover:bg-[#095B3E] active:scale-95 transition-all text-right px-3 py-1.5 rounded-xl border border-emerald-600/50 flex items-center justify-between gap-2 cursor-pointer shadow-inner"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
            </div>
            <div className={`truncate ${isRtl ? 'text-right' : 'text-left'}`}>
              <p className="text-[10px] text-emerald-200 leading-tight">{isRtl ? 'التوصيل إلى' : 'Deliver to'}</p>
              <p className="text-xs font-bold text-white truncate leading-tight">
                {isRtl ? (currentBranch?.name || 'فرع المكلا') : (currentBranch?.nameEn || currentBranch?.name || 'Mukalla Branch')}
              </p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-emerald-200 flex-shrink-0" />
        </button>

        {/* Actions: Language pill + Wallet & Notifications */}
        <div className="flex items-center gap-2">
          {/* Direct Language Switch on Mobile/Desktop */}
          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              className="flex sm:hidden items-center gap-1 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold px-2 py-1.5 rounded-xl text-xs cursor-pointer border border-white/20"
              title={isRtl ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-[#F5A623]" />
              <span className="text-[10px] uppercase">{language === 'ar' ? 'EN' : 'AR'}</span>
            </button>
          )}

          {/* Wallet Balance Pill */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#F5A623] to-[#E09015] hover:brightness-105 active:scale-95 text-[#0B253A] font-extrabold px-3 py-1.5 rounded-xl shadow-md cursor-pointer transition-all text-xs"
            title="رصيد محفظة حضرموت هايبر"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isRtl ? 'المحفظة:' : 'Wallet:'}</span>
            <span>{walletBalance.toFixed(2)} {isRtl ? 'ر.س' : 'SAR'}</span>
          </button>

          {/* Notifications button */}
          <button
            onClick={onOpenNotifications}
            className="relative w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            title={isRtl ? 'الإشعارات والتنبيهات' : 'Notifications'}
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#0E8A5E] animate-bounce">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
