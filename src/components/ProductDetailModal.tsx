import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Share2, 
  Heart, 
  Check 
} from 'lucide-react';
import { Product, AppLanguage } from '../types';
import { 
  t, 
  formatPrice, 
  getLocalizedProductName, 
  getLocalizedProductUnit, 
  getLocalizedProductDescription 
} from '../lib/translations';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  allProducts: Product[];
  language?: AppLanguage;
  onOpenProduct: (product: Product) => void;
  onOpenCart?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  allProducts,
  language = 'ar',
  onOpenProduct,
  onOpenCart,
}) => {
  const isRtl = language === 'ar';
  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [addedCompanionIds, setAddedCompanionIds] = useState<string[]>([]);
  const [copiedLinkToast, setCopiedLinkToast] = useState(false);

  // Reset state when product changes
  React.useEffect(() => {
    if (product) {
      setQuantity(1);
      setIsFavorited(false);
      setAddedAnimation(false);
    }
  }, [product?.id]);

  // Curate "Frequently Bought Together" (يشترى معه) items
  // Prioritize companions matching image (Olive oil, Tahina, Garlic, Lemon) or complementary items
  const companionProducts = React.useMemo(() => {
    if (!product) return [];
    const list: Product[] = [];
    const targetIds = ['p-basha-olive-oil', 'p-saqia-tahina', 'p-garlic', 'p-lemon'];
    
    // If current product is one of these, replace with others
    for (const tid of targetIds) {
      if (tid !== product.id) {
        const found = allProducts.find((p) => p.id === tid);
        if (found) list.push(found);
      }
    }

    // Fill up to 4 items if needed
    if (list.length < 4) {
      const extra = allProducts
        .filter((p) => p.id !== product.id && !list.some((l) => l.id === p.id))
        .slice(0, 4 - list.length);
      list.push(...extra);
    }

    return list;
  }, [allProducts, product?.id]);

  // Do conditional early return ONLY after ALL hooks are called
  if (!product) return null;

  const effectivePrice = product.price;
  const totalPrice = effectivePrice * quantity;
  const originalTotalPrice = product.originalPrice ? product.originalPrice * quantity : null;

  const handleAddMain = () => {
    onAddToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 600);
  };

  const handleAddCompanion = (comp: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(comp, 1);
    setAddedCompanionIds((prev) => [...prev, comp.id]);
    setTimeout(() => {
      setAddedCompanionIds((prev) => prev.filter((id) => id !== comp.id));
    }, 1200);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `${product.name} من حضرموت هايبر`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLinkToast(true);
    setTimeout(() => setCopiedLinkToast(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 transition-all duration-200 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-8 duration-300 relative ${isRtl ? 'text-right' : 'text-left'}`}
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast notification for link sharing */}
        {copiedLinkToast && (
          <div className="absolute top-4 inset-x-4 z-40 bg-gray-900/90 backdrop-blur-md text-white text-xs font-bold py-2.5 px-4 rounded-xl text-center shadow-lg animate-in fade-in">
            {isRtl ? 'تم نسخ رابط المنتج بنجاح!' : 'Product link copied successfully!'}
          </div>
        )}

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto flex-1 pb-4 scrollbar-none">
          {/* Top Product Display Card (matching screenshot with rounded corners, off-white background and floating action icons) */}
          <div className="relative bg-[#F7F7F8] rounded-[28px] m-4 p-4 min-h-[270px] sm:min-h-[300px] flex flex-col items-center justify-center border border-gray-100 shadow-inner overflow-hidden">
            {/* Top Bar Floating Controls inside image card */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
              {/* Left group: Close button */}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white text-gray-700 shadow-xs border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all cursor-pointer"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* Right group: Share and Cart bag buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white text-gray-700 shadow-xs border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all cursor-pointer"
                  title="مشاركة المنتج"
                >
                  <Share2 className="w-4 h-4 text-gray-600" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenCart?.();
                  }}
                  className="w-10 h-10 rounded-full bg-white text-gray-700 shadow-xs border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all cursor-pointer relative"
                  title="سلة المشتريات"
                >
                  <ShoppingBag className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Product Center Image */}
            <div className="my-auto py-6 flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain drop-shadow-md transform hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Product Title, Unit, Favorite Heart, & Description */}
          <div className="px-5 pt-1">
            <div className="flex items-start justify-between gap-3">
              {/* Name & Unit */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {getLocalizedProductName(product, language)}
                </h1>
                <p className="text-xs text-gray-400 font-bold mt-1">
                  {getLocalizedProductUnit(product, language)}
                </p>
              </div>

              {/* Heart Favorite Icon */}
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className="p-1.5 rounded-full hover:bg-gray-50 active:scale-90 transition-transform cursor-pointer"
                title={isFavorited ? (isRtl ? 'إزالة من المفضلة' : 'Remove from Favorites') : (isRtl ? 'إضافة إلى المفضلة' : 'Add to Favorites')}
              >
                <Heart 
                  className={`w-6 h-6 transition-colors ${
                    isFavorited 
                      ? 'text-rose-500 fill-rose-500' 
                      : 'text-gray-300 fill-gray-200 hover:text-gray-400'
                  }`} 
                />
              </button>
            </div>

            {/* Product Description */}
            <p className="text-xs text-gray-500 leading-relaxed mt-2.5 font-normal">
              {getLocalizedProductDescription(product, language)}
            </p>
          </div>

          {/* "يشترى معه" (Frequently Bought Together) Section */}
          <div className="mx-4 mt-5 p-3.5 bg-[#FFFDF5] rounded-2xl border border-amber-100/80">
            <h2 className="text-xs font-black text-gray-900 mb-2.5">
              {t('frequentlyBoughtTogether', language)}
            </h2>

            {/* Horizontal Scroll of companion products */}
            <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {companionProducts.map((comp) => {
                const isAdded = addedCompanionIds.includes(comp.id);
                return (
                  <div
                    key={comp.id}
                    onClick={() => onOpenProduct(comp)}
                    className="min-w-[105px] max-w-[115px] flex-shrink-0 flex flex-col group cursor-pointer"
                  >
                    {/* Image Card with corner + button */}
                    <div className="relative bg-white rounded-2xl p-2 border border-gray-100 shadow-xs flex items-center justify-center h-28 overflow-hidden">
                      <img
                        src={comp.image}
                        alt={comp.name}
                        className="w-20 h-20 object-contain group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />

                      {/* Corner Square + Button */}
                      <button
                        onClick={(e) => handleAddCompanion(comp, e)}
                        className={`absolute bottom-1.5 left-1.5 w-6 h-6 rounded-md border flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-[#0A7D8C] text-[#0A7D8C] hover:bg-[#0A7D8C]/10'
                        }`}
                        title="إضافة سريعة"
                      >
                        {isAdded ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        )}
                      </button>
                    </div>

                    {/* Companion Name */}
                    <p className="text-[11px] font-bold text-gray-800 line-clamp-1 mt-1.5">
                      {getLocalizedProductName(comp, language)}
                    </p>

                    {/* Unit */}
                    <p className="text-[10px] text-gray-400 font-semibold">
                      {getLocalizedProductUnit(comp, language)}
                    </p>

                    {/* Optional Badge (like 'العدد 2') */}
                    {comp.badge && (
                      <span className="self-start mt-0.5 bg-[#FF7A1A] text-white text-[9px] font-black px-1.5 py-0.2 rounded shadow-xs">
                        {isRtl ? comp.badge : (comp.badgeEn || comp.badge)}
                      </span>
                    )}

                    {/* Price and Crossed-out price */}
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-xs font-black text-[#E11D48] font-mono">
                        {comp.price.toFixed(2).replace('.', ',')} ﷼
                      </span>
                      {comp.originalPrice && (
                        <span className="text-[10px] text-gray-400 line-through font-mono">
                          {comp.originalPrice.toFixed(0)} ﷼
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar (matching screenshot with orange quantity badge, red price, and teal add to cart button) */}
        <div className="sticky bottom-0 inset-x-0 bg-white border-t border-gray-100 px-5 py-3.5 flex items-center justify-between gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-30">
          {/* Price & Quantity Section */}
          <div className="flex flex-col items-start">
            {/* Interactive Orange Quantity Badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#FF7A1A] text-white px-2 py-0.5 rounded-lg text-xs font-black mb-1 shadow-xs select-none">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="hover:opacity-80 active:scale-90 px-0.5 cursor-pointer text-xs font-black"
                title={isRtl ? 'تقليل الكمية' : 'Decrease'}
              >
                -
              </button>
              <span>{isRtl ? `العدد ${quantity}` : `Qty: ${quantity}`}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="hover:opacity-80 active:scale-90 px-0.5 cursor-pointer text-xs font-black"
                title={isRtl ? 'زيادة الكمية' : 'Increase'}
              >
                +
              </button>
            </div>

            {/* Bold Red Price Display */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#E11D48] font-mono leading-none tracking-tight">
                {formatPrice(totalPrice, product.currency, language)}
              </span>
              {originalTotalPrice && (
                <span className="text-xs text-gray-400 line-through font-semibold font-mono">
                  {formatPrice(originalTotalPrice, product.currency, language)}
                </span>
              )}
            </div>
          </div>

          {/* Large Teal / Cyan Add to Cart Button */}
          <button
            onClick={handleAddMain}
            className={`flex-1 max-w-[200px] sm:max-w-[220px] py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer ${
              addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-[#0A7D8C] hover:bg-[#086874] text-white shadow-teal-900/20'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{isRtl ? 'تمت الإضافة!' : 'Added!'}</span>
              </>
            ) : (
              <>
                <span>{t('addToCart', language)}</span>
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
