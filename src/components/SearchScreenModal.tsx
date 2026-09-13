import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Clock, 
  Flame, 
  ShoppingBag, 
  Check, 
  Camera, 
  Sparkles, 
  Coins,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Product, AppLanguage, ProductCurrency } from '../types';
import { CATEGORIES } from '../data/initialCatalog';
import { t, formatPrice, getLocalizedProductName, getLocalizedCategoryName } from '../lib/translations';

interface SearchScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  language: AppLanguage;
  onOpenProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenBarcodeScanner: () => void;
  onSelectCategory: (categoryId: string) => void;
}

const DEFAULT_RECENT_SEARCHES_AR = ['حليب المراعي', 'أرز بسمتي', 'عسل دوعني', 'زيت زيتون', 'دجاج ساديا'];
const DEFAULT_RECENT_SEARCHES_EN = ['Almarai Milk', 'Basmati Rice', 'Doany Honey', 'Olive Oil', 'Sadia Chicken'];

const TRENDING_SEARCHES_AR = [
  'عسل سدر دوعني 🍯',
  'أرز بنجاب الشعلان 🌾',
  'حليب المراعي طازج 🥛',
  'دجاج الوطنية مبرد 🍗',
  'زيت سمسم حضرمي معصور 🫒',
  'قهوة حضرمية بالهيل ☕',
  'جبن كيري كريمي 🧀',
  'تمر خلاص فاخر 🌴'
];

const TRENDING_SEARCHES_EN = [
  'Doany Sidr Honey 🍯',
  'Al Shalan Basmati Rice 🌾',
  'Almarai Fresh Milk 🥛',
  'Al Watania Fresh Chicken 🍗',
  'Pressed Hadrami Sesame Oil 🫒',
  'Cardamom Hadrami Coffee ☕',
  'Kiri Creamy Cheese 🧀',
  'Premium Khalas Dates 🌴'
];

