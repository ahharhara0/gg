import React from 'react';
import { Home, LayoutGrid, Tag, User, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { CartItem, AppLanguage } from '../types';
import { t, formatPrice } from '../lib/translations';

interface BottomNavProps {
  activeTab: 'home' | 'catalog' | 'deals' | 'profile';
  cartItems: CartItem[];
  language?: AppLanguage;
  onSelectTab: (tab: 'home' | 'catalog' | 'deals' | 'profile') => void;
  onOpenCart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  cartItems,
  language = 'ar',
  onSelectTab,
  onOpenCart,
}) => {
  const safeCartItems = cartItems || [];
  const totalItemsCount = safeCartItems.reduce((sum, item) => sum + (item?.quantity || 0), 0);
  const isRtl = language === 'ar';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  // Compute breakdown by currency
  const totalSAR = safeCartItems
    .filter((i) => (i.product?.currency || 'SAR') === 'SAR')
    .reduce((sum, item) => sum + ((item?.product?.price || 0) * (item?.quantity || 0)), 0);
  const totalYER = safeCartItems
    .filter((i) => i.product?.currency === 'YER')
    .reduce((sum, item) => sum + ((item?.product?.price || 0) * (item?.quantity || 0)), 0);

  return (
    <div className="sticky bottom-0 z-30 w-full pointer-events-none pb-2 sm:pb-3 px-3">
      {/* Floating Cart Notification Pill if cart has items */}
      {totalItemsCount > 0 && (
        <div className="max-w-md mx-auto w-full pb-2 pointer-events-auto">
          <button
            onClick={onOpenCart}
            className="w-full bg-[#0B253A] hover:bg-[#12314b] active:scale-[0.98] text-white p-3 rounded-2xl shadow-xl border border-emerald-500/30 flex items-center justify-between cursor-pointer transition-all animate-in fade-in slide-in-from-bottom duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-[#0E8A5E] flex items-center justify-center text-white font-bold flex-shrink-0">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#F5A623] text-[#0B253A] text-xs font-black flex items-center justify-center shadow-md">
                  {totalItemsCount}
                </span>
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <p className="text-xs text-emerald-200 font-bold">{t('smartCart', language)}</p>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  {totalSAR > 0 && <span>{formatPrice(totalSAR, 'SAR', language)}</span>}
                  {totalSAR > 0 && totalYER > 0 && <span className="text-gray-400">+</span>}
                  {totalYER > 0 && <span>{formatPrice(totalYER, 'YER', language)}</span>}
                  <span className="text-[11px] font-normal text-gray-300">
                    ({totalItemsCount} {t('itemsCount', language)})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold text-[#F5A623] bg-white/10 px-3 py-1.5 rounded-xl flex-shrink-0">
              <span>{t('viewCart', language)}</span>
              <Arrow className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Modern 4-Tab Navigation Bar (Voice Assistant Removed) */}
      <nav className="max-w-md mx-auto w-full bg-white/95 backdrop-blur-md rounded-full border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-3 py-1.5 flex items-center justify-around pointer-events-auto">
        {/* Tab 1: Home (الرئيسية) */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-[#0E8A5E]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'home' ? 'font-black text-[#0E8A5E]' : 'font-medium text-gray-500'}`}>
            {t('tabHome', language)}
          </span>
        </button>

        {/* Tab 2: Categories (الأقسام) */}
        <button
          onClick={() => onSelectTab('catalog')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'catalog' ? 'text-[#0E8A5E]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <LayoutGrid className={`w-5 h-5 ${activeTab === 'catalog' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'catalog' ? 'font-black text-[#0E8A5E]' : 'font-medium text-gray-500'}`}>
            {t('tabCatalog', language)}
          </span>
        </button>

        {/* Tab 3: Cart (السلة) */}
        <button
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer text-gray-400 hover:text-gray-700 relative"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-[1.8px]" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#0E8A5E] text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {totalItemsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-gray-500 mt-0.5">
            {t('tabCart', language)}
          </span>
        </button>

        {/* Tab 4: Profile (حسابي) */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-[#0A7D8C]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5px] fill-[#0A7D8C]/20' : 'stroke-[1.8px]'}`} />
          <span className={`text-[11px] mt-0.5 ${activeTab === 'profile' ? 'font-black text-[#0A7D8C]' : 'font-medium text-gray-500'}`}>
            {t('tabProfile', language)}
          </span>
        </button>
      </nav>
    </div>
  );
};
