import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Camera, 
  Flame, 
  Sparkles, 
  Plus, 
  Check, 
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Bell,
  Truck,
  TrendingUp,
  ShoppingBag
} from 'lucide-react';
import { Product, Recipe, BannerConfig, Branch, AppLanguage } from '../types';
import { CATEGORIES, PROMO_BANNERS } from '../data/initialCatalog';
import { HadramoutLogo } from './HadramoutLogo';
import { 
  t, 
  formatPrice, 
  getLocalizedProductName, 
  getLocalizedCategoryName,
  getLocalizedProductUnit,
  getLocalizedProductBadge,
  getLocalizedProductOrigin 
} from '../lib/translations';

export interface HomeViewProps {
  products: Product[];
  categories?: { id: string; name: string; icon: string; color: string; order?: number; isVisible?: boolean }[];
  banners?: BannerConfig[];
  currentBranch?: Branch;
  walletBalance?: number;
  unreadNotificationsCount?: number;
  isMobileFrame?: boolean;
  language?: AppLanguage;
  onOpenProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenBarcodeScanner: () => void;
  onOpenSearch?: () => void;
  onSelectCategory: (categoryId: string) => void;
  onAddRecipeIngredients: (recipe: Recipe) => void;
  onOpenBranchPicker?: () => void;
  onOpenNotifications?: () => void;
  onOpenWallet?: () => void;
  onOpenDocs?: () => void;
  onOpenWaitingRoom?: () => void;
  onToggleFrame?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  categories,
  banners,
  currentBranch,
  walletBalance = 125.0,
  unreadNotificationsCount = 2,
  language = 'ar',
  onOpenProduct,
  onAddToCart,
  onOpenBarcodeScanner,
  onOpenSearch,
  onSelectCategory,
  onAddRecipeIngredients,
  onOpenBranchPicker,
  onOpenNotifications,
  onOpenWallet,
}) => {
  const isRtl = language === 'ar';
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;
  const activeBanners = (banners || PROMO_BANNERS).filter((b) => b && b.isVisible !== false);
  const safeBanners = activeBanners.length > 0 ? activeBanners : PROMO_BANNERS;
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [selectedSubCategoryTab, setSelectedSubCategoryTab] = useState<string>('all');

  // Live Flash Deals countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto cycle banners
  useEffect(() => {
    if (safeBanners.length <= 1) return;
    const bannerInterval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % safeBanners.length);
    }, 4500);
    return () => clearInterval(bannerInterval);
  }, [safeBanners.length]);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 800);
  };

  // Filtered products for subcategory chips
  const filteredProducts = products.filter((p) => {
    if (selectedSubCategoryTab === 'all') return true;
    if (selectedSubCategoryTab === 'groceries') return p.category === 'pantry' || p.category === 'bakery';
    if (selectedSubCategoryTab === 'fresh') return p.category === 'fruits-veg' || p.category === 'fresh-meat' || p.category === 'dairy';
    if (selectedSubCategoryTab === 'drinks') return p.category === 'pantry' || p.category === 'dairy';
    if (selectedSubCategoryTab === 'homecare') return p.category === 'cleaning';
    if (selectedSubCategoryTab === 'personal') return p.category === 'personal-care';
    if (selectedSubCategoryTab === 'special') return p.category === 'hadramout-specials';
    return true;
  });

  // Flash deals products (first 4 items with discounts)
  const flashDeals = products.filter((p) => p.originalPrice).slice(0, 4);

  const subCategoryChips = [
    { id: 'all', label: t('catAll', language) },
    { id: 'groceries', label: `${t('catGroceries', language)} 🥪` },
    { id: 'fresh', label: `${t('catFresh', language)} 🍅` },
    { id: 'drinks', label: `${t('catBeverages', language)} 🥤` },
    { id: 'homecare', label: `${t('catHomeCare', language)} 🧴` },
    { id: 'personal', label: `${t('catPersonalCare', language)} 💅` },
    { id: 'special', label: `${t('catHadramoutSpecial', language)} 🍯` },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FA] pb-12 space-y-4 overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Burgundy Top Container matching the user's design image */}
      <div className="bg-gradient-to-b from-[#690B24] via-[#851134] to-[#A31840] text-white pt-3 pb-5 px-4 rounded-b-[28px] shadow-lg">
        <div className="max-w-4xl mx-auto space-y-3.5">
          {/* Top Bar: Store Logo & Notification */}
          <div className="flex items-center justify-between gap-2">
            {/* Store Brand Logo & Name */}
            <div className="flex items-center gap-2.5">
              <HadramoutLogo variant="icon" size={42} />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight font-serif drop-shadow-sm">
                {t('appName', language)}
              </h1>
            </div>

            {/* Notification Bell */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                title={t('notifications', language)}
              >
                <Bell className="w-4 h-4 text-white" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F5A623] text-[#0B253A] font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Search Bar - Big Rounded White Input matching image (Click opens SearchScreenModal) */}
          <div className="relative">
            <div 
              onClick={() => onOpenSearch && onOpenSearch()}
              className="bg-white text-gray-800 rounded-2xl shadow-md p-1 pl-2.5 pr-3 flex items-center gap-2 cursor-pointer hover:ring-2 hover:ring-white/40 active:scale-[0.99] transition-all"
            >
              <Search className="w-4 h-4 text-[#851134] flex-shrink-0" />
              <input
                type="text"
                readOnly
                placeholder={t('searchPlaceholder', language)}
                className="w-full text-xs font-bold text-gray-800 placeholder-gray-400 outline-none bg-transparent py-1.5 cursor-pointer"
              />
              {/* Camera Scanner shortcut */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBarcodeScanner();
                }}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                title={isRtl ? 'ماسح الباركود بالكاميرا' : 'Scan Barcode with Camera'}
              >
                <Camera className="w-4 h-4 text-[#851134]" />
              </button>
            </div>
          </div>

          {/* Hero Promotional Banner Carousel */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-900 min-h-[175px] sm:min-h-[195px]">
            {safeBanners.map((banner, idx) => {
              const isCurrent = idx === activeBannerIdx;
              const bannerImg =
                banner.imageUrl ||
                '/assets/images/banner_grocery.svg';

              return (
                <div
                  key={banner.id}
                  className={`relative w-full h-full transition-opacity duration-700 ${
                    isCurrent ? 'opacity-100 block' : 'opacity-0 hidden'
                  }`}
                >
                  <img
                    src={bannerImg}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

                  <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between min-h-[175px] sm:min-h-[195px] text-white">
                    <div>
                      {banner.tag && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#F5A623] text-[#0B253A] text-[10px] font-black uppercase tracking-wider mb-2">
                          {isRtl ? banner.tag : (banner.tagEn || banner.tag)}
                        </span>
                      )}
                      <h2 className="text-lg sm:text-2xl font-black leading-tight max-w-sm drop-shadow-md">
                        {isRtl ? banner.title : (banner.titleEn || banner.title)}
                      </h2>
                      {banner.subtitle && (
                        <p className="text-xs sm:text-sm text-gray-200 mt-1 max-w-xs line-clamp-2">
                          {isRtl ? banner.subtitle : (banner.subtitleEn || banner.subtitle)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => onSelectCategory('all')}
                        className="px-4 py-1.5 rounded-full bg-white text-[#851134] text-xs font-black hover:bg-rose-50 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1"
                      >
                        <span>{isRtl ? (banner.buttonText || 'تسوق الآن') : (banner.buttonTextEn || banner.buttonText || 'Shop Now')}</span>
                        <ArrowIcon className="w-3.5 h-3.5" />
                      </button>

                      {/* Carousel Indicator Dots */}
                      <div className="flex gap-1.5">
                        {safeBanners.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              i === activeBannerIdx ? 'w-5 bg-[#F5A623]' : 'w-1.5 bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="max-w-4xl mx-auto w-full px-4 space-y-5">
        
        {/* 2. Free Delivery Banner Pill */}
        <div className="bg-[#EBF7F8] border border-cyan-100/90 rounded-2xl p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-200 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6 text-cyan-700" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                {t('freeDeliveryPromo', language)}
              </h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {t('freeDeliveryNote', language)}
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectCategory('all')}
            className="px-3.5 py-1.5 rounded-full bg-[#E11D48] hover:bg-rose-700 active:scale-95 text-white text-xs font-black flex items-center gap-1 shadow-md transition-all cursor-pointer flex-shrink-0"
          >
            <span>{t('hyperDelivery', language)} ⚡</span>
            <ArrowIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. Section: "خصيصاً لك 🔥" */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-[#E11D48] rounded-full" />
              <div>
                <h3 className="text-base font-black text-gray-900 leading-tight flex items-center gap-1">
                  <span>{t('featuredForYou', language)}</span>
                  <span>🔥</span>
                </h3>
                <p className="text-[11px] text-gray-500">{t('tailoredForYou', language)}</p>
              </div>
            </div>

            <button
              onClick={() => onSelectCategory('all')}
              className="text-xs text-[#0E8A5E] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{t('viewMore', language)}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Horizontal category chips matching image */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none pr-0.5">
            {subCategoryChips.map((chip) => {
              const isActive = selectedSubCategoryTab === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedSubCategoryTab(chip.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* 4. 2-Column Product Grid exactly matching image style */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.slice(0, 8).map((prod) => {
              const isJustAdded = addedItemIds[prod.id];
              const curr = prod.currency || 'SAR';

              return (
                <div
                  key={prod.id}
                  onClick={() => onOpenProduct(prod)}
                  className="bg-white rounded-3xl p-3 border border-gray-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative group"
                >
                  {/* Top image area */}
                  <div className="relative w-full aspect-square rounded-2xl bg-gray-50/70 p-2 mb-2 flex items-center justify-center overflow-hidden">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Currency Tag */}
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-black">
                      {curr === 'YER' ? (isRtl ? 'ر.ي' : 'YER') : (isRtl ? 'ر.س' : 'SAR')}
                    </span>

                    {/* Add to cart rounded-square button at bottom-right inside image */}
                    <button
                      onClick={(e) => handleQuickAdd(prod, e)}
                      className={`absolute bottom-2 right-2 w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                        isJustAdded
                          ? 'bg-[#0E8A5E] border-[#0E8A5E] text-white scale-110'
                          : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 active:scale-90'
                      }`}
                      title={t('addToCart', language)}
                    >
                      {isJustAdded ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Social proof trending line from design */}
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 mb-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">
                      {prod.socialProof || (isRtl ? `اشترى +${prod.buyersYesterday || 500} عميل أمس` : `+${prod.buyersYesterday || 500} bought yesterday`)}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-snug line-clamp-2">
                    {getLocalizedProductName(prod, language)}
                  </h4>

                  {/* Unit */}
                  <p className="text-[11px] text-gray-500 mt-0.5">{getLocalizedProductUnit(prod, language)}</p>

                  {/* Price Row */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-50">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm sm:text-base font-black text-gray-900">
                        {formatPrice(prod.price, curr, language)}
                      </span>
                    </div>

                    {prod.originalPrice && (
                      <span className="text-[10px] text-gray-400 line-through">
                        {formatPrice(prod.originalPrice, curr, language)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Super Offer Strip */}
        <div className="bg-gradient-to-r from-[#FF007A] via-[#E11D48] to-[#BE123C] rounded-2xl p-3 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <div>
              <h4 className="text-xs sm:text-sm font-black leading-tight">
                {t('superWeeklyDeal', language)}
              </h4>
              <p className="text-[10px] text-rose-100">
                {t('saveUpTo50', language)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectCategory('all')}
            className="px-3 py-1 rounded-full bg-white text-[#BE123C] text-xs font-black hover:bg-rose-50 active:scale-95 transition-all cursor-pointer flex-shrink-0"
          >
            {t('browseSuper', language)}
          </button>
        </div>

        {/* 6. Flash Deals with Live Countdown Clock */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Flame className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-gray-900">
                    {t('flashDealsTitle', language)}
                  </h3>
                  <span className="text-[10px] bg-red-500 text-white font-black px-2 py-0.5 rounded-full">
                    {t('discountsUpTo45', language)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">{t('limitedQuantities', language)}</p>
              </div>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-1.5 text-xs font-mono font-black" dir="ltr">
              <div className="bg-[#0B253A] text-white px-2.5 py-1 rounded-xl shadow-xs">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <span className="text-gray-400 font-bold">:</span>
              <div className="bg-[#0B253A] text-white px-2.5 py-1 rounded-xl shadow-xs">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <span className="text-gray-400 font-bold">:</span>
              <div className="bg-red-600 text-white px-2.5 py-1 rounded-xl shadow-xs animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {flashDeals.map((prod) => {
              const discountPercent = prod.originalPrice
                ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
                : 0;
              const curr = prod.currency || 'SAR';

              return (
                <div
                  key={prod.id}
                  onClick={() => onOpenProduct(prod)}
                  className="p-3 rounded-2xl bg-gray-50 hover:bg-emerald-50/40 border border-gray-200/80 hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="relative aspect-square mb-2 rounded-xl overflow-hidden bg-white p-1">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                      -{discountPercent}%
                    </span>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-mono px-1 rounded">
                      {curr === 'YER' ? (isRtl ? 'ر.ي' : 'YER') : (isRtl ? 'ر.س' : 'SAR')}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-gray-900 truncate">
                      {getLocalizedProductName(prod, language)}
                    </h4>
                    <p className="text-[10px] text-gray-500">{getLocalizedProductUnit(prod, language)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-xs font-black text-[#0E8A5E]">
                          {formatPrice(prod.price, curr, language)}
                        </span>
                        {prod.originalPrice && (
                          <span className="block text-[9px] text-gray-400 line-through">
                            {formatPrice(prod.originalPrice, curr, language)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleQuickAdd(prod, e)}
                        className="w-7 h-7 rounded-lg bg-[#0E8A5E] hover:bg-[#095B3E] active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