export const SearchScreenModal: React.FC<SearchScreenModalProps> = ({
  isOpen,
  onClose,
  products,
  language,
  onOpenProduct,
  onAddToCart,
  onOpenBarcodeScanner,
  onSelectCategory,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<'ALL' | ProductCurrency>('ALL');
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hadramout_recent_searches');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return language === 'ar' ? DEFAULT_RECENT_SEARCHES_AR : DEFAULT_RECENT_SEARCHES_EN;
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isRtl = language === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const handleSearchSubmit = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    
    // Add to recent searches
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('hadramout_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('hadramout_recent_searches');
    } catch {
      // ignore
    }
  };

  const handleRemoveRecentItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== item);
      try {
        localStorage.setItem('hadramout_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 1000);
  };

  // Filter products by search text and currency
  const filteredProducts = products.filter((p) => {
    // Currency filter
    if (selectedCurrencyFilter !== 'ALL') {
      const prodCurr = p.currency || 'SAR';
      if (prodCurr !== selectedCurrencyFilter) return false;
    }

    if (!query.trim()) return false;

    const q = query.toLowerCase();
    const matchNameAr = p.name.toLowerCase().includes(q);
    const matchNameEn = (p.nameEn || '').toLowerCase().includes(q);
    const matchDesc = (p.description || '').toLowerCase().includes(q);
    const matchCategory = (p.category || '').toLowerCase().includes(q);
    const matchOrigin = (p.origin || '').toLowerCase().includes(q);

    return matchNameAr || matchNameEn || matchDesc || matchCategory || matchOrigin;
  });

  const trendingList = language === 'ar' ? TRENDING_SEARCHES_AR : TRENDING_SEARCHES_EN;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 overflow-hidden animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="w-full h-full md:max-w-2xl md:h-[90vh] bg-[#F8F9FA] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Search Bar Header matching user's design image */}
        <div className="bg-gradient-to-r from-[#690B24] via-[#851134] to-[#A31840] text-white p-3.5 sm:p-4 shadow-md flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer flex-shrink-0"
              title={isRtl ? 'رجوع' : 'Back'}
            >
              <BackArrow className="w-5 h-5" />
            </button>

            {/* Big Search Input Field */}
            <div className="flex-1 bg-white text-gray-800 rounded-2xl shadow-inner px-3 py-1.5 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#851134] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSubmit(query);
                }}
                placeholder={t('searchPlaceholder', language)}
                className="w-full text-xs sm:text-sm font-bold text-gray-800 placeholder-gray-400 outline-none bg-transparent py-1"
              />

              {/* Clear button if text exists */}
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Barcode Camera Scanner */}
              <button
                onClick={() => {
                  onClose();
                  onOpenBarcodeScanner();
                }}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                title={isRtl ? 'مسح الباركود بالكاميرا' : 'Scan Barcode with Camera'}
              >
                <Camera className="w-4 h-4 text-[#851134]" />
              </button>
            </div>
          </div>

          {/* Currency Filter Bar inside header */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/15 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-white/80 flex items-center gap-1 flex-shrink-0">
              <Coins className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>{t('filterByCurrency', language)}:</span>
            </span>
            <button
              onClick={() => setSelectedCurrencyFilter('ALL')}
              className={`px-3 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer flex-shrink-0 ${
                selectedCurrencyFilter === 'ALL'
                  ? 'bg-white text-[#851134] shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {t('allCurrencies', language)}
            </button>
            <button
              onClick={() => setSelectedCurrencyFilter('SAR')}
              className={`px-3 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer flex-shrink-0 ${
                selectedCurrencyFilter === 'SAR'
                  ? 'bg-[#F5A623] text-[#0B253A] shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {t('currencySAR', language)}
            </button>
            <button
              onClick={() => setSelectedCurrencyFilter('YER')}
              className={`px-3 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer flex-shrink-0 ${
                selectedCurrencyFilter === 'YER'
                  ? 'bg-[#F5A623] text-[#0B253A] shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {t('currencyYER', language)}
            </button>
          </div>
        </div>

        {/* Modal Body: Either Initial Explore State OR Search Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          
          {/* STATE A: User hasn't typed anything yet */}
          {!query.trim() && (
            <>
              {/* 1. Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-gray-800 font-black text-xs sm:text-sm">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{t('recentSearches', language)}</span>
                    </div>
                    <button
                      onClick={handleClearAllRecent}
                      className="text-[11px] font-bold text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      {t('clearAll', language)}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <div
                        key={i}
                        onClick={() => handleSearchSubmit(term)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200/80 text-gray-700 hover:text-emerald-800 text-xs font-bold transition-all cursor-pointer group"
                      >
                        <span>{term}</span>
                        <button
                          onClick={(e) => handleRemoveRecentItem(e, term)}
                          className="text-gray-400 hover:text-red-500 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Popular & Trending Searches */}
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
                <div className="flex items-center gap-2 text-gray-800 font-black text-xs sm:text-sm mb-3">
                  <Flame className="w-4 h-4 text-[#F5A623]" />
                  <span>{t('popularSearches', language)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {trendingList.map((term, i) => {
                    const cleanTerm = term.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
                    return (
                      <button
                        key={i}
                        onClick={() => handleSearchSubmit(cleanTerm)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 text-gray-800 hover:text-amber-900 text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        {term}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Browse by Category quick cards */}
              <div className="space-y-2">
                <h3 className="text-xs sm:text-sm font-black text-gray-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#851134]" />
                  <span>{t('browseCategories', language)}</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onClose();
                        onSelectCategory(cat.id);
                      }}
                      className="p-3 rounded-2xl bg-white border border-gray-100 hover:border-emerald-500/50 hover:shadow-md transition-all flex items-center gap-2.5 text-right cursor-pointer group"
                    >
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.name.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {getLocalizedCategoryName(cat.id, language, cat.name)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STATE B: User has typed a query */}
          {query.trim() && (
            <div className="space-y-4">
              {/* Header indicator */}
              <div className="flex items-center justify-between text-xs text-gray-500 font-bold border-b border-gray-200 pb-2">
                <span>
                  {t('searchResults', language)}: "{query}"
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-black">
                  {filteredProducts.length} {t('foundProducts', language)}
                </span>
              </div>

              {/* No results empty state */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-3xl border border-gray-100 shadow-xs space-y-3">
                  <div className="w-16 h-16 rounded-full bg-rose-50 text-[#851134] flex items-center justify-center mx-auto">
                    <Search className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-gray-800">
                    {t('noSearchResults', language)}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {t('trySearchingOther', language)}
                  </p>
                  
                  {/* Quick suggestions */}
                  <div className="pt-2 flex flex-wrap gap-2 justify-center">
                    {trendingList.slice(0, 4).map((trm, idx) => {
                      const clean = trm.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSearchSubmit(clean)}
                          className="px-3 py-1 rounded-full bg-gray-100 hover:bg-emerald-100 text-xs font-bold text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                        >
                          {clean}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Results List / Grid matching the mockup */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredProducts.map((product) => {
                    const isAdded = !!addedItems[product.id];
                    const curr = product.currency || 'SAR';

                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          onClose();
                          onOpenProduct(product);
                        }}
                        className="bg-white rounded-2xl p-3 border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        {/* Product Image */}
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          {/* Currency Tag */}
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.2 rounded">
                            {curr === 'YER' ? (language === 'ar' ? 'ر.ي' : 'YER') : (language === 'ar' ? 'ر.س' : 'SAR')}
                          </span>
                        </div>

                        {/* Product Meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                              {getLocalizedCategoryName(product.category, language)}
                            </span>
                            {product.origin && (
                              <span className="text-[10px] text-gray-500 font-medium">
                                • {product.origin}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs sm:text-sm font-black text-gray-900 truncate mt-0.5 group-hover:text-emerald-800 transition-colors">
                            {getLocalizedProductName(product, language)}
                          </h4>

                          {/* Price Display */}
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-sm font-black text-[#851134]">
                              {formatPrice(product.price, curr, language)}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-[10px] text-gray-400 line-through">
                                {formatPrice(product.originalPrice, curr, language)}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {product.unit}
                          </p>
                        </div>

                        {/* Quick Add Button */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={(e) => handleQuickAdd(e, product)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#0E8A5E] hover:bg-[#095B3E] text-white'
                            }`}
                            title={t('addToCart', language)}
                          >
                            {isAdded ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <ShoppingBag className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
