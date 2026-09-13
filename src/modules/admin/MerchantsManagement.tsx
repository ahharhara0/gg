import React, { useState } from 'react';
import { 
  Store, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Plus, 
  Building2, 
  Phone, 
  Mail, 
  BadgePercent, 
  Package, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Power,
  DollarSign
} from 'lucide-react';
import { AppUser, Product } from '../../types';
import { auditLogger } from '../audit/auditLogger';

interface MerchantsManagementProps {
  currentUser: AppUser;
  allUsers: AppUser[];
  products: Product[];
  onUpdateUser: (user: AppUser) => void;
}

export const MerchantsManagement: React.FC<MerchantsManagementProps> = ({
  currentUser,
  allUsers,
  products,
  onUpdateUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'active' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<AppUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form for manually onboarding a merchant
  const [newMerchantForm, setNewMerchantForm] = useState({
    name: '',
    phone: '',
    storeName: '',
    commercialId: '',
    merchantCategory: 'سوبرماركت ومواد غذائية',
    status: 'active' as const,
  });

  // Filter merchants
  const merchants = allUsers.filter((u) => u.role === 'merchant');
  const pendingMerchants = merchants.filter((u) => u.status === 'pending');
  const activeMerchants = merchants.filter((u) => u.status === 'active' || !u.status);

  const displayedList = (
    activeSubTab === 'pending'
      ? pendingMerchants
      : activeSubTab === 'active'
      ? activeMerchants
      : merchants
  ).filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.storeName || '').toLowerCase().includes(q) ||
      (m.phone || '').includes(q) ||
      (m.commercialId || '').includes(q)
    );
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Approve a pending merchant
  const handleApproveMerchant = async (merchant: AppUser) => {
    const updated: AppUser = {
      ...merchant,
      status: 'active',
      merchantBalance: merchant.merchantBalance || 0,
      totalProductsCount: merchant.totalProductsCount || 0,
    };

    onUpdateUser(updated);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'MERCHANT_APPROVED',
      category: 'operations',
      targetEntity: 'AppUser',
      targetId: merchant.id,
      details: {
        storeName: merchant.storeName || merchant.name,
        phone: merchant.phone,
        category: merchant.merchantCategory,
      },
      severity: 'info',
      status: 'SUCCESS',
    });

    showToast(`تم قبول واعتماد التاجر (${merchant.storeName || merchant.name}) بنجاح.`);
  };

  // Reject a pending merchant
  const handleRejectMerchant = async (merchant: AppUser) => {
    const reason = prompt('سبب رفض طلب انضمام التاجر (اختياري):', 'عدم استيفاء المستندات المطلوبة');
    if (reason === null) return;

    const updated: AppUser = {
      ...merchant,
      status: 'suspended',
    };

    onUpdateUser(updated);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'MERCHANT_REJECTED',
      category: 'operations',
      targetEntity: 'AppUser',
      targetId: merchant.id,
      details: {
        storeName: merchant.storeName || merchant.name,
        phone: merchant.phone,
        reason,
      },
      severity: 'warning',
      status: 'SUCCESS',
    });

    showToast(`تم رفض طلب التاجر (${merchant.storeName || merchant.name}).`);
  };

  // Toggle active/suspended for active merchant
  const handleToggleStatus = async (merchant: AppUser) => {
    const nextStatus = merchant.status === 'active' || !merchant.status ? 'suspended' : 'active';
    const updated: AppUser = { ...merchant, status: nextStatus };

    onUpdateUser(updated);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'MERCHANT_STATUS_TOGGLED',
      category: 'operations',
      targetEntity: 'AppUser',
      targetId: merchant.id,
      details: {
        storeName: merchant.storeName || merchant.name,
        newStatus: nextStatus,
      },
      severity: 'info',
      status: 'SUCCESS',
    });

    showToast(`تم تغيير حالة التاجر إلى (${nextStatus === 'active' ? 'نشط' : 'موقف مؤقتاً'})`);
  };

  // Create new merchant directly by manager
  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchantForm.name || !newMerchantForm.phone || !newMerchantForm.storeName) {
      alert('يرجى تعبئة الحقول الأساسية: اسم المسؤول، الهاتف، واسم المتجر');
      return;
    }

    const created: AppUser = {
      id: `merchant-${Date.now()}`,
      name: newMerchantForm.name,
      phone: newMerchantForm.phone,
      role: 'merchant',
      status: 'active',
      storeName: newMerchantForm.storeName,
      commercialId: newMerchantForm.commercialId || `CR-${Math.floor(100000 + Math.random() * 900000)}`,
      merchantCategory: newMerchantForm.merchantCategory,
      merchantBalance: 0,
      totalProductsCount: 0,
      createdAt: new Date().toISOString(),
    };

    onUpdateUser(created);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'MERCHANT_CREATED_BY_ADMIN',
      category: 'operations',
      targetEntity: 'AppUser',
      targetId: created.id,
      details: {
        storeName: created.storeName,
        phone: created.phone,
      },
      severity: 'info',
      status: 'SUCCESS',
    });

    setIsAddModalOpen(false);
    setNewMerchantForm({
      name: '',
      phone: '',
      storeName: '',
      commercialId: '',
      merchantCategory: 'سوبرماركت ومواد غذائية',
      status: 'active',
    });
    showToast(`تم إضافة التاجر (${created.storeName}) وتفعيله بنجاح.`);
  };

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-emerald-400/40 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0B1E2E] border border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">طلبات التجار قيد الاعتماد</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{pendingMerchants.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0B1E2E] border border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">المتاجر الشريكة المعتمدة</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{activeMerchants.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0B1E2E] border border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">إجمالي منتجات التجار</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">
              {products.filter((p) => p.merchantId).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0B1E2E] p-4 rounded-2xl border border-emerald-900/40">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'pending'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>طلبات الانضمام المعلقة ({pendingMerchants.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('active')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'active'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>المتاجر النشطة المعتمدة ({activeMerchants.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'all'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>جميع التجار ({merchants.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالمتجر أو التاجر أو الهاتف..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة تاجر شريك</span>
          </button>
        </div>
      </div>

      {/* Merchants Listing */}
      {displayedList.length === 0 ? (
        <div className="bg-[#0B1E2E] border border-white/5 rounded-2xl p-12 text-center">
          <Store className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-300">لا توجد سجلات تجار مطابقة للتصفية الحالية</p>
          <p className="text-xs text-gray-500 mt-1">
            {activeSubTab === 'pending'
              ? 'ممتاز! لا توجد طلبات انضمام تجار معلقة بانتظار الاعتماد حالياً.'
              : 'يمكنك إضافة تاجر شريك جديد بالضغط على الزر أعلاه.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedList.map((merchant) => {
            const isPending = merchant.status === 'pending';
            const isSuspended = merchant.status === 'suspended';
            const merchantProds = products.filter((p) => p.merchantId === merchant.id);

            return (
              <div
                key={merchant.id}
                className={`bg-[#0B1E2E] border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                  isPending
                    ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : isSuspended
                    ? 'border-rose-500/30 opacity-75'
                    : 'border-white/10 hover:border-emerald-500/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white">
                          {merchant.storeName || merchant.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <span>المسؤول: {merchant.name}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isPending
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : isSuspended
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      {isPending ? 'قيد المراجعة' : isSuspended ? 'موقف' : 'معتمد ونشط'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5 mb-3 font-mono">
                    <div className="flex items-center justify-between font-sans">
                      <span className="text-gray-400">التصنيف التجاري:</span>
                      <span className="font-bold text-white">
                        {merchant.merchantCategory || 'سوبرماركت وغذائيات'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-sans">رقم الهاتف:</span>
                      <span className="text-emerald-400 font-bold">{merchant.phone}</span>
                    </div>

                    {merchant.commercialId && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-sans">السجل التجاري:</span>
                        <span className="text-gray-300">{merchant.commercialId}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between font-sans pt-1 border-t border-white/5">
                      <span className="text-gray-400">عدد المنتجات المسجلة:</span>
                      <span className="font-bold text-cyan-400 font-mono">
                        {merchantProds.length} منتج
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleApproveMerchant(merchant)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>قبول واعتماد التاجر</span>
                      </button>

                      <button
                        onClick={() => handleRejectMerchant(merchant)}
                        className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="رفض الطلب"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggleStatus(merchant)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSuspended
                            ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isSuspended ? 'إعادة التفعيل' : 'إيقاف مؤقت'}</span>
                      </button>

                      <a
                        href={`tel:${merchant.phone}`}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold flex items-center gap-1 border border-white/10"
                        title="اتصال بالتاجر"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>اتصال</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Partner Merchant */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1E2E] border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                <span>إضافة تاجر شريك جديد في المنظومة</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMerchant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">اسم المتجر / العلامة:</label>
                  <input
                    type="text"
                    required
                    value={newMerchantForm.storeName}
                    onChange={(e) => setNewMerchantForm({ ...newMerchantForm, storeName: e.target.value })}
                    placeholder="مثال: مخابز حضرموت العصرية"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">اسم المالك / المسؤول:</label>
                  <input
                    type="text"
                    required
                    value={newMerchantForm.name}
                    onChange={(e) => setNewMerchantForm({ ...newMerchantForm, name: e.target.value })}
                    placeholder="مثال: سالم باحميد"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">رقم الهاتف (للتواصل):</label>
                  <input
                    type="text"
                    required
                    value={newMerchantForm.phone}
                    onChange={(e) => setNewMerchantForm({ ...newMerchantForm, phone: e.target.value })}
                    placeholder="مثال: +967 770 123 456"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">رقم السجل التجاري / الترخيص:</label>
                  <input
                    type="text"
                    value={newMerchantForm.commercialId}
                    onChange={(e) => setNewMerchantForm({ ...newMerchantForm, commercialId: e.target.value })}
                    placeholder="مثال: CR-884920"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">تصنيف المتجر:</label>
                <select
                  value={newMerchantForm.merchantCategory}
                  onChange={(e) => setNewMerchantForm({ ...newMerchantForm, merchantCategory: e.target.value })}
                  className="w-full bg-[#07131E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="سوبرماركت ومواد غذائية">سوبرماركت ومواد غذائية</option>
                  <option value="مخابز وحلويات">مخابز وحلويات</option>
                  <option value="لحوم ودواجن طازجة">لحوم ودواجن طازجة</option>
                  <option value="عطارة وتوابل وبن">عطارة وتوابل وبن حضرمي</option>
                  <option value="صيدلية وعناية شخصية">صيدلية وعناية شخصية</option>
                  <option value="إلكترونيات وأجهزة">إلكترونيات وأجهزة منزلية</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  حفظ وتفعيل التاجر فوراً
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
