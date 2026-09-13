import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X, 
  Sparkles, 
  Layers, 
  Percent, 
  DollarSign,
  FolderTree,
  Tag,
  ArrowUpDown
} from 'lucide-react';
import { Product, CategoryConfig, AppUser } from '../../types';
import { auditLogger } from '../audit/auditLogger';

interface CatalogManagerProps {
  products: Product[];
  categories: CategoryConfig[];
  currentUser: AppUser;
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct: (updatedProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateCategories?: (categories: CategoryConfig[]) => void;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({
  products,
  categories,
  currentUser,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateCategories,
}) => {
  const [activeView, setActiveView] = useState<'products' | 'categories'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Category management state
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatForm, setNewCatForm] = useState({
    id: '',
    name: '',
    nameEn: '',
    icon: '🍎',
  });

  // New Product Form State
  const [newProd, setNewProd] = useState<Partial<Product>>({
    name: '',
    nameEn: '',
    category: categories[0]?.id || 'fruits-veg',
    price: 10,
    currency: 'SAR',
    unit: '1 كيلو',
    stockCount: 50,
    inStock: true,
    rating: 5.0,
    reviewsCount: 1,
    image: '/assets/images/prod-tomatoes.svg',
    description: '',
    badge: 'طازج'
  });

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === 'all' || p.category === selectedCat;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      !searchQuery ||
      p.name.toLowerCase().includes(q) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q));
    return matchesCat && matchesSearch;
  });

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    onUpdateProduct(editingProduct);
    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'PRODUCT_UPDATED',
      category: 'catalog',
      targetEntity: 'Product',
      targetId: editingProduct.id,
      details: {
        name: editingProduct.name,
        price: editingProduct.price,
        stockCount: editingProduct.stockCount
      },
      severity: 'info'
    });
    setEditingProduct(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) {
      alert('يرجى كتابة اسم المنتج وسعره');
      return;
    }

    const created: Product = {
      id: `p-${Date.now()}`,
      name: newProd.name,
      nameEn: newProd.nameEn || newProd.name,
      category: newProd.category || 'fruits-veg',
      price: Number(newProd.price),
      currency: newProd.currency || 'SAR',
      unit: newProd.unit || '1 حبة',
      stockCount: Number(newProd.stockCount) || 50,
      inStock: newProd.stockCount ? newProd.stockCount > 0 : true,
      rating: 5.0,
      reviewsCount: 0,
      image: newProd.image || '/assets/images/prod-tomatoes.svg',
      description: newProd.description || 'منتج طازج ومختار بعناية لعملاء حضرموت هايبر.',
      badge: newProd.badge || 'جديد'
    };

    onAddProduct(created);
    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'PRODUCT_CREATED',
      category: 'catalog',
      targetEntity: 'Product',
      targetId: created.id,
      details: { name: created.name, price: created.price, category: created.category },
      severity: 'info'
    });

    setIsAddModalOpen(false);
  };

  const handleDelete = async (productId: string, productName: string) => {
    const confirmed = confirm(`هل أنت متأكد من حذف المنتج [${productName}] نهائياً من الكتالوج؟`);
    if (!confirmed) return;

    onDeleteProduct(productId);
    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'PRODUCT_DELETED',
      category: 'catalog',
      targetEntity: 'Product',
      targetId: productId,
      details: { productName },
      severity: 'warning'
    });
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatForm.name || !onUpdateCategories) return;

    const catId = newCatForm.id.trim() || `cat-${Date.now()}`;
    const newCategory: CategoryConfig = {
      id: catId,
      name: newCatForm.name,
      nameEn: newCatForm.nameEn || newCatForm.name,
      icon: newCatForm.icon || '📦',
      color: 'emerald',
      order: categories.length + 1,
      isVisible: true,
    };

    onUpdateCategories([...categories, newCategory]);
    setIsAddCategoryOpen(false);
    setNewCatForm({ id: '', name: '', nameEn: '', icon: '🍎' });
  };

  const handleSaveCategoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !onUpdateCategories) return;

    const updated = categories.map((c) =>
      c.id === editingCategory.id ? editingCategory : c
    );
    onUpdateCategories(updated);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (!onUpdateCategories) return;
    const prodsInCat = products.filter((p) => p.category === catId);
    if (prodsInCat.length > 0) {
      alert(`لا يمكن حذف هذا القسم لأنه يحتوي على ${prodsInCat.length} منتج مسجل.`);
      return;
    }

    if (confirm(`هل أنت متأكد من حذف القسم [${catName}] نهائياً؟`)) {
      onUpdateCategories(categories.filter((c) => c.id !== catId));
    }
  };

  return (
    <div className="space-y-6 text-right font-sans">
      {/* View Switcher Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('products')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'products'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>المنتجات والمخزون ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveView('categories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'categories'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>الأقسام والتصنيفات ({categories.length})</span>
          </button>
        </div>

        {activeView === 'products' ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة منتج جديد</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة قسم جديد</span>
          </button>
        )}
      </div>

      {activeView === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const catCount = products.filter((p) => p.category === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/10">
                        {cat.icon || '🏷️'}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                        <p className="text-[11px] text-gray-400 font-mono">{cat.nameEn || cat.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center justify-between text-xs mb-3">
                    <span className="text-gray-400">المنتجات المرتبطة:</span>
                    <span className="font-mono font-bold text-emerald-400">{catCount} منتج</span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setEditingCategory(cat)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-purple-400" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeView === 'products' && (
        <div className="space-y-4">
          {/* Top Header & Actions */}
          <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  إدارة الكتالوج والمنتجات والمخزون (Catalog & Inventory)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  إجمالي المنتجات المتاحة: {products.length} صنف غذائي واستهلاكي.
                </p>
              </div>
            </div>
          </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المنتج أو الباركود..."
            className="w-full bg-[#0D1527] border border-white/10 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedCat === 'all' ? 'bg-emerald-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400'
            }`}
          >
            كل الأقسام ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                selectedCat === c.id ? 'bg-emerald-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#0D1527] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-gray-400">
                <th className="p-3 font-bold">المنتج</th>
                <th className="p-3 font-bold">القسم</th>
                <th className="p-3 font-bold">السعر الحالي</th>
                <th className="p-3 font-bold">المخزون المتاح</th>
                <th className="p-3 font-bold">الحالة</th>
                <th className="p-3 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((p) => {
                const isLowStock = p.stockCount < 20;

                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-white/10 bg-black/20"
                        />
                        <div>
                          <p className="font-bold text-white text-xs">{p.name}</p>
                          <p className="text-[10px] text-gray-400">{p.unit} {p.nameEn ? `• ${p.nameEn}` : ''}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-gray-300">
                      {categories.find((c) => c.id === p.category)?.name || p.category}
                    </td>

                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {p.price.toLocaleString()} {p.currency || 'SAR'}
                    </td>

                    <td className="p-3 font-mono">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        isLowStock ? 'text-amber-400' : 'text-gray-300'
                      }`}>
                        {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{p.stockCount} {p.unit}</span>
                      </span>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.inStock && p.stockCount > 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {p.inStock && p.stockCount > 0 ? 'متوفر للطلب' : 'نفد المخزون'}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-purple-300 hover:text-white transition-colors cursor-pointer"
                          title="تعديل المنتج"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                          title="حذف المنتج"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* Category Add Modal */}
  {isAddCategoryOpen && (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleCreateCategory} className="bg-[#0D1527] border border-white/20 rounded-2xl w-full max-w-md p-5 shadow-2xl text-right animate-in fade-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>إضافة قسم أو تصنيف جديد</span>
          </h3>
          <button
            type="button"
            onClick={() => setIsAddCategoryOpen(false)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-300 font-bold mb-1">اسم القسم بالعربية:</label>
            <input
              type="text"
              value={newCatForm.name}
              onChange={(e) => setNewCatForm({ ...newCatForm, name: e.target.value })}
              placeholder="مثال: مخبوزات طازجة"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 font-bold mb-1">الاسم بالإنجليزية (اختياري):</label>
            <input
              type="text"
              value={newCatForm.nameEn}
              onChange={(e) => setNewCatForm({ ...newCatForm, nameEn: e.target.value })}
              placeholder="e.g. Fresh Bakery"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-bold mb-1">أيقونة القسم (إيموجي):</label>
            <input
              type="text"
              value={newCatForm.icon}
              onChange={(e) => setNewCatForm({ ...newCatForm, icon: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-lg"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            حفظ القسم الجديد
          </button>
          <button
            type="button"
            onClick={() => setIsAddCategoryOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )}

  {/* Category Edit Modal */}
  {editingCategory && (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSaveCategoryEdit} className="bg-[#0D1527] border border-white/20 rounded-2xl w-full max-w-md p-5 shadow-2xl text-right animate-in fade-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <span>تعديل بيانات القسم</span>
          </h3>
          <button
            type="button"
            onClick={() => setEditingCategory(null)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-300 font-bold mb-1">اسم القسم بالعربية:</label>
            <input
              type="text"
              value={editingCategory.name}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 font-bold mb-1">الاسم بالإنجليزية:</label>
            <input
              type="text"
              value={editingCategory.nameEn || ''}
              onChange={(e) => setEditingCategory({ ...editingCategory, nameEn: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-bold mb-1">أيقونة القسم:</label>
            <input
              type="text"
              value={editingCategory.icon || '📦'}
              onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-lg"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            تحديث بيانات القسم
          </button>
          <button
            type="button"
            onClick={() => setEditingCategory(null)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-[#0D1527] border border-white/20 rounded-2xl w-full max-w-lg p-5 shadow-2xl text-right animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>تعديل بيانات وسعر المنتج</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">اسم المنتج بالعربية:</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">السعر:</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">المخزون المتاح:</label>
                <input
                  type="number"
                  value={editingProduct.stockCount}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stockCount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">القسم:</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0D1527]">{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-white/10">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                حفظ التعديلات في الكتالوج
              </button>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateProduct} className="bg-[#0D1527] border border-white/20 rounded-2xl w-full max-w-lg p-5 shadow-2xl text-right animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>إضافة منتج جديد لحضرموت هايبر</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">اسم المنتج بالعربية:</label>
                <input
                  type="text"
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="مثال: عسل سدر دوعني فاخر"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">السعر:</label>
                <input
                  type="number"
                  step="0.1"
                  value={newProd.price}
                  onChange={(e) => setNewProd({ ...newProd, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">القسم:</label>
                <select
                  value={newProd.category}
                  onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0D1527]">{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">الوحدة (الوزن / الحجم):</label>
                <input
                  type="text"
                  value={newProd.unit}
                  onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                  placeholder="مثال: 1 كيلو أو عبوة 500 مل"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-300 font-bold mb-1">رابط صورة المنتج (URL):</label>
                <input
                  type="url"
                  value={newProd.image}
                  onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-white/10">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                إضافة المنتج للكتالوج
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
