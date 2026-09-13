import React, { useState, useEffect } from 'react';
import { Users, Clock, Bell, ArrowLeft, X, Sparkles, Check } from 'lucide-react';

interface WaitingRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterStore: () => void;
}

export const WaitingRoomModal: React.FC<WaitingRoomModalProps> = ({
  isOpen,
  onClose,
  onEnterStore,
}) => {
  const [queueNumber, setQueueNumber] = useState(142);
  const [estimatedSeconds, setEstimatedSeconds] = useState(15);
  const [isNotified, setIsNotified] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setQueueNumber((prev) => Math.max(1, prev - Math.floor(Math.random() * 8 + 4)));
      setEstimatedSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#0B253A] text-white rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 p-6 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#095B3E] to-[#0E8A5E] mx-auto flex items-center justify-center mb-4 ring-4 ring-emerald-500/20 shadow-lg">
          <Users className="w-8 h-8 text-[#F5A623] animate-pulse" />
        </div>

        <span className="inline-block bg-[#F5A623] text-[#0B253A] text-[10px] font-black px-3 py-1 rounded-full mb-2">
          نظام التدفق الذكي • ساعات الذروة
        </span>

        <h3 className="text-xl font-black">غرفة الانتظار الافتراضية</h3>
        <p className="text-xs text-emerald-100/80 mt-1 max-w-xs mx-auto leading-relaxed">
          نظراً للإقبال الهائل على عروض حضرموت هايبر الحارقة، نحافظ على استقرار وسرعة تجربتك.
        </p>

        {/* Queue counter */}
        <div className="my-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-around">
          <div>
            <span className="text-[10px] text-gray-400 block font-bold">دورك في الطابور</span>
            <span className="text-2xl font-black font-mono text-[#F5A623]">
              #{queueNumber}
            </span>
          </div>

          <div className="w-px h-8 bg-white/10" />

          <div>
            <span className="text-[10px] text-gray-400 block font-bold">وقت الانتظار المتوقع</span>
            <span className="text-2xl font-black font-mono text-emerald-300">
              {estimatedSeconds} ثانية
            </span>
          </div>
        </div>

        {/* Action button */}
        {estimatedSeconds === 0 ? (
          <button
            onClick={() => {
              onEnterStore();
              onClose();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0E8A5E] to-[#10B981] hover:brightness-110 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <span>حان دورك! ادخل المتجر الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setIsNotified(true)}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
            >
              {isNotified ? (
                <>
                  <Check className="w-4 h-4 text-[#F5A623]" />
                  <span>تم تفعيل التنبيه عند وصول دورك</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 text-[#F5A623]" />
                  <span>نبهني بإشعار فوري عند فتح المتجر</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                onEnterStore();
                onClose();
              }}
              className="text-[11px] text-emerald-300/80 hover:text-emerald-200 underline cursor-pointer"
            >
              تخطي الانتظار للدخول كزائر vip
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
