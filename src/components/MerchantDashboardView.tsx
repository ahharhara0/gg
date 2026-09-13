import React, { useState } from 'react';
import { 
  Store, 
  Plus, 
  Edit3, 
  Trash2, 
  Lock, 
  CheckCircle2, 
  Package, 
  DollarSign, 
  ArrowRight, 
  Tag, 
  Search, 
  AlertTriangle,
  Sparkles,
  X,
  TrendingUp,
  Boxes,
  ShieldAlert
} from 'lucide-react';
import { AppUser, Product, ProductCurrency, AppLanguage } from '../types';
import { CATEGORIES } from '../data/initialCatalog';
import { t, formatPrice } from '../lib/translations';
import { PendingApprovalView } from './PendingApprovalView';

interface MerchantDashboardViewProps {
  merchant: AppUser;
  products?: Product[];
  allProducts?: Product[];
  language?: AppLanguage;
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct: (updatedProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onBackToApp: () => void;
}

export const MerchantDashboardView: React.FC<MerchantDashboardViewProps> = ({
  merchant,
  products,
  allProducts,
  language = 'ar',
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBackToApp,
}) => {
  const isRtl = language === 'ar';
  const [activeTab, setActiveTab] = useState<'my_products' | 'all_catalog' | 'sales'>('my_products');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  // Safe product list
  const effectiveProducts = products || allProducts || [];

  // Filter products added by this merchant vs others
  const myProducts = effectiveProducts.filter(
    (p) => p.merchantId === merchant?.id || (!p.merchantId && merchant?.role === 'admin')
  );

  // Form State for Adding / Editing Product
  const [formData, setFormData] = useState<{
    name: string;
    nameEn: string;
    category: string;
    price: string;
    originalPrice: string;
    currency: ProductCurrency;
    unit: string;
    stockCount: string;
    image: string;
    badge: string;
    origin: string;
    description: string;
  }>({
    name: '',
    nameEn: '',
    category: 'hadramout-specials',
    price: '',
    originalPrice: '',
    currency: 'SAR',
    unit: 'حبة',
    stockCount: '25',
    image: '/assets/images/prod-sidr-honey.svg',
    badge: 'طازج وجديد',
    origin: 'حضرموت',
    description: '',
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      nameEn: '',
      category: 'hadramout-specials',
      price: '',
      originalPrice: '',
      currency: 'SAR',
      unit: 'حبة',
      stockCount: '25',
      image: '/assets/images/prod-sidr-honey.svg',
      badge: 'إضافة جديدة',
      origin: 'محلي',
      description: '',
    });
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    // Permission Enforcement Rule:
    // "والصلاحية فقط على الشي الي يضيفة ولايحقله يغير شي ليس هو من اضافة"
    if (product.merchantId !== merchant.id && merchant.role !== 'admin' && merchant.role !== 'developer') {
      setSecurityNotice(
        `تنبيه صلاحيات: لا يمكنك تعديل المنتج "${product.name}" لأنه منتج مركزي تابع للهايبر أو لتاجر آخر. يحق لك حصراً تعديل المنتجات التي أضفتها بنفسك.`
      );
      return;
    }

    setEditingProduct(product);
    setFormData({
      name: product.name,
      nameEn: product.nameEn,
      category: product.category,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      currency: product.currency || 'SAR',
      unit: product.unit,
      stockCount: String(product.stockCount),
      image: product.image,
      badge: product.badge || '',
      origin: product.origin || '',
      description: product.description,
    });
    setShowAddModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    if (editingProduct) {
      // Update
      const updated: Product = {
        ...editingProduct,
        name: formData.name,
        nameEn: formData.nameEn || formData.name,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        currency: formData.currency,
        unit: formData.unit,
        stockCount: parseInt(formData.stockCount, 10) || 10,
        inStock: (parseInt(formData.stockCount, 10) || 10) > 0,
        image: formData.image,
        badge: formData.badge,
        origin: formData.origin,
        description: formData.description,
      };
      onUpdateProduct(updated);
    } else {
      // Add new
      const newProd: Product = {
        id: `p-merchant-${Date.now()}`,
        name: formData.name,
        nameEn: formData.nameEn || formData.name,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        currency: formData.currency,
        unit: formData.unit,
        stockCount: parseInt(formData.stockCount, 10) || 10,
        inStock: true,
        rating: 5.0,
        reviewsCount: 1,
        image: formData.image,
        badge: formData.badge || 'منتج تاجر معتمد',
        origin: formData.origin || 'محلي',
        description: formData.description || 'منتج طازج عالي الجودة مقدم من المتجر المعتمد.',
        merchantId: merchant?.id || 'm1',
        merchantName: merchant?.storeName || merchant?.name || 'متجر معتمد',
      };
      onAddProduct(newProd);
    }

    setShowAddModal(false);
    setEditingProduct(null);
  };

