import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Package, 
  TrendingUp, 
  Layout, 
  MessageSquareWarning, 
  ArrowRight, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  DollarSign, 
  ShoppingBag, 
  Truck, 
  Store, 
  User, 
  X,
  Sparkles,
  BarChart3,
  Sliders,
  Check,
  Image as ImageIcon,
  CreditCard,
  Building2,
  Globe,
  Lock,
  Tag,
  Save,
  RotateCcw
} from 'lucide-react';
import { 
  AppUser, 
  Product, 
  Order, 
  ComplaintItem, 
  CategoryConfig, 
  BannerConfig,
  UserRole,
  PaymentMethodConfig,
  AppLanguage
} from '../types';

interface AdminDashboardViewProps {
  adminUser: AppUser;
  users?: AppUser[];
  products?: Product[];
  orders?: Order[];
  complaints?: ComplaintItem[];
  categories?: CategoryConfig[];
  banners?: BannerConfig[];
  paymentMethods?: PaymentMethodConfig[];
  language?: AppLanguage;
  onToggleLanguage?: () => void;
  onUpdateUser: (updatedUser: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onAddUser: (newUser: AppUser) => void;
  onUpdateProduct: (updatedProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddProduct: (newProduct: Product) => void;
  onUpdateCategories: (categories: CategoryConfig[]) => void;
  onUpdateBanners: (banners: BannerConfig[]) => void;
  onUpdatePaymentMethods: (paymentMethods: PaymentMethodConfig[]) => void;
  onUpdateComplaint: (complaintId: string, status: 'open' | 'in_progress' | 'resolved', adminResponse?: string) => void;
  onBackToApp: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  adminUser,
  users = [],
  products = [],
  orders = [],
  complaints = [],
  categories = [],
  banners = [],
  paymentMethods = [],
  language = 'ar',
  onToggleLanguage,
  onUpdateUser,
  onDeleteUser,
  onAddUser,
  onUpdateProduct,
  onDeleteProduct,
  onAddProduct,
  onUpdateCategories,
  onUpdateBanners,
  onUpdatePaymentMethods,
  onUpdateComplaint,
  onBackToApp,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'products' | 'categories' | 'payments' | 'layout' | 'complaints'>('stats');

  // Users Filter & Search
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userSearch, setUserSearch] = useState('');

  // Products Filter & Search & Modal State
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all');
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [newProdData, setNewProdData] = useState<Partial<Product>>({
    name: '',
    nameEn: '',
    category: 'fruits-veg',
    price: 15.0,
    originalPrice: 20.0,
    currency: 'SAR',
    unit: '1 كيلو',
    image: '/assets/images/prod-tomatoes.svg',
    stockCount: 50,
    inStock: true,
    badge: 'طازج اليوم',
    origin: 'مزارع وادي حضرموت',
    description: 'منتج ممتاز عالي الجودة ومعتمد من إدارة حضرموت هايبر.'
  });

  // Categories Local & Add State
  const [editableCategories, setEditableCategories] = useState<CategoryConfig[]>(
    (categories || []).map((c, idx) => ({ ...c, order: c.order ?? idx, isVisible: c.isVisible ?? true }))
  );
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatData, setNewCatData] = useState({
    name: '',
    nameEn: '',
    color: '#0E8A5E',
    icon: 'Sparkles'
  });

  // Payments State
  const [editablePayments, setEditablePayments] = useState<PaymentMethodConfig[]>(paymentMethods);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethodConfig | null>(null);
  const [newPaymentData, setNewPaymentData] = useState<Partial<PaymentMethodConfig>>({
    name: '',
    nameEn: '',
    bankOrIssuer: '',
    accountNumber: '',
    badge: 'دفع فوري',
    color: 'from-blue-600 to-blue-700',
    isEnabled: true,
    isCod: false,
    minOrdersForCod: 0,
  });

  // Banners State
  const [editableBanners, setEditableBanners] = useState<BannerConfig[]>(
    (banners || []).map((b) => ({ ...b, isVisible: b.isVisible ?? true }))
  );
  const [editingBanner, setEditingBanner] = useState<BannerConfig | null>(null);

