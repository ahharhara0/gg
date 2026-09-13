import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  X, 
  Check 
} from 'lucide-react';
import { AppLanguage } from '../types';

interface WalletViewProps {
  isOpen?: boolean;
  balance: number;
  language?: AppLanguage;
  onTopUp: (amount: number) => void;
  onClose: () => void;
}

interface Transaction {
  id: string;
  title: string;
  titleEn?: string;
  amount: number;
  date: string;
  dateEn?: string;
  type: 'credit' | 'debit';
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', title: 'كاشباك مشتريات مندي حضرمي', titleEn: 'Cashback: Hadrami Mandi Groceries', amount: 15.5, date: 'اليوم، 11:20 ص', dateEn: 'Today, 11:20 AM', type: 'credit' },
  { id: 'tx-2', title: 'شحن رصيد عبر بطاقة مدى', titleEn: 'Top-up via Mada Card', amount: 100.0, date: 'أمس، 04:15 م', dateEn: 'Yesterday, 04:15 PM', type: 'credit' },
  { id: 'tx-3', title: 'دفع مشتريات طلب هايبر #1094', titleEn: 'Order Payment #1094', amount: 89.25, date: '04 سبتمبر 2026', dateEn: '04 Sep 2026', type: 'debit' },
  { id: 'tx-4', title: 'هدية ترحيبية من حضرموت هايبر', titleEn: 'Welcome Gift: Hadramout Hyper', amount: 25.0, date: '01 سبتمبر 2026', dateEn: '01 Sep 2026', type: 'credit' },
];

export const WalletView: React.FC<WalletViewProps> = ({
  isOpen = true,
  balance,
  language = 'ar',
  onTopUp,
  onClose,
}) => {
  const isRtl = language === 'ar';
  const currencyLabel = isRtl ? 'ر.س' : 'SAR';

  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [topUpAmount, setTopUpAmount] = useState<number>(50);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Support ESC key to close
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirmTopUp = () => {
    onTopUp(topUpAmount);
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        title: 'شحن رصيد المحفظة عبر مدى',
        titleEn: 'Wallet Top-up via Mada',
        amount: topUpAmount,
        date: isRtl ? 'الآن' : 'Just now',
        dateEn: 'Just now',
        type: 'credit',
      },
      ...prev,
    ]);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsTopUpModalOpen(false);
    }, 900);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg max-h-[90vh] bg-[#F4F8F5] rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto border border-white/20"
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0E8A5E] text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-[#F5A623]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">
                {isRtl ? 'محفظة حضرموت الرقمية' : 'Hadramout Digital Wallet'}
              </h2>
              <p className="text-xs text-emerald-100">
                {isRtl ? 'رصيدك واستردادك النقدي الفوري (Cashback)' : 'Your balance and instant cashback'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-red-500/80 hover:text-white flex items-center justify-center text-white cursor-pointer transition-all active:scale-95 shadow-sm"
            title={isRtl ? 'إغلاق المحفظة' : 'Close Wallet'}
            aria-label={isRtl ? 'إغلاق المحفظة' : 'Close Wallet'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-w-xl mx-auto w-full space-y-4 overflow-y-auto flex-1">
          {/* Luxury Gold Virtual Card */}
          <div className="relative w-full h-52 rounded-3xl bg-gradient-to-tr from-[#92400E] via-[#B45309] to-[#F5A623] p-6 text-white shadow-xl shadow-amber-950/20 overflow-hidden border border-amber-300/40 select-none">
            {/* Decorative background watermark */}
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className={`absolute top-4 ${isRtl ? 'left-6' : 'right-6'} opacity-20 font-black text-6xl tracking-widest pointer-events-none`}>
              HYPER
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">
                  HADRAMOUT HYPER DIGITAL WALLET
                </span>
                <h3 className="text-sm font-black text-white">
                  {isRtl ? 'بطاقة مكافآت حضرموت' : 'Hadramout Rewards Card'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </div>
            </div>

            <div className="my-4">
              <span className="text-xs text-amber-100 font-medium">
                {isRtl ? 'الرصيد المتاح حالياً' : 'Available Balance'}
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-white drop-shadow">
                {balance.toFixed(2)}{' '}
                <span className="text-sm font-bold text-amber-200">{currencyLabel}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-amber-100 font-mono pt-2 border-t border-white/20">
              <span>•••• •••• •••• 8842</span>
              <span>EXP: 12/29</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsTopUpModalOpen(true)}
              className="p-3.5 rounded-2xl bg-[#0E8A5E] hover:bg-[#095B3E] active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F5A623]" />
              <span>{isRtl ? 'شحن رصيد المحفظة' : 'Top-up Balance'}</span>
            </button>

            <div className="p-3.5 rounded-2xl bg-white border border-gray-200 text-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 font-bold">
                  {isRtl ? 'كاشباك مكتسب' : 'Earned Cashback'}
                </p>
                <p className="font-black text-[#0E8A5E] font-mono text-sm">
                  +40.50 {currencyLabel}
                </p>
              </div>
              <span className="text-[10px] bg-emerald-50 text-[#0E8A5E] font-bold px-2 py-1 rounded-lg">
                {isRtl ? '5% استرداد' : '5% back'}
              </span>
            </div>
          </div>

          {/* Transactions History */}
          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#0E8A5E]" />
                <span>{isRtl ? 'سجل العمليات السابقة' : 'Transaction History'}</span>
              </h4>
              <span className="text-[11px] text-gray-400 font-medium">
                {isRtl ? 'آخر 30 يوم' : 'Last 30 days'}
              </span>
            </div>

            <div className="space-y-2.5">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        tx.type === 'credit'
                          ? 'bg-emerald-100 text-[#0E8A5E]'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-gray-800">
                        {isRtl ? tx.title : (tx.titleEn || tx.title)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {isRtl ? tx.date : (tx.dateEn || tx.date)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-black font-mono ${
                      tx.type === 'credit' ? 'text-[#0E8A5E]' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {tx.amount.toFixed(2)} {currencyLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Up Modal */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div 
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-gray-100 relative"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <button
              onClick={() => setIsTopUpModalOpen(false)}
              className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-gray-900 mb-1">
              {isRtl ? 'شحن رصيد المحفظة' : 'Top-up Wallet Balance'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {isRtl ? 'اختر المبلغ المراد شحنه فورياً عبر مدى أو Apple Pay' : 'Choose amount to top-up instantly via Mada or Apple Pay'}
            </p>

            {/* Quick amounts */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[50, 100, 200].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-2.5 rounded-xl font-mono font-black text-xs transition-all cursor-pointer ${
                    topUpAmount === amt
                      ? 'bg-[#0E8A5E] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {amt} {currencyLabel}
                </button>
              ))}
            </div>

            <button
              onClick={handleConfirmTopUp}
              disabled={showSuccess}
              className="w-full py-3.5 rounded-xl bg-[#0E8A5E] hover:bg-[#095B3E] active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-75"
            >
              {showSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#F5A623]" />
                  <span>{isRtl ? 'تم الشحن بنجاح!' : 'Topped up successfully!'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isRtl ? `تأكيد وشحن ${topUpAmount} ر.س الآن` : `Confirm & Top-up ${topUpAmount} SAR Now`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

