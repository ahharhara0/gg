import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Tag, 
  Truck, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { CartItem, AppLanguage } from '../types';
import { 
  t, 
  formatPrice, 
  getLocalizedProductName, 
  getLocalizedProductUnit 
} from '../lib/translations';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  language?: AppLanguage;
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: (appliedDiscount: number, promoCode: string) => void;
}

const FREE_DELIVERY_THRESHOLD = 150.0;

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  language = 'ar',
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  const isRtl = language === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    percent?: number;
    isServerVerified?: boolean;
  } | null>({
    code: 'HADRAMOUT10',
    discountAmount: 0,
    percent: 10,
    isServerVerified: true,
  });
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  if (!isOpen) return null;

  const safeCartItems = cartItems || [];
  const subtotal = safeCartItems.reduce(
    (sum, item) => sum + ((item?.product?.price || 0) * (item?.quantity || 0)),
    0
  );

  // Free delivery calculation
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  // Discounts
  const promoDiscountAmount = appliedPromo
    ? appliedPromo.discountAmount > 0
      ? appliedPromo.discountAmount
      : (subtotal * (appliedPromo.percent || 0)) / 100
    : 0;

  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : 15.0;
  const taxableAmount = Math.max(0, subtotal - promoDiscountAmount);
  const vatAmount = taxableAmount * 0.15;
  const grandTotal = taxableAmount + vatAmount + deliveryFee;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setIsValidatingPromo(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code, subtotal }),
      });
      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedPromo({
          code: data.code,
          discountAmount: data.discountAmount,
          isServerVerified: true,
        });
        setPromoInput('');
      } else {
        setPromoError(data.message || (isRtl ? 'كود غير صالح أو منتهي الصلاحية' : 'Invalid or expired promo code'));
      }
    } catch {
      // Fallback offline validation for verified codes
      if (code === 'HADRAMOUT10' || code === 'WELCOME20' || code === 'WADI50') {
        const fallbackPercent = code === 'WELCOME20' ? 20 : 10;
        setAppliedPromo({ code, discountAmount: 0, percent: fallbackPercent });
        setPromoInput('');
      } else {
        setPromoError(isRtl ? 'تعذر التحقق من الخادم أو الكود غير صالح' : 'Failed to verify code with server');
      }
    } finally {
      setIsValidatingPromo(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center ${isRtl ? 'justify-end' : 'justify-start'} bg-black/60 backdrop-blur-xs animate-in fade-in`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className={`w-full max-w-md h-full bg-white shadow-2xl flex flex-col relative animate-in ${isRtl ? 'slide-in-from-right' : 'slide-in-from-left'} duration-300`}>
        {/* Header */}
        <div className="bg-[#0E8A5E] text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-[#F5A623]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">{t('smartCart', language)}</h3>
              <p className="text-xs text-emerald-100">
                {safeCartItems.length} {t('itemsCount', language)}
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

        {/* Free Delivery Bar */}
        <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-[#0E8A5E] flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#F5A623]" />
              {remainingForFreeDelivery === 0 ? (
                <span className="text-emerald-700 font-black">{t('freeDeliveryUnlocked', language)}</span>
              ) : (
                <span>
                  {isRtl ? (
                    <>أضف بـ <strong className="font-mono text-[#0B253A]">{formatPrice(remainingForFreeDelivery, 'SAR', language)}</strong> للتوصيل المجاني</>
                  ) : (
                    <>Add <strong className="font-mono text-[#0B253A]">{formatPrice(remainingForFreeDelivery, 'SAR', language)}</strong> for free delivery</>
                  )}
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold text-gray-500 font-mono">
              {Math.round(freeDeliveryProgress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-emerald-200/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0E8A5E] to-[#F5A623] rounded-full transition-all duration-500"
              style={{ width: `${freeDeliveryProgress}%` }}
            />
          </div>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {safeCartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <ShoppingBag className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-sm font-black text-gray-700">{t('cartEmptyTitle', language)}</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                {t('cartEmptySubtitle', language)}
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#0E8A5E] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-[#095B3E] transition-all"
              >
                {t('browseProductsNow', language)}
              </button>
            </div>
          ) : (
            safeCartItems.map((item) => {
              const product = item?.product;
              const quantity = item?.quantity || 1;
              if (!product) return null;
              return (
                <div
                  key={product.id}
                  className="p-3 bg-white rounded-2xl border border-gray-200 hover:border-emerald-200 shadow-xs flex items-center gap-3 transition-all"
                >
                  <img
                    src={product.image}
                    alt={product.name || ''}
                    className="w-16 h-16 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">
                      {getLocalizedProductName(product, language)}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatPrice(product.price || 0, product.currency, language)} / {getLocalizedProductUnit(product, language)}
                    </p>
                    <p className="text-xs font-black text-[#0E8A5E] mt-1 font-mono">
                      {formatPrice((product.price || 0) * quantity, product.currency, language)}
                    </p>
                  </div>

                  {/* Quantity modifier */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => onRemoveItem(product.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                      title={t('deleteItem', language)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1 rounded-xl">
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        className="w-5 h-5 rounded-lg bg-white flex items-center justify-center text-gray-600 shadow-2xs hover:bg-gray-100 cursor-pointer"
                        title={isRtl ? 'تقليل' : 'Decrease'}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-black text-gray-800 font-mono">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        className="w-5 h-5 rounded-lg bg-white flex items-center justify-center text-gray-600 shadow-2xs hover:bg-gray-100 cursor-pointer"
                        title={isRtl ? 'زيادة' : 'Increase'}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Promo code & bill breakdown (only if items in cart) */}
        {safeCartItems.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
            {/* Promo code input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t('promoPlaceholder', language)}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className={`w-full bg-white border border-gray-200 rounded-xl ${isRtl ? 'pr-3 pl-8' : 'pl-3 pr-8'} py-2 text-xs text-gray-800 uppercase font-bold outline-none focus:border-[#0E8A5E]`}
                />
                <Tag className={`w-3.5 h-3.5 text-gray-400 absolute ${isRtl ? 'left-3' : 'right-3'} top-2.5`} />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0B253A] hover:bg-[#15344f] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {t('applyCode', language)}
              </button>
            </form>

            {appliedPromo && (
              <div className="flex items-center justify-between bg-emerald-50 px-3 py-1.5 rounded-xl text-xs text-[#0E8A5E] font-bold border border-emerald-200">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623]" />
                  {isRtl 
                    ? `كود الخصم ${appliedPromo.code} مفعل (${appliedPromo.percent}%)` 
                    : `Promo code ${appliedPromo.code} applied (${appliedPromo.percent}%)`}
                </span>
                <button
                  type="button"
                  onClick={() => setAppliedPromo(null)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer text-[10px]"
                >
                  {isRtl ? 'إزالة' : 'Remove'}
                </button>
              </div>
            )}

            {promoError && (
              <p className="text-[11px] text-red-500 font-bold">{promoError}</p>
            )}

            {/* Bill summary list */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-gray-200/80 text-gray-600">
              <div className="flex justify-between">
                <span>{t('subtotal', language)}</span>
                <span className="font-mono font-bold text-gray-800">
                  {formatPrice(subtotal, 'SAR', language)}
                </span>
              </div>
              {promoDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>{t('codeDiscount', language)}</span>
                  <span className="font-mono">
                    -{formatPrice(promoDiscountAmount, 'SAR', language)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t('tax', language)} (15%)</span>
                <span className="font-mono font-bold text-gray-800">
                  {formatPrice(vatAmount, 'SAR', language)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('deliveryFee', language)}</span>
                <span className="font-mono font-bold text-gray-800">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-black">{t('freeDelivery', language)} 🎁</span>
                  ) : (
                    formatPrice(deliveryFee, 'SAR', language)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#0B253A] pt-2 border-t border-gray-300">
                <span>{t('total', language)}</span>
                <span className="font-mono text-base text-[#0E8A5E]">
                  {formatPrice(grandTotal, 'SAR', language)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => onProceedToCheckout(promoDiscountAmount, appliedPromo?.code || '')}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0E8A5E] hover:bg-[#095B3E] active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-between shadow-xl shadow-emerald-800/30 transition-all cursor-pointer"
            >
              <span>{t('proceedToPayment', language)}</span>
              <div className="flex items-center gap-1 font-mono font-black">
                <span>{formatPrice(grandTotal, 'SAR', language)}</span>
                <ArrowIcon className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