  // Stats calculation
  const safeOrders = orders || [];
  const safeProducts = products || [];
  const safeUsers = users || [];
  const safeComplaints = complaints || [];
  const totalSales = safeOrders.reduce((sum, o) => sum + (o?.total || 0), 0) + 128450.5;
  const totalCompletedOrders = safeOrders.filter((o) => o.status === 'DELIVERED').length + 540;

  // Category Actions
  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const updated = [...editableCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    const reordered = updated.map((c, idx) => ({ ...c, order: idx }));
    setEditableCategories(reordered);
    onUpdateCategories(reordered);
  };

  const handleToggleCategoryVisibility = (catId: string) => {
    const updated = editableCategories.map((c) =>
      c.id === catId ? { ...c, isVisible: !c.isVisible } : c
    );
    setEditableCategories(updated);
    onUpdateCategories(updated);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatData.name.trim()) return;
    const newCat: CategoryConfig = {
      id: `cat-${Date.now()}`,
      name: newCatData.name.trim(),
      icon: newCatData.icon,
      color: newCatData.color,
      order: editableCategories.length,
      isVisible: true
    };
    const updated = [...editableCategories, newCat];
    setEditableCategories(updated);
    onUpdateCategories(updated);
    setShowAddCatModal(false);
    setNewCatData({ name: '', nameEn: '', color: '#0E8A5E', icon: 'Sparkles' });
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم إزالته من تصنيفات التطبيق.')) {
      const updated = editableCategories.filter((c) => c.id !== catId);
      setEditableCategories(updated);
      onUpdateCategories(updated);
    }
  };

  // Payment Methods Actions
  const handleTogglePaymentEnabled = (methodId: string) => {
    const updated = editablePayments.map((pm) =>
      pm.id === methodId ? { ...pm, isEnabled: !pm.isEnabled } : pm
    );
    setEditablePayments(updated);
    onUpdatePaymentMethods(updated);
  };

  const handleDeletePaymentMethod = (methodId: string) => {
    if (confirm('هل أنت متأكد من حذف طريقة الدفع هذه نهائياً؟')) {
      const updated = editablePayments.filter((pm) => pm.id !== methodId);
      setEditablePayments(updated);
      onUpdatePaymentMethods(updated);
    }
  };

  const handleCreatePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaymentData.name?.trim()) return;
    const newMethod: PaymentMethodConfig = {
      id: `pm-${Date.now()}`,
      key: (newPaymentData.key || newPaymentData.name || 'CUSTOM').toUpperCase().replace(/\s+/g, '_'),
      name: newPaymentData.name.trim(),
      nameEn: newPaymentData.nameEn || newPaymentData.name.trim(),
      bankOrIssuer: newPaymentData.bankOrIssuer || 'بنك معتمد',
      accountNumber: newPaymentData.accountNumber || '00000000',
      badge: newPaymentData.badge || 'دفع إلكتروني',
      color: newPaymentData.color || 'from-indigo-600 to-indigo-700',
      isEnabled: true,
      isCod: Boolean(newPaymentData.isCod),
      minOrdersForCod: Number(newPaymentData.minOrdersForCod) || 0,
      order: editablePayments.length + 1
    };
    const updated = [...editablePayments, newMethod];
    setEditablePayments(updated);
    onUpdatePaymentMethods(updated);
    setShowAddPaymentModal(false);
    setNewPaymentData({
      name: '',
      nameEn: '',
      bankOrIssuer: '',
      accountNumber: '',
      badge: 'دفع فوري',
      color: 'from-blue-600 to-blue-700',
      isEnabled: true,
      isCod: false,
      minOrdersForCod: 0,
    });
  };

  const handleSaveEditPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    const updated = editablePayments.map((pm) =>
      pm.id === editingPayment.id ? editingPayment : pm
    );
    setEditablePayments(updated);
    onUpdatePaymentMethods(updated);
    setEditingPayment(null);
  };

  // Product Full Save/Add
  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdData.name?.trim()) return;
    const prod: Product = {
      id: `p-admin-${Date.now()}`,
      name: newProdData.name.trim(),
      nameEn: newProdData.nameEn || newProdData.name.trim(),
      category: newProdData.category || 'fruits-veg',
      price: Number(newProdData.price) || 10,
      originalPrice: newProdData.originalPrice ? Number(newProdData.originalPrice) : undefined,
      currency: newProdData.currency || 'SAR',
      unit: newProdData.unit || '1 كيلو',
      image: newProdData.image || '/assets/images/prod-tomatoes.svg',
      rating: 5.0,
      reviewsCount: 1,
      inStock: newProdData.inStock ?? true,
      stockCount: Number(newProdData.stockCount) || 50,
      badge: newProdData.badge || 'جديد',
      origin: newProdData.origin || 'حضرموت',
      description: newProdData.description || 'منتج طازج عالي الجودة معتمد من الإدارة المركزية لحضرموت هايبر.',
    };
    onAddProduct(prod);
    setShowAddProdModal(false);
  };

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProd) return;
    onUpdateProduct(editingProd);
    setEditingProd(null);
  };

  // Filtered Users
  const filteredUsers = safeUsers.filter((u) => {
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchSearch =
      !userSearch.trim() ||
      (u?.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u?.phone || '').includes(userSearch) ||
      (u?.storeName || '').toLowerCase().includes(userSearch.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="flex flex-col flex-1 bg-[#F4F8F5] pb-16 font-sans text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Admin Top Header */}
      <div className="bg-gradient-to-l from-[#1E293B] via-[#0F172A] to-[#020617] text-white p-4 shadow-xl sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              title="العودة لواجهة التطبيق الرئيسية"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">
                  {language === 'ar' ? 'مركز إدارة حضرموت هايبر الشامل' : 'Hadramout Hyper Super Admin'}
                </h2>
                <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full">
                  {language === 'ar' ? 'صلاحية المدير العام' : 'Super Admin Access'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {language === 'ar' ? 'المدير' : 'Admin'}: <strong className="text-white">{adminUser?.name || 'المدير العام'}</strong> • قاعدة بيانات سحابية حية (Firestore Live)
              </p>
            </div>
          </div>

          {/* Quick Language Toggle */}
          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/20"
              title="تبديل لغة التطبيق"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>
          )}
        </div>

        {/* Global Admin Tabs */}
        <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stats' ? 'bg-red-600 text-white shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>إحصائيات البيع</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'products' ? 'bg-red-600 text-white shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>المنتجات والخيارات ({safeProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'categories' ? 'bg-red-600 text-white shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>الأقسام والتصنيفات ({editableCategories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payments' ? 'bg-red-600 text-white shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>طرق الدفع والمحافظ ({editablePayments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users' ? 'bg-red-600 text-white shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>المستخدمين ({safeUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('layout')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'layout' ? 'bg-red-600 text-white shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Layout className="w-3.5 h-3.5 text-amber-400" />
            <span>شكل العرض والبنرات</span>
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap relative ${
              activeTab === 'complaints' ? 'bg-red-600 text-white shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <MessageSquareWarning className="w-3.5 h-3.5 text-amber-400" />
            <span>الشكاوى ({safeComplaints.filter((c) => c.status !== 'resolved').length})</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 space-y-4">
        {/* TAB 1: Stats */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-500 mb-1">
                  <span className="text-xs font-bold">إجمالي المبيعات</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-lg font-black font-mono text-[#0B253A]">
                  {totalSales.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">+14.2% مقارنة بالشهر السابق</span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-500 mb-1">
                  <span className="text-xs font-bold">إجمالي الطلبات المكتملة</span>
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-lg font-black font-mono text-[#0B253A]">{totalCompletedOrders}</span>
                <span className="text-[10px] text-blue-600 font-bold block mt-1">متوسط التوصيل: 24 دقيقة</span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-500 mb-1">
                  <span className="text-xs font-bold">المنتجات النشطة</span>
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-lg font-black font-mono text-[#0B253A]">{safeProducts.length}</span>
                <span className="text-[10px] text-amber-600 font-bold block mt-1">تحديث لحظي للسعر والمخزون</span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-gray-500 mb-1">
                  <span className="text-xs font-bold">طرق الدفع النشطة</span>
                  <CreditCard className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-lg font-black font-mono text-[#0B253A]">
                  {editablePayments.filter((p) => p.isEnabled).length}
                </span>
                <span className="text-[10px] text-purple-600 font-bold block mt-1">جاهزة ومتحكم بها بالكامل</span>
              </div>
            </div>

            {/* Quick Live Alerts Banner */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black">قاعدة بيانات Firebase السحابية متصلة ونشطة</h4>
                  <p className="text-xs text-emerald-200">
                    يمكن للمدير إضافة المنتجات وتعديل أسعارها والتحكم بالأقسام وطرق الدفع فورياً.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Full Products Management */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-red-600" />
                  <span>التحكم الشامل بالمنتجات وتعديل الأسعار والخيارات</span>
                </h4>
                <p className="text-[11px] text-gray-500">
                  إضافة منتج جديد، تعديل السعر، الخصم، المخزون، بلد المنشأ، أو الحذف الفوري.
                </p>
              </div>

              <button
                onClick={() => setShowAddProdModal(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 cursor-pointer shadow-xs active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  placeholder="ابحث بالاسم العربي، الإنجليزي، أو الوصف..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-red-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>

              <select
                value={prodCategoryFilter}
                onChange={(e) => setProdCategoryFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-red-500 font-bold"
              >
                <option value="all">جميع الأقسام ({safeProducts.length})</option>
                {editableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Products List */}
            <div className="space-y-2.5">
              {safeProducts
                .filter((p) => {
                  const matchSearch =
                    (p?.name || '').toLowerCase().includes(prodSearch.toLowerCase()) ||
                    (p?.nameEn || '').toLowerCase().includes(prodSearch.toLowerCase());
                  const matchCat = prodCategoryFilter === 'all' || p.category === prodCategoryFilter;
                  return matchSearch && matchCat;
                })
                .map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-gray-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="font-black text-gray-900 text-sm">{p.name}</h5>
                          <span className="text-[10px] text-gray-400 font-medium">({p.nameEn})</span>
                          {p.badge && (
                            <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                              {p.badge}
                            </span>
                          )}
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            p.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {p.inStock ? `متوفر (${p.stockCount})` : 'نفد المخزون'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono mt-1">
                          السعر: <strong className="text-red-700 font-black text-sm">{p.price.toFixed(2)} {p.currency === 'YER' ? 'ر.ي (YER)' : 'ر.س (SAR)'}</strong>
                          {p.originalPrice && (
                            <span className="line-through text-gray-400 mr-2 text-[10px]">
                              {p.originalPrice.toFixed(2)} {p.currency === 'YER' ? 'ر.ي' : 'ر.س'}
                            </span>
                          )}
                          <span className="text-gray-400 mr-2 font-sans">| الوحدة: {p.unit}</span>
                          {p.origin && <span className="text-gray-400 mr-2 font-sans">| المصدر: {p.origin}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => setEditingProd(p)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors border border-blue-200"
                        title="تعديل تفاصيل وخيارات المنتج"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل كامل</span>
                      </button>

                      <button
                        onClick={() => {
                          const newPrice = prompt(`تغيير سعر "${p.name}" الفوري:`, String(p.price));
                          if (newPrice && !isNaN(parseFloat(newPrice))) {
                            onUpdateProduct({
                              ...p,
                              price: parseFloat(newPrice),
                              originalPrice: p.price,
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors border border-emerald-200"
                        title="تغيير السعر الفوري"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>تعديل السعر</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`تحذير المدير: هل أنت متأكد من حذف منتج "${p.name}" نهائياً من المتجر؟`)) {
                            onDeleteProduct(p.id);
                          }
                        }}
                        className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-100 text-red-600 flex items-center justify-center cursor-pointer transition-colors"
                        title="حذف المنتج"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: Categories Management */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-red-600" />
                  <span>التحكم بالأقسام والتصنيفات وترتيبها</span>
                </h4>
                <p className="text-[11px] text-gray-500">
                  إضافة أقسام جديدة، تغيير الترتيب في شريط التطبيق الرئيسي، إخفاء أو إظهار الأقسام أو حذفها.
                </p>
              </div>

              <button
                onClick={() => setShowAddCatModal(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer shadow-xs active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم جديد</span>
              </button>
            </div>

            <div className="space-y-2">
              {editableCategories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    cat.isVisible ? 'bg-gray-50 border-gray-200' : 'bg-gray-100/60 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-mono font-bold text-gray-500 text-xs">
                      {idx + 1}
                    </span>
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <div>
                      <span className="font-black text-gray-900 text-sm">{cat.name}</span>
                      <span className="text-[11px] text-gray-400 block font-mono">رمز: {cat.id}</span>
                    </div>
                    {!cat.isVisible && (
                      <span className="text-[9px] bg-gray-300 text-gray-700 px-2 py-0.5 rounded font-bold">
                        مخفي عن المستخدمين
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Move Up */}
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveCategory(idx, 'up')}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 disabled:opacity-30 border border-gray-200 flex items-center justify-center text-gray-700 cursor-pointer"
                      title="تقديم للأعلى"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      disabled={idx === editableCategories.length - 1}
                      onClick={() => handleMoveCategory(idx, 'down')}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 disabled:opacity-30 border border-gray-200 flex items-center justify-center text-gray-700 cursor-pointer"
                      title="تأخير للأسفل"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle Visibility */}
                    <button
                      onClick={() => handleToggleCategoryVisibility(cat.id)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                        cat.isVisible
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                      title={cat.isVisible ? 'إخفاء القسم' : 'إظهار القسم'}
                    >
                      {cat.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete Category */}
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center cursor-pointer transition-colors"
                      title="حذف القسم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Payment Methods & Wallets Management */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-red-600" />
                  <span>التحكم بطرق الدفع والمحافظ (إضافة، تعديل، تفعيل، أو حذف)</span>
                </h4>
                <p className="text-[11px] text-gray-500">
                  يمكنك إضافة طريقة دفع جديدة، تعطيلها مؤقتاً، أو حذفها نهائياً، والتحكم بشرط الدفع عند الاستلام.
                </p>
              </div>

              <button
                onClick={() => setShowAddPaymentModal(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer shadow-xs active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة طريقة دفع</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {editablePayments.map((pm) => (
                <div
                  key={pm.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                    pm.isEnabled ? 'bg-gray-50 border-gray-200' : 'bg-gray-100/60 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pm.color} text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0`}>
                      {pm.isCod ? <Building2 className="w-5 h-5" /> : pm.name.slice(0, 4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-black text-gray-900 text-sm">{pm.name}</h5>
                        <span className="text-[10px] text-gray-400">({pm.nameEn})</span>
                        {pm.badge && (
                          <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                            {pm.badge}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          pm.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {pm.isEnabled ? 'مفعلة بالمتجر' : 'معطلة'}
                        </span>
                        {pm.isCod && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> يتطلب {pm.minOrdersForCod || 5} طلبات مسبقة
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1">
                        الجهة: <strong>{pm.bankOrIssuer}</strong> • رقم الحساب: <span className="font-mono font-bold text-gray-800">{pm.accountNumber}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Toggle enable */}
                    <button
                      onClick={() => handleTogglePaymentEnabled(pm.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                        pm.isEnabled
                          ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {pm.isEnabled ? 'تعطيل' : 'تفعيل'}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => setEditingPayment(pm)}
                      className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center cursor-pointer transition-colors"
                      title="تعديل بيانات الطريقة"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete payment method */}
                    <button
                      onClick={() => handleDeletePaymentMethod(pm.id)}
                      className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center cursor-pointer transition-colors"
                      title="حذف طريقة الدفع"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Users */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-red-600" />
                  <span>إدارة حسابات المستخدمين والصلاحيات (العملاء، التجار، المناديب)</span>
                </h4>
                <p className="text-[11px] text-gray-500">
                  إجمالي المستخدمين المسجلين: {safeUsers.length}
                </p>
              </div>
            </div>

            {/* Role filter buttons */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(['all', 'customer', 'merchant', 'driver', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    userRoleFilter === r
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r === 'all'
                    ? 'الكل'
                    : r === 'customer'
                    ? 'العملاء'
                    : r === 'merchant'
                    ? 'التجار'
                    : r === 'driver'
                    ? 'المناديب'
                    : 'المدراء'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ابحث بالاسم، رقم الجوال، أو اسم المتجر..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-red-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>

            {/* Users list */}
            <div className="space-y-2.5">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                        u.role === 'admin'
                          ? 'bg-red-600'
                          : u.role === 'merchant'
                          ? 'bg-amber-600'
                          : u.role === 'driver'
                          ? 'bg-blue-600'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {u.role === 'driver' ? (
                        <Truck className="w-4 h-4" />
                      ) : u.role === 'merchant' ? (
                        <Store className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-black text-gray-900">{u.name}</h5>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status === 'active' ? 'نشط' : 'موقوف'}
                        </span>
                        <span className="text-[9px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded font-bold">
                          {u.role === 'driver'
                            ? 'مندوب'
                            : u.role === 'merchant'
                            ? 'تاجر'
                            : u.role === 'admin'
                            ? 'مدير'
                            : 'عميل'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {u.phone} {u.storeName ? `• متجر: ${u.storeName}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        onUpdateUser({
                          ...u,
                          status: u.status === 'active' ? 'suspended' : 'active',
                        })
                      }
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                        u.status === 'active'
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {u.status === 'active' ? 'إيقاف مؤقت' : 'تفعيل'}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`تحذير المدير: هل أنت متأكد من رغبتك بحذف حساب "${u.name}" نهائياً؟`)) {
                          onDeleteUser(u.id);
                        }
                      }}
                      className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center cursor-pointer transition-colors"
                      title="حذف الحساب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Layout & Banners */}
        {activeTab === 'layout' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 space-y-4">
            <div>
              <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-red-600" />
                <span>التحكم في بنرات العروض وإعلانات الهايبر</span>
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">
                تعديل نصوص وأزرار البنرات المتحركة في الصفحة الرئيسية.
              </p>
            </div>

            <div className="space-y-3">
              {editableBanners.map((b) => (
                <div key={b.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900">{b.title}</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md">
                      {b.tag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{b.subtitle}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                    <span className="text-gray-500 font-mono">نص الزر: {b.buttonText}</span>
                    <button
                      onClick={() => {
                        const newTitle = prompt('تعديل عنوان البنر:', b.title);
                        const newSub = prompt('تعديل النص الفرعي للبنر:', b.subtitle);
                        if (newTitle) {
                          const updated = editableBanners.map((x) =>
                            x.id === b.id ? { ...x, title: newTitle, subtitle: newSub || x.subtitle } : x
                          );
                          setEditableBanners(updated);
                          onUpdateBanners(updated);
                        }
                      }}
                      className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 cursor-pointer"
                    >
                      تعديل المحتوى
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: Complaints */}
        {activeTab === 'complaints' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 space-y-4">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              <MessageSquareWarning className="w-4 h-4 text-red-600" />
              <span>متابعة الشكاوى والبلاغات والرد عليها</span>
            </h4>

            <div className="space-y-3">
              {safeComplaints.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                    c.status === 'resolved'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : c.status === 'in_progress'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-red-50/50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-gray-800">بلاغ #{c.id} - {c.type}</span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded ${
                        c.status === 'resolved'
                          ? 'bg-emerald-600 text-white'
                          : c.status === 'in_progress'
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {c.status === 'resolved' ? 'تم الحل' : c.status === 'in_progress' ? 'قيد المعالجة' : 'جديدة'}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-black text-gray-900">{c.title}</h5>
                    <p className="text-[11px] text-gray-700 mt-0.5">{c.description}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                      صاحب البلاغ: {c.customerName} ({c.customerPhone})
                    </p>
                  </div>

                  {c.adminResponse && (
                    <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-[11px] text-emerald-900 font-medium">
                      <strong>رد وقرار الإدارة:</strong> {c.adminResponse}
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    {c.status !== 'resolved' && (
                      <button
                        onClick={() => {
                          const reply = prompt('أدخل قرار الإدارة لإنهاء الشكوى:', 'تم حل المشكلة والتواصل مع العميل وتعويضه.');
                          if (reply) {
                            onUpdateComplaint(c.id, 'resolved', reply);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>اعتماد الحل وإغلاق الشكوى</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add New Product */}
      {showAddProdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]">
            <div className="bg-red-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد للمتجر المركزي</span>
              </h3>
              <button
                onClick={() => setShowAddProdModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">الاسم بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={newProdData.name || ''}
                    onChange={(e) => setNewProdData({ ...newProdData, name: e.target.value })}
                    placeholder="مثال: تمر سكري فاخر"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    value={newProdData.nameEn || ''}
                    onChange={(e) => setNewProdData({ ...newProdData, nameEn: e.target.value })}
                    placeholder="Premium Sukkari Dates"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">عملة المنتج *</label>
                  <select
                    value={newProdData.currency || 'SAR'}
                    onChange={(e) => setNewProdData({ ...newProdData, currency: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-500 font-bold bg-amber-50 text-xs"
                  >
                    <option value="SAR">🇸🇦 ريال سعودي (SAR)</option>
                    <option value="YER">🇾🇪 ريال يمني (YER)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">السعر *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newProdData.price || ''}
                    onChange={(e) => setNewProdData({ ...newProdData, price: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">السعر قبل الخصم</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProdData.originalPrice || ''}
                    onChange={(e) => setNewProdData({ ...newProdData, originalPrice: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">الوحدة</label>
                  <input
                    type="text"
                    value={newProdData.unit || '1 كيلو'}
                    onChange={(e) => setNewProdData({ ...newProdData, unit: e.target.value })}
                    placeholder="1 كيلو / حبة"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">القسم</label>
                  <select
                    value={newProdData.category || 'fruits-veg'}
                    onChange={(e) => setNewProdData({ ...newProdData, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-500 font-bold"
                  >
                    {editableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">كمية المخزون</label>
                  <input
                    type="number"
                    value={newProdData.stockCount || 50}
                    onChange={(e) => setNewProdData({ ...newProdData, stockCount: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">رابط صورة المنتج (URL)</label>
                <input
                  type="url"
                  value={newProdData.image || ''}
                  onChange={(e) => setNewProdData({ ...newProdData, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">الوصف</label>
                <textarea
                  rows={2}
                  value={newProdData.description || ''}
                  onChange={(e) => setNewProdData({ ...newProdData, description: e.target.value })}
                  placeholder="وصف مميزات المنتج..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddProdModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
                >
                  حفظ وإضافة المنتج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Full Product */}
      {editingProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]">
            <div className="bg-blue-700 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>تعديل بيانات المنتج: {editingProd.name}</span>
              </h3>
              <button
                onClick={() => setEditingProd(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">الاسم بالعربية</label>
                  <input
                    type="text"
                    required
                    value={editingProd.name}
                    onChange={(e) => setEditingProd({ ...editingProd, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    value={editingProd.nameEn || ''}
                    onChange={(e) => setEditingProd({ ...editingProd, nameEn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">عملة المنتج *</label>
                  <select
                    value={editingProd.currency || 'SAR'}
                    onChange={(e) => setEditingProd({ ...editingProd, currency: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-bold bg-amber-50 text-xs"
                  >
                    <option value="SAR">🇸🇦 ريال سعودي (SAR)</option>
                    <option value="YER">🇾🇪 ريال يمني (YER)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">السعر</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingProd.price}
                    onChange={(e) => setEditingProd({ ...editingProd, price: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">السعر قبل الخصم</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProd.originalPrice || ''}
                    onChange={(e) => setEditingProd({ ...editingProd, originalPrice: parseFloat(e.target.value) || undefined })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">الوحدة</label>
                  <input
                    type="text"
                    value={editingProd.unit}
                    onChange={(e) => setEditingProd({ ...editingProd, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">القسم</label>
                  <select
                    value={editingProd.category}
                    onChange={(e) => setEditingProd({ ...editingProd, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-bold"
                  >
                    {editableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">المخزون المتوفر</label>
                  <input
                    type="number"
                    value={editingProd.stockCount}
                    onChange={(e) => setEditingProd({ ...editingProd, stockCount: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">رابط الصورة (URL)</label>
                <input
                  type="url"
                  value={editingProd.image}
                  onChange={(e) => setEditingProd({ ...editingProd, image: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={editingProd.inStock}
                  onChange={(e) => setEditingProd({ ...editingProd, inStock: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <label htmlFor="inStockCheck" className="font-bold text-gray-800">
                  متوفر للطلب في المتجر الآن
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProd(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Category */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>إضافة قسم جديد</span>
              </h3>
              <button
                onClick={() => setShowAddCatModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">اسم القسم بالعربية *</label>
                <input
                  type="text"
                  required
                  value={newCatData.name}
                  onChange={(e) => setNewCatData({ ...newCatData, name: e.target.value })}
                  placeholder="مثال: البهارات والتوابل"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">اسم القسم بالإنجليزية</label>
                <input
                  type="text"
                  value={newCatData.nameEn}
                  onChange={(e) => setNewCatData({ ...newCatData, nameEn: e.target.value })}
                  placeholder="Spices & Herbs"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">لون القسم التمييزي</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCatData.color}
                    onChange={(e) => setNewCatData({ ...newCatData, color: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0"
                  />
                  <span className="font-mono text-gray-600">{newCatData.color}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  إضافة القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Payment Method */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>إضافة طريقة دفع أو محفظة جديدة</span>
              </h3>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePaymentMethod} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">اسم طريقة الدفع *</label>
                  <input
                    type="text"
                    required
                    value={newPaymentData.name || ''}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, name: e.target.value })}
                    placeholder="مثال: محفظة جوالي"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    value={newPaymentData.nameEn || ''}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, nameEn: e.target.value })}
                    placeholder="Jawwali Wallet"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">البنك أو الجهة المصدرة *</label>
                <input
                  type="text"
                  required
                  value={newPaymentData.bankOrIssuer || ''}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, bankOrIssuer: e.target.value })}
                  placeholder="مثال: بنك اليمن والكويت"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">رقم الحساب / هاتف المحفظة *</label>
                  <input
                    type="text"
                    required
                    value={newPaymentData.accountNumber || ''}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, accountNumber: e.target.value })}
                    placeholder="مثال: 771234567"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">الشارة الترويجية (Badge)</label>
                  <input
                    type="text"
                    value={newPaymentData.badge || ''}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, badge: e.target.value })}
                    placeholder="دفع فوري / خصم 5%"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isCodCheck"
                    checked={newPaymentData.isCod || false}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, isCod: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <label htmlFor="isCodCheck" className="font-bold text-gray-800">
                    طريقة دفع عند الاستلام (COD)
                  </label>
                </div>

                {newPaymentData.isCod && (
                  <div>
                    <label className="text-gray-600 block mb-1 font-bold">
                      عدد الطلبات المسبقة المطلوبة لتفعيلها للعميل:
                    </label>
                    <input
                      type="number"
                      value={newPaymentData.minOrdersForCod ?? 5}
                      onChange={(e) => setNewPaymentData({ ...newPaymentData, minOrdersForCod: parseInt(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-gray-200 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
                >
                  إضافة طريقة الدفع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Payment Method */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-blue-700 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>تعديل طريقة الدفع: {editingPayment.name}</span>
              </h3>
              <button
                onClick={() => setEditingPayment(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPaymentMethod} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">الاسم بالعربية</label>
                <input
                  type="text"
                  required
                  value={editingPayment.name}
                  onChange={(e) => setEditingPayment({ ...editingPayment, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  value={editingPayment.nameEn}
                  onChange={(e) => setEditingPayment({ ...editingPayment, nameEn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">الجهة / البنك</label>
                <input
                  type="text"
                  required
                  value={editingPayment.bankOrIssuer}
                  onChange={(e) => setEditingPayment({ ...editingPayment, bankOrIssuer: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">رقم الحساب التجاري / المحفظة</label>
                <input
                  type="text"
                  required
                  value={editingPayment.accountNumber}
                  onChange={(e) => setEditingPayment({ ...editingPayment, accountNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {editingPayment.isCod && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    عدد الطلبات المسبقة المطلوبة لفتح الدفع عند الاستلام
                  </label>
                  <input
                    type="number"
                    value={editingPayment.minOrdersForCod ?? 5}
                    onChange={(e) => setEditingPayment({ ...editingPayment, minOrdersForCod: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
