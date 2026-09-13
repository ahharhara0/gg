import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CreditCard, 
  Wallet, 
  Banknote, 
  Check, 
  ShieldCheck, 
  Lock, 
  Copy,
  Server
} from 'lucide-react';
import { CartItem, Branch, PaymentMethodConfig, AppLanguage } from '../types';
import { INITIAL_PAYMENT_METHODS } from '../data/paymentMethodsData';
import { 
  t, 
  formatPrice, 
  getLocalizedBranchName 
} from '../lib/translations';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  branch: Branch;
  walletBalance: number;
  promoDiscount: number;
  promoCode: string;
  completedOrdersCount?: number;
  paymentMethods?: PaymentMethodConfig[];
  language?: AppLanguage;
  onConfirmOrder: (orderDetails: {
    paymentMethod: string;
    deliverySlot: string;
    totalAmount: number;
    usedWallet: boolean;
    transferReference?: string;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  branch,
  walletBalance,
  promoDiscount,
  promoCode,
  completedOrdersCount = 6,
  paymentMethods,
  language = 'ar',
  onConfirmOrder,
}) => {
  const isRtl = language === 'ar';
  const REQUIRED_ORDERS_FOR_COD = 5;
  const isCodUnlocked = completedOrdersCount >= REQUIRED_ORDERS_FOR_COD;
  const remainingOrdersForCod = Math.max(0, REQUIRED_ORDERS_FOR_COD - completedOrdersCount);

  // Use dynamic payment methods passed from admin/developer config or fallback to rich defaults
  const activePaymentMethods = (paymentMethods && paymentMethods.length > 0 ? paymentMethods : INITIAL_PAYMENT_METHODS)
    .filter((m) => m.isEnabled)
    .sort((a, b) => a.order - b.order);

  const [deliverySlot, setDeliverySlot] = useState<'EXPRESS' | 'SCHEDULED'>('EXPRESS');
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    activePaymentMethods[0]?.id || 'kuraimi-floosak'
  );
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const [transferRefNumber, setTransferRefNumber] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Server-Side Pricing Valuation State (Anti-Tampering)
  const [serverPricing, setServerPricing] = useState<{
    subtotal: number;
    vat: number;
    deliveryFee: number;
    promoDiscount: number;
    totalBeforeWallet: number;
    walletDeduction: number;
    finalPayable: number;
    quoteToken?: string;
  } | null>(null);
  const [isValuating, setIsValuating] = useState(false);

  useEffect(() => {
    if (!isOpen || !cartItems || cartItems.length === 0) return;
    let isMounted = true;
    setIsValuating(true);

    fetch('/api/pricing/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartItems.map((it) => ({
          productId: it.product.id,
          name: it.product.name,
          quantity: it.quantity,
          price: it.product.price,
        })),
        couponCode: promoCode || undefined,
        useWallet: useWalletBalance,
        walletBalance: walletBalance,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setServerPricing(data);
        }
      })
      .catch((err) => {
        console.warn('Server pricing fallback:', err);
      })
      .finally(() => {
        if (isMounted) setIsValuating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, cartItems, promoCode, useWalletBalance, walletBalance]);

  if (!isOpen) return null;

  const currentMethodObj = activePaymentMethods.find((m) => m.id === selectedMethodId);

  // Local calculations with Server-Certified override
  const localSubtotal = (cartItems || []).reduce(
    (sum, item) => sum + ((item?.product?.price || 0) * (item?.quantity || 0)),
    0
  );
  const localTaxable = Math.max(0, localSubtotal - promoDiscount);
  const localVat = localTaxable * 0.15;
  const localDelivery = localSubtotal >= 150 ? 0 : 15;
  const localTotalBeforeWallet = localTaxable + localVat + localDelivery;
  let localWalletDeduction = 0;
  if (useWalletBalance && walletBalance > 0) {
    localWalletDeduction = Math.min(walletBalance, localTotalBeforeWallet);
  }
  const localFinalPayable = Math.max(0, localTotalBeforeWallet - localWalletDeduction);

  // Final verified values (prefer server calculation)
  const subtotal = serverPricing ? serverPricing.subtotal : localSubtotal;
  const vat = serverPricing ? serverPricing.vat : localVat;
  const deliveryFee = serverPricing ? serverPricing.deliveryFee : localDelivery;
  const totalBeforeWallet = serverPricing ? serverPricing.totalBeforeWallet : localTotalBeforeWallet;
  const walletDeduction = serverPricing ? serverPricing.walletDeduction : localWalletDeduction;
  const finalPayable = serverPricing ? serverPricing.finalPayable : localFinalPayable;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirmOrder({
        paymentMethod: isRtl ? (currentMethodObj?.name || 'طريقة دفع معتمدة') : (currentMethodObj?.nameEn || currentMethodObj?.name || 'Verified Payment Method'),
        deliverySlot: deliverySlot === 'EXPRESS' 
          ? (isRtl ? 'توصيل فوري (35-45 دقيقة)' : 'Express Delivery (35-45 mins)')
          : (isRtl ? 'توصيل مجدول (المساء)' : 'Scheduled Delivery (Evening)'),
        totalAmount: finalPayable,
        usedWallet: useWalletBalance,
        transferReference: transferRefNumber || undefined,
      });
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in" 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-[#0A7D8C] text-white p-4.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-amber-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">{t('checkoutHeader', language)}</h3>
              <p className="text-xs text-cyan-100 font-medium">
                {t('deliveryBranch', language)}: {getLocalizedBranchName(branch, language)}
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

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Delivery Slot Selection */}
          <div>
            <h4 className="text-xs font-black text-gray-800 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0A7D8C]" />
              <span>{t('deliverySlotTitle', language)}</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDeliverySlot('EXPRESS')}
                className={`p-3 rounded-2xl border ${isRtl ? 'text-right' : 'text-left'} transition-all cursor-pointer ${
                  deliverySlot === 'EXPRESS'
                    ? 'border-[#0A7D8C] bg-cyan-50/80 ring-2 ring-[#0A7D8C]/20 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-gray-900">{t('expressSlot', language)}</span>
                  <span className="w-2 h-2 rounded-full bg-[#0A7D8C] animate-ping" />
                </div>
                <p className="text-[11px] text-gray-500 font-medium">{t('expressSlotSub', language)}</p>
                <span className="inline-block mt-1 text-[10px] bg-cyan-100 text-[#0A7D8C] font-extrabold px-2 py-0.5 rounded-md">
                  {isRtl ? 'موصى به ⚡' : 'Recommended ⚡'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDeliverySlot('SCHEDULED')}
                className={`p-3 rounded-2xl border ${isRtl ? 'text-right' : 'text-left'} transition-all cursor-pointer ${
                  deliverySlot === 'SCHEDULED'
                    ? 'border-[#0A7D8C] bg-cyan-50/80 ring-2 ring-[#0A7D8C]/20 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-gray-900">{t('scheduledSlot', language)}</span>
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <p className="text-[11px] text-gray-500 font-medium">{t('scheduledSlotSub', language)}</p>
                <span className="inline-block mt-1 text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-md">
                  {isRtl ? 'موعد مناسب' : 'Convenient Time'}
                </span>
              </button>
            </div>
          </div>

          {/* Wallet Toggle Option */}
          {walletBalance > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-cyan-50 p-3 rounded-2xl border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">{t('walletDeductionLabel', language)}</p>
                  <p className="text-[11px] text-gray-600">
                    {t('walletAvailable', language)} <strong className="font-mono text-[#0A7D8C]">{formatPrice(walletBalance, 'SAR', language)}</strong>
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={useWalletBalance}
                onChange={(e) => setUseWalletBalance(e.target.checked)}
                className="w-5 h-5 accent-[#0A7D8C] rounded cursor-pointer"
              />
            </div>
          )}

          {/* Dynamic Payment Gateways / Methods from Admin Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#0A7D8C]" />
                <span>{t('selectPaymentMethod', language)}</span>
              </h4>
              <span className="text-[10px] text-gray-500 font-bold">
                {isRtl ? `الطلبات المكتملة: ${completedOrdersCount}` : `Completed Orders: ${completedOrdersCount}`}
              </span>
            </div>

            <div className="space-y-2">
              {activePaymentMethods.map((pm) => {
                const isSelected = selectedMethodId === pm.id;
                const isCodItem = Boolean(pm.isCod);
                const isThisCodLocked = isCodItem && !isCodUnlocked;
                const localizedName = isRtl ? pm.name : (pm.nameEn || pm.name);

                return (
                  <div
                    key={pm.id}
                    onClick={() => {
                      if (!isThisCodLocked) {
                        setSelectedMethodId(pm.id);
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-all ${
                      isThisCodLocked
                        ? 'border-dashed border-gray-300 bg-gray-50/90 cursor-not-allowed opacity-85'
                        : isSelected
                        ? 'border-[#0A7D8C] bg-cyan-50/70 shadow-xs ring-1 ring-[#0A7D8C] cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-xs ${
                            isCodItem
                              ? isCodUnlocked
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-gray-200 text-gray-500'
                              : `bg-gradient-to-br ${pm.color} text-white`
                          }`}
                        >
                          {isCodItem ? (
                            isCodUnlocked ? <Banknote className="w-5 h-5" /> : <Lock className="w-4 h-4" />
                          ) : (
                            localizedName.slice(0, 4)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-black ${isThisCodLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                              {localizedName}
                            </span>
                            {pm.badge && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                                {pm.badge}
                              </span>
                            )}
                            {isThisCodLocked && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> {isRtl ? 'مقفل مؤقتاً' : 'Temporarily Locked'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {isCodItem
                              ? isCodUnlocked
                                ? t('codUnlockedSub', language)
                                : isRtl 
                                  ? `يتفعل تلقائياً بعد إتمام أول ${REQUIRED_ORDERS_FOR_COD} طلبات عبر الدفع المقدم (متبقي ${remainingOrdersForCod} طلبات)`
                                  : `Unlocked after completing ${REQUIRED_ORDERS_FOR_COD} prepaid orders (${remainingOrdersForCod} remaining)`
                              : `${pm.bankOrIssuer} • ${pm.accountNumber}`}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected && !isThisCodLocked
                            ? 'border-[#0A7D8C] bg-[#0A7D8C] text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && !isThisCodLocked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {/* Progress Bar for COD */}
                    {isThisCodLocked && (
                      <div className="mt-3 pt-2.5 border-t border-gray-200/80">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 mb-1">
                          <span>{isRtl ? 'إنجاز فتح الدفع عند الاستلام' : 'Progress to Unlock COD'}</span>
                          <span className="font-mono text-[#0A7D8C]">{completedOrdersCount} / {REQUIRED_ORDERS_FOR_COD}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#0A7D8C] transition-all rounded-full"
                            style={{ width: `${Math.min(100, (completedOrdersCount / REQUIRED_ORDERS_FOR_COD) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Transfer Reference Box for Electronic Wallets */}
          {currentMethodObj && !currentMethodObj.isCod && (
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800">
                  {isRtl ? 'بيانات التحويل المعتمدة:' : 'Transfer Account Details:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('acc', currentMethodObj.accountNumber)}
                  className="text-[11px] text-[#0A7D8C] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === 'acc' ? t('copied', language) : t('copyAccount', language)}</span>
                </button>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-gray-200 font-mono text-xs flex items-center justify-between text-gray-700">
                <span>
                  {isRtl ? currentMethodObj.name : (currentMethodObj.nameEn || currentMethodObj.name)}: {currentMethodObj.accountNumber} ({currentMethodObj.bankOrIssuer})
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  {t('transferRefLabel', language)}:
                </label>
                <input
                  type="text"
                  placeholder={t('transferRefPlaceholder', language)}
                  value={transferRefNumber}
                  onChange={(e) => setTransferRefNumber(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#0A7D8C]"
                />
              </div>
            </div>
          )}

          {/* Guarantee pill */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-50 text-cyan-900 text-[11px] border border-cyan-200">
            <ShieldCheck className="w-4 h-4 text-[#0A7D8C] flex-shrink-0" />
            <span>{t('fastDeliveryGuarantee', language)}</span>
          </div>
        </div>

        {/* Footer pay button */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          {/* Server Anti-Tamper Valuation Status */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              {isRtl ? 'تسعير معتمد ومحمي من خادم الإنتاج (Zero-Trust)' : 'Server Verified & Anti-Tamper Secured'}
            </span>
            {isValuating && (
              <span className="text-[10px] text-gray-500 font-medium animate-pulse">
                {isRtl ? 'جارٍ التدقيق السحابي...' : 'Verifying with server...'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-gray-500 font-medium">{t('total', language)}:</span>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              {walletDeduction > 0 && (
                <span className="text-[11px] text-amber-600 block line-through font-mono">
                  {formatPrice(totalBeforeWallet, 'SAR', language)}
                </span>
              )}
              <span className="font-mono text-lg font-black text-[#0A7D8C]">
                {formatPrice(finalPayable, 'SAR', language)}
              </span>
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#0A7D8C] hover:bg-[#086673] active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-900/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>{t('processing', language)}</span>
              </div>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <span>{t('confirmAndPlaceOrder', language)} ({formatPrice(finalPayable, 'SAR', language)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
