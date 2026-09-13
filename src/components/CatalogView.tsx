import React, { useState } from 'react';
import { 
  Search, 
  Grid, 
  List, 
  Heart, 
  Plus, 
  Check, 
  Star, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Zap
} from 'lucide-react';
import { Product, AppLanguage, SubCategoryItem } from '../types';
import { CATEGORIES, DEPARTMENT_SECTIONS } from '../data/initialCatalog';
import { 
  t, 
  formatPrice, 
  getLocalizedProductName, 
  getLocalizedProductUnit, 
  getLocalizedProductBadge, 
  getLocalizedCategoryName 
} from '../lib/translations';

interface CatalogViewProps {
  products: Product[];
  selectedCategory: string;
  categories?: { id: string; name: string; nameEn?: string; icon: string; color: string; order?: number; isVisible?: boolean }[];
  language?: AppLanguage;
  onSelectCategory: (catId: string) => void;
  onOpenProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  selectedCategory,
  categories,
  language = 'ar',
  onSelectCategory,
  onOpenProduct,
  onAddToCart,
}) => {
  const isRtl = language === 'ar';
  const activeCategories = (categories || CATEGORIES).filter((c) => c.isVisible !== false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategoryItem | null>(null);
  const [sortBy, setSortBy] = useState<'POPULAR' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RATING'>('POPULAR');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 600);
  };

  // Determine if we should show the full visual Sections Explorer or the filtered Product Catalog
  const isExplorerView = selectedCategory === 'all' && !selectedSubCategory && !searchQuery.trim();

  // Filter products
  const safeProducts = products || [];
  const filteredProducts = safeProducts.filter((p) => {
    if (!p) return false;

    // Filter by subcategory if clicked
    if (selectedSubCategory) {
      if (p.subCategory && p.subCategory === selectedSubCategory.id) {
        return true;
      }
      const matchCat = p.category === selectedSubCategory.categoryRef;
      const subNameMatch =
        (p.name || '').toLowerCase().includes(selectedSubCategory.name.toLowerCase()) ||
        (p.nameEn || '').toLowerCase().includes(selectedSubCategory.name.toLowerCase()) ||
        (selectedSubCategory.nameEn && (p.nameEn || '').toLowerCase().includes(selectedSubCategory.nameEn.toLowerCase())) ||
        (p.description || '').toLowerCase().includes(selectedSubCategory.name.toLowerCase());
      return matchCat && subNameMatch;
    }

    // Filter by main category
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

    // Filter by search
    const matchesSearch =
      !searchQuery.trim() ||
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameEn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'PRICE_LOW') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'PRICE_HIGH') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'RATING') return (b.rating || 0) - (a.rating || 0);
    return (b.reviewsCount || 0) - (a.reviewsCount || 0);
  });

  const handleSubCategoryClick = (sub: SubCategoryItem) => {
    setSelectedSubCategory(sub);
    onSelectCategory(sub.categoryRef || 'all');
  };

  const handleBackToExplorer = () => {
    setSelectedSubCategory(null);
    onSelectCategory('all');
    setSearchQuery('');
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className={`flex-1 flex flex-col bg-white pb-20 font-sans ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Header matching user's screenshots */}
      <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20 shadow-xs space-y-3">
        {/* Top line: Delivery address pill + brand */}
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Location Delivery pill */}
          <div className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200/70 text-xs cursor-pointer transition-colors">
            <span className="text-[#0E8A5E] font-black flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-[#0E8A5E]" />
              {isRtl ? 'التوصيل' : 'Delivery'}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-700 font-bold max-w-[170px] truncate">
              {isRtl ? 'طريق سيئون - القطن، عبو...' : 'Seiyun - Shibam Highway...'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>

          {/* Brand mark */}
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black text-[#0B253A] tracking-tight">{t('appName', language)}</span>
            <span className="w-2 h-2 rounded-full bg-[#0E8A5E]" />
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedSubCategory) setSelectedSubCategory(null);
            }}
            placeholder={isRtl ? 'ابحث في حضرموت هايبر عن منتجات، طازج، بهارات، عسل...' : 'Search in Hadramout Hyper for produce, honey, spices...'}
            className={`w-full bg-[#F4F6F8] text-gray-800 placeholder-gray-400 text-xs font-bold rounded-2xl ${
              isRtl ? 'pr-10 pl-16' : 'pl-10 pr-16'
            } py-2.5 outline-none focus:ring-2 focus:ring-[#0E8A5E] transition-all`}
          />
          <Search className={`w-4 h-4 text-gray-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-3`} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-2.5 text-xs text-gray-400 hover:text-gray-600 font-bold cursor-pointer`}
            >
              {isRtl ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>

        {/* If in catalog filtered mode: category pills */}
        {!isExplorerView && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-2xl mx-auto pt-1">
            <button
              onClick={handleBackToExplorer}
              className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#E8F4F5] text-[#0E8A5E] hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
            >
              <BackIcon className="w-3.5 h-3.5" />
              <span>{isRtl ? 'كافة الأقسام' : 'All Departments'}</span>
            </button>

            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedSubCategory(null);
                  onSelectCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id && !selectedSubCategory
                    ? 'bg-[#0E8A5E] text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {getLocalizedCategoryName(cat.id, language, isRtl ? cat.name : (cat.nameEn || cat.name))}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isExplorerView ? (
        /* ========================================================
           SCREEN 1: THE VISUAL SECTIONS EXPLORER (Matching screenshots)
           ======================================================== */
        <div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-6">
          {DEPARTMENT_SECTIONS.map((section) => (
            <div key={section.id} className="space-y-3">
              {/* Section Header: Title + Emoji + View All */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-1.5">
                  <span>{isRtl ? section.title : (section.titleEn || section.title)}</span>
                  {section.emoji && <span>{section.emoji}</span>}
                </h3>

                <button
                  onClick={() => onSelectCategory(section.categoryRef || section.category || 'all')}
                  className="text-xs text-[#0E8A5E] font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isRtl ? 'عرض الكل' : 'View All'}</span>
                  <ForwardIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4-column Grid matching the user's images */}
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
                {(section.subcategories || section.subCategories || []).map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubCategoryClick(sub)}
                    className="flex flex-col items-center group cursor-pointer text-center"
                  >
                    {/* Pastel Cyan Rounded Box with Product Package Cutout */}
                    <div className="w-full aspect-square bg-[#E8F4F5] rounded-2xl p-2 sm:p-2.5 flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:scale-103 group-active:scale-95">
                      <img
                        src={sub.image}
                        alt={sub.name}
                        className="w-full h-full object-cover rounded-xl drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>

                    {/* Subcategory Label below the box */}
                    <span className="text-[11px] sm:text-xs font-bold text-gray-800 text-center leading-tight mt-1.5 line-clamp-2 px-0.5">
                      {isRtl ? sub.name : (sub.nameEn || sub.name)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ========================================================
           SCREEN 2: FILTERED PRODUCTS VIEW (When user clicks a category)
           ======================================================== */
        <div>
          {/* Breadcrumb & Control bar */}
          <div className="max-w-4xl mx-auto w-full px-4 py-3 flex items-center justify-between text-xs border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackToExplorer}
                className="text-[#0E8A5E] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <BackIcon className="w-3.5 h-3.5" />
                <span>{isRtl ? 'العودة للأقسام' : 'Back to Sections'}</span>
              </button>
              <span className="text-gray-300">•</span>
              <span className="font-extrabold text-gray-700">
                {selectedSubCategory
                  ? (isRtl ? selectedSubCategory.name : (selectedSubCategory.nameEn || selectedSubCategory.name))
                  : (selectedCategory === 'all'
                      ? (isRtl ? 'كل المنتجات' : 'All Products')
                      : getLocalizedCategoryName(selectedCategory, language, activeCategories.find((c) => c.id === selectedCategory)?.name))}
              </span>
              <span className="text-gray-400 font-mono">({sortedProducts.length})</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-xl shadow-xs">
                <SlidersHorizontal className="w-3 h-3 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-[11px] font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="POPULAR">{isRtl ? 'الأكثر طلباً' : 'Most Popular'}</option>
                  <option value="PRICE_LOW">{isRtl ? 'الأقل سعراً' : 'Price: Low to High'}</option>
                  <option value="PRICE_HIGH">{isRtl ? 'الأعلى سعراً' : 'Price: High to Low'}</option>
                  <option value="RATING">{isRtl ? 'الأعلى تقييماً ★' : 'Top Rated ★'}</option>
                </select>
              </div>

              {/* Grid/List switch */}
              <div className="flex items-center bg-gray-200/70 p-0.5 rounded-xl">
                <button
                  onClick={() => setViewMode('GRID')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'GRID' ? 'bg-white shadow-xs text-[#0E8A5E]' : 'text-gray-500'
                  }`}
                  title={isRtl ? 'عرض شبكي' : 'Grid View'}
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('LIST')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'LIST' ? 'bg-white shadow-xs text-[#0E8A5E]' : 'text-gray-500'
                  }`}
                  title={isRtl ? 'عرض قائمي' : 'List View'}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="max-w-4xl mx-auto w-full p-4">
            {sortedProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-3">
                <p className="text-base font-bold text-gray-600">
                  {isRtl ? 'لم يتم العثور على منتجات مطابقة للبحث' : 'No products found matching your search'}
                </p>
                <button
                  onClick={handleBackToExplorer}
                  className="px-4 py-2 rounded-xl bg-[#0E8A5E] text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {isRtl ? 'العودة لتصفح كافة الأقسام' : 'Return to all departments'}
                </button>
              </div>
            ) : viewMode === 'GRID' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {sortedProducts.map((prod) => {
                  const isFav = !!favorites[prod.id];
                  const isAdded = !!addedItemIds[prod.id];
                  const badgeText = getLocalizedProductBadge(prod.badge, prod.badgeEn, language);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => onOpenProduct(prod)}
                      className="bg-white rounded-2xl border border-gray-200 hover:border-[#0E8A5E] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between p-3 relative group"
                    >
                      <div className="relative">
                        <img
                          src={prod.image}
                          alt={getLocalizedProductName(prod, language)}
                          className="w-full h-32 sm:h-36 object-cover rounded-xl mb-2 group-hover:scale-102 transition-transform"
                          referrerPolicy="no-referrer"
                        />

                        <button
                          onClick={(e) => toggleFavorite(prod.id, e)}
                          className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs cursor-pointer transition-colors ${
                            isFav ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500' : ''}`} />
                        </button>

                        {badgeText && (
                          <span className={`absolute top-2 ${isRtl ? 'right-2' : 'left-2'} bg-[#F5A623] text-[#0B253A] text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs`}>
                            {badgeText}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mb-0.5">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{prod.rating}</span>
                          <span className="text-gray-400">({prod.reviewsCount})</span>
                        </div>

                        <h4 className="text-xs font-black text-gray-900 line-clamp-1">
                          {getLocalizedProductName(prod, language)}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {getLocalizedProductUnit(prod, language)}
                        </p>

                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-xs sm:text-sm font-black text-[#0E8A5E] font-mono">
                            {formatPrice(prod.price, prod.currency, language)}
                          </span>
                          {prod.originalPrice && (
                            <span className="text-[10px] text-gray-400 line-through">
                              {formatPrice(prod.originalPrice, prod.currency, language)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleQuickAdd(prod, e)}
                        className={`w-full mt-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#0E8A5E] hover:bg-[#0b6e4a] text-white active:scale-95 shadow-xs'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            <span>{isRtl ? 'تمت الإضافة!' : 'Added!'}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('addToCart', language)}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedProducts.map((prod) => {
                  const isAdded = !!addedItemIds[prod.id];
                  const isFav = !!favorites[prod.id];
                  return (
                    <div
                      key={prod.id}
                      onClick={() => onOpenProduct(prod)}
                      className="bg-white rounded-2xl border border-gray-200 hover:border-[#0E8A5E] p-3 flex items-center justify-between shadow-xs hover:shadow-sm cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={getLocalizedProductName(prod, language)}
                          className="w-16 h-16 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-xs font-black text-gray-900">{getLocalizedProductName(prod, language)}</h4>
                          <p className="text-[10px] text-gray-400">{getLocalizedProductUnit(prod, language)}</p>
                          <span className="text-xs font-black text-[#0E8A5E] font-mono mt-1 block">
                            {formatPrice(prod.price, prod.currency, language)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => toggleFavorite(prod.id, e)}
                          className={`p-2 rounded-xl hover:bg-gray-100 cursor-pointer ${
                            isFav ? 'text-red-500' : 'text-gray-400'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleQuickAdd(prod, e)}
                          className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#0E8A5E] text-white hover:bg-[#0b6e4a]'
                          }`}
                        >
                          {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{isAdded ? (isRtl ? 'تمت' : 'Done') : (isRtl ? 'إضافة' : 'Add')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