  const displayedProducts = activeTab === 'my_products' ? myProducts : effectiveProducts;
  const filteredProducts = displayedProducts.filter((p) =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.nameEn || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isPending = merchant?.status === 'pending' && merchant?.role !== 'admin' && merchant?.role !== 'developer';

  if (isPending) {
    return (
      <PendingApprovalView
        currentUser={merchant}
        onBackToApp={onBackToApp}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-[#F4F8F5] pb-12 font-sans text-right">

      {/* Top Header */}
      <div className="bg-gradient-to-l from-[#78350F] via-[#92400E] to-[#B45309] text-white p-4 shadow-md sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              title="العودة للمتجر الرئيسي"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">لوحة تحكم المتجر والتاجر</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPending ? 'bg-amber-400 text-black' : 'bg-emerald-600 text-white'}`}>
                  {isPending ? 'بانتظار الاعتماد' : 'تاجر معتمد'}
                </span>
              </div>
              <p className="text-[11px] text-amber-100">
                المتجر: <strong className="text-white">{merchant?.storeName || merchant?.name || 'متجر معتمد'}</strong> • سجل: {merchant?.commercialId || '1010892341'}
              </p>
            </div>
          </div>

          {/* Add product action */}
          {!isPending && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج جديد</span>
            </button>
          )}
        </div>

        {/* Merchant Metrics */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/15 text-center">
          <div className="bg-white/10 p-2 rounded-2xl">
            <span className="text-[10px] text-amber-200 block">منتجاتي الخاصة</span>
            <span className="text-xs font-black text-white font-mono">{myProducts.length} منتج</span>
          </div>
          <div className="bg-white/10 p-2 rounded-2xl">
            <span className="text-[10px] text-amber-200 block">رصيد المبيعات</span>
            <span className="text-xs font-black text-amber-300 font-mono">{(merchant.merchantBalance || 4820.5).toFixed(2)} ر.س</span>
          </div>
          <div className="bg-white/10 p-2 rounded-2xl">
            <span className="text-[10px] text-amber-200 block">وحدات مباعة</span>
            <span className="text-xs font-black text-white font-mono">318 وحدة</span>
          </div>
          <div className="bg-white/10 p-2 rounded-2xl">
            <span className="text-[10px] text-amber-200 block">تقييم المتجر</span>
            <span className="text-xs font-black text-amber-300 font-mono">4.92 ★</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full p-4 space-y-4">
        {/* Strict Permission Banner */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">نظام حماية الصلاحيات للمتاجر:</span>
            <span className="text-[11px] text-amber-800">
              يحق لك تعديل الأسعار، المخزون، وتفاصيل المنتجات التي قمت أنت بإضافتها حصراً. المنتجات المركزية ومنتجات التجار الآخرين محمية ومقفلة برمز (🔒) ولا يمكن التعديل عليها.
            </span>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-xs">
          <button
            onClick={() => setActiveTab('my_products')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'my_products'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>منتجات متجري الخاصة ({myProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all_catalog')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'all_catalog'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>تصفح كافة منتجات الهايبر ({effectiveProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'sales'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>سجل الأرباح والمبيعات</span>
          </button>
        </div>

        {/* Products List View */}
        {activeTab !== 'sales' && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم عن منتج لتعديل سعره ومخزونه..."
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-amber-500 shadow-xs"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-2">
                <Package className="w-10 h-10 text-gray-300 mx-auto" />
                <h4 className="text-sm font-black text-gray-700">لا توجد منتجات مطابقة</h4>
                {activeTab === 'my_products' && (
                  <button
                    onClick={handleOpenAdd}
                    className="mt-2 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs"
                  >
                    أضف أول منتج لمتجرك الآن
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredProducts.map((p) => {
                  const isOwnedByMe = p.merchantId === merchant.id || merchant.role === 'admin' || merchant.role === 'developer';

                  return (
                    <div
                      key={p.id}
                      className={`bg-white p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isOwnedByMe
                          ? 'border-amber-200 hover:border-amber-400 shadow-xs'
                          : 'border-gray-200 opacity-80 bg-gray-50/70'
                      }`}
                    >
                      {/* Product details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-black text-gray-900 truncate">{p.name}</h4>
                            {isOwnedByMe ? (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">
                                منتجك الخاص ✓
                              </span>
                            ) : (
                              <span className="text-[9px] bg-gray-200 text-gray-700 font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5 text-gray-500" />
                                <span>محمي (مركز الهايبر)</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                            الوحدة: {p.unit} • المخزون: <strong className={p.stockCount < 5 ? 'text-red-500' : 'text-gray-700'}>{p.stockCount}</strong>
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-black text-xs text-amber-700">
                              {formatPrice(p.price, p.currency, language)}
                            </span>
                            {p.originalPrice && (
                              <span className="font-mono text-[10px] text-gray-400 line-through">
                                {formatPrice(p.originalPrice, p.currency, language)}
                              </span>
                            )}
                            <span className="text-[9px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold">
                              {p.currency === 'YER' ? (isRtl ? 'ريال يمني' : 'YER') : (isRtl ? 'ريال سعودي' : 'SAR')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isOwnedByMe ? (
                          <>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-amber-200"
                              title="تعديل السعر والمخزون"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل السعر</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف المنتج "${p.name}"؟`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center cursor-pointer transition-colors"
                              title="حذف المنتج من متجرك"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold flex items-center gap-1 cursor-not-allowed"
                            title="غير مصرح بالتعديل"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>غير مصرح</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Sales History */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>تقارير مبيعات متجر {merchant?.storeName || merchant?.name || 'المتجر'}</span>
            </h4>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-900 font-bold block">الرصيد القابل للتحويل للحساب البنكي:</span>
                <span className="text-xl font-black font-mono text-amber-900">
                  {(merchant.merchantBalance || 4820.5).toFixed(2)} ر.س
                </span>
              </div>
              <button
                onClick={() => alert('تم استلام طلب التحويل البنكي! سيتم إيداع المبلغ خلال 24 ساعة عبر نظام سداد/سريع.')}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-sm cursor-pointer"
              >
                طلب تحويل بنكي ⚡
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 block">آخر العمليات الشرائية على منتجاتك:</span>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">طلب #1092 - 2x عسل سدر دوعني</p>
                  <p className="text-[10px] text-gray-500 font-mono">2026-09-08 • مكتمل</p>
                </div>
                <span className="font-mono font-black text-emerald-600">+570.00 ر.س</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">طلب #2041 - 1x عسل سدر دوعني</p>
                  <p className="text-[10px] text-gray-500 font-mono">2026-09-09 • قيد التوصيل</p>
                </div>
                <span className="font-mono font-black text-emerald-600">+285.00 ر.س</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-200" />
                <h3 className="text-sm font-black">
                  {editingProduct ? `تعديل منتج: ${editingProduct.name}` : 'إضافة منتج جديد لمتجرك'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-3.5 text-xs text-right flex-1">
              <div>
                <label className="block font-bold text-gray-700 mb-1">اسم المنتج بالعربية *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: عسل سدر دوعني حضرمي درجة أولى"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">اسم المنتج بالإنجليزية</label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Hadramout Sidr Honey"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500 text-left font-sans"
                  dir="ltr"
                />
              </div>

              {/* Currency Selection - Required by user: "اريد الادمن ا التاجر يحدد عملة منتجاته والعملات المتوفره ريال يمني او ريال سعودي" */}
              <div className="bg-amber-50/70 border border-amber-300/80 rounded-2xl p-3 space-y-1.5">
                <label className="block font-black text-amber-950 text-xs">
                  {isRtl ? 'عملة تسعير المنتج (محدد من قبل التاجر) *' : 'Product Pricing Currency (Merchant-Selected) *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, currency: 'SAR' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.currency === 'SAR'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>🇸🇦</span>
                    <span>{isRtl ? 'ريال سعودي (SAR)' : 'Saudi Riyal (SAR)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, currency: 'YER' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.currency === 'YER'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>🇾🇪</span>
                    <span>{isRtl ? 'ريال يمني (YER)' : 'Yemeni Riyal (YER)'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {isRtl ? `سعر البيع الحالي (${formData.currency === 'YER' ? 'ر.ي' : 'ر.س'}) *` : `Current Price (${formData.currency}) *`}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder={formData.currency === 'YER' ? '4500' : '285.0'}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {isRtl ? 'السعر الأصلي قبل الخصم (اختياري)' : 'Original Price (Optional)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder={formData.currency === 'YER' ? '5500' : '340.0'}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">وحدة القياس</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none"
                  >
                    <option value="حبة">حبة</option>
                    <option value="كيلو جرام">كيلو جرام</option>
                    <option value="كرتون">كرتون</option>
                    <option value="ربطة">ربطة</option>
                    <option value="مرطبان">مرطبان</option>
                    <option value="كيس">كيس</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">الكمية المتوفرة بالمخزون</label>
                  <input
                    type="number"
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">تصنيف المنتج</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">رابط صورة المنتج (URL)</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-amber-500 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">وصف المنتج ومميزاته</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف تفصيلي لمصدر المنتج وفوائده وطريقة حفظه..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md cursor-pointer transition-all active:scale-98"
                >
                  {editingProduct ? 'حفظ التعديلات والتسعيرة الجديدة' : 'نشر المنتج في متجر حضرموت هايبر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security notice toast */}
      {securityNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] bg-red-900 text-white p-4 rounded-2xl shadow-2xl border border-red-500 flex items-start gap-3 animate-in slide-in-from-bottom-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-300">تنبيه تقييد الصلاحيات</p>
            <p className="text-[11px] text-gray-200 mt-0.5">{securityNotice}</p>
          </div>
          <button
            onClick={() => setSecurityNotice(null)}
            className="text-gray-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
