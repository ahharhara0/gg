import React from 'react';
import { Bell, X, Tag, Wallet, Cpu, Check } from 'lucide-react';
import { NotificationItem, AppLanguage } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  language?: AppLanguage;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  language = 'ar',
}) => {
  if (!isOpen) return null;
  const isRtl = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-[#0E8A5E] text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-[#F5A623]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">
                {isRtl ? 'الإشعارات والتنبيهات' : 'Notifications & Alerts'}
              </h3>
              <p className="text-xs text-emerald-100">
                {isRtl ? 'أحدث العروض وتحديثات الطلبات' : 'Latest deals and order updates'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-2xl border transition-all text-xs ${
                notif.read
                  ? 'bg-gray-50 border-gray-100 text-gray-600'
                  : 'bg-emerald-50/60 border-emerald-200 text-gray-900 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {notif.type === 'offer' ? (
                  <Tag className="w-4 h-4 text-amber-500" />
                ) : notif.type === 'wallet' ? (
                  <Wallet className="w-4 h-4 text-[#0E8A5E]" />
                ) : (
                  <Cpu className="w-4 h-4 text-blue-500" />
                )}
                <h4 className="font-black flex-1 truncate">
                  {isRtl ? notif.title : (notif.titleEn || notif.title)}
                </h4>
                <span className="text-[10px] text-gray-400 font-medium">{notif.time}</span>
              </div>
              <p className={`text-[11px] text-gray-600 leading-relaxed ${isRtl ? 'pr-6' : 'pl-6'}`}>
                {isRtl ? notif.message : (notif.messageEn || notif.message)}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
          <button
            onClick={onMarkAllRead}
            className="text-xs text-[#0E8A5E] font-bold hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تعيين الكل كمقروء' : 'Mark all as read'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

