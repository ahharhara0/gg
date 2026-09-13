import React, { useState } from 'react';
import { 
  Bike, 
  Car, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Plus, 
  Phone, 
  ShieldCheck, 
  MapPin, 
  Star, 
  Navigation, 
  Check, 
  Power,
  DollarSign,
  UserCheck
} from 'lucide-react';
import { AppUser, Order } from '../../types';
import { auditLogger } from '../audit/auditLogger';

interface DriversManagementProps {
  currentUser: AppUser;
  allUsers: AppUser[];
  orders: Order[];
  onUpdateUser: (user: AppUser) => void;
}

export const DriversManagement: React.FC<DriversManagementProps> = ({
  currentUser,
  allUsers,
  orders,
  onUpdateUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'active' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form for manually onboarding a delivery courier
  const [newDriverForm, setNewDriverForm] = useState({
    name: '',
    phone: '',
    vehicleType: 'دراجة نارية (سريعة)',
    vehiclePlate: '',
    nationalId: '',
  });

  const drivers = allUsers.filter((u) => u.role === 'driver');
  const pendingDrivers = drivers.filter((u) => u.status === 'pending');
  const activeDrivers = drivers.filter((u) => u.status === 'active' || !u.status);

  const displayedList = (
    activeSubTab === 'pending'
      ? pendingDrivers
      : activeSubTab === 'active'
      ? activeDrivers
      : drivers
  ).filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      (d.name || '').toLowerCase().includes(q) ||
      (d.phone || '').includes(q) ||
      (d.vehiclePlate || '').toLowerCase().includes(q)
    );
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Approve a pending driver
  const handleApproveDriver = async (driver: AppUser) => {
    const updated: AppUser = {
      ...driver,
      status: 'active',
      isOnline: true,
      driverRating: driver.driverRating || 5.0,
      completedDeliveries: driver.completedDeliveries || 0,
      driverEarnings: driver.driverEarnings || 0,
    };

    onUpdateUser(updated);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'DRIVER_APPROVED',
      category: 'operations',
      targetEntity: 'AppUser',
      targetId: driver.id,
      details: {
        driverName: driver.name,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
      },
      severity: 'info',
      status: 'SUCCESS',
    });

    showToast(`تم اعتماد وتفعيل الكابتن (${driver.name}) وأصبح جاهزاً لاستلام طلبات التوصيل.`);
  };

  // Reject a pending driver
  const handleRejectDriver = async (driver: AppUser) => {
    const reason = prompt('سبب رفض طلب المندوب (اختياري):', 'فحص المستندات غير مكتمل');
    if (reason === null) return;

    const updated: AppUser = {
      ...driver,
      status: 'suspended',
      isOnline: false,
    };

    onUpdateUser(updated);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'DRIVER_REJECTED',
      category: 'operations',
      targetEntity: 'AppUser',
      targetId: driver.id,
      details: {
        driverName: driver.name,
        phone: driver.phone,
        reason,
      },
      severity: 'warning',
      status: 'SUCCESS',
    });

    showToast(`تم رفض طلب الكابتن (${driver.name}).`);
  };

  // Toggle shift / online status
  const handleToggleOnline = async (driver: AppUser) => {
    const updated: AppUser = {
      ...driver,
      isOnline: !driver.isOnline,
    };

    onUpdateUser(updated);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'DRIVER_ONLINE_TOGGLED',
      category: 'operations',
      targetEntity: 'AppUser',
      targetId: driver.id,
      details: {
        isOnline: updated.isOnline,
      },
      severity: 'info',
      status: 'SUCCESS',
    });

    showToast(`تم تحديث حالة الوردية للكابتن ${driver.name} إلى (${updated.isOnline ? 'متاح للطلب' : 'غير متاح'})`);
  };

  // Create new driver manually
  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverForm.name || !newDriverForm.phone) {
      alert('يرجى إدخال اسم الكابتن ورقم الهاتف');
      return;
    }

    const created: AppUser = {
      id: `driver-${Date.now()}`,
      name: newDriverForm.name,
      phone: newDriverForm.phone,
      role: 'driver',
      status: 'active',
      isOnline: true,
      vehicleType: newDriverForm.vehicleType,
      vehiclePlate: newDriverForm.vehiclePlate || 'ص-1234',
      nationalId: newDriverForm.nationalId || '1099882233',
      driverRating: 5.0,
      completedDeliveries: 0,
      driverEarnings: 0,
      createdAt: new Date().toISOString(),
    };

    onUpdateUser(created);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'DRIVER_CREATED_BY_ADMIN',
      category: 'operations',
      targetEntity: 'AppUser',
      targetId: created.id,
      details: {
        driverName: created.name,
        phone: created.phone,
        vehicleType: created.vehicleType,
      },
      severity: 'info',
      status: 'SUCCESS',
    });

    setIsAddModalOpen(false);
    setNewDriverForm({
      name: '',
      phone: '',
      vehicleType: 'دراجة نارية (سريعة)',
      vehiclePlate: '',
      nationalId: '',
    });
    showToast(`تم تسجيل الكابتن (${created.name}) بنجاح.`);
  };

  const getVehicleIcon = (type?: string) => {
    if (!type) return <Bike className="w-5 h-5" />;
    if (type.includes('سيارة')) return <Car className="w-5 h-5" />;
    if (type.includes('شاحنة') || type.includes('باص')) return <Truck className="w-5 h-5" />;
    return <Bike className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-emerald-400/40 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0B1E2E] border border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">طلبات المناديب قيد الاعتماد</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{pendingDrivers.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0B1E2E] border border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">أسطول المناديب المعتمد</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{activeDrivers.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Bike className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0B1E2E] border border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">الكباتن المتاحون في الخدمة الآن</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">
              {activeDrivers.filter((d) => d.isOnline).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
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
            <span>طلبات المناديب المعلقة ({pendingDrivers.length})</span>
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
            <span>الأسطول المعتمد ({activeDrivers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'all'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>جميع المناديب ({drivers.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف أو اللوحة..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل كابتن جديد</span>
          </button>
        </div>
      </div>

      {/* Drivers Cards Grid */}
      {displayedList.length === 0 ? (
        <div className="bg-[#0B1E2E] border border-white/5 rounded-2xl p-12 text-center">
          <Bike className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-300">لا يوجد مناديب مطابقون للتصفية الحالية</p>
          <p className="text-xs text-gray-500 mt-1">
            {activeSubTab === 'pending'
              ? 'ممتاز! لا توجد طلبات انضمام مناديب جديدة بانتظار الاعتماد.'
              : 'يمكنك تسجيل كابتن جديد بالضغط على الزر أعلاه.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedList.map((driver) => {
            const isPending = driver.status === 'pending';
            const isSuspended = driver.status === 'suspended';
            const isOnline = Boolean(driver.isOnline);
            const inFlightOrders = orders.filter(
              (o) => o.assignedDriverId === driver.id && o.status === 'out_for_delivery'
            );

            return (
              <div
                key={driver.id}
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
                      <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                        {getVehicleIcon(driver.vehicleType)}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white">{driver.name}</h4>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <span>{driver.vehicleType || 'دراجة نارية'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPending
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : isSuspended
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : isOnline
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-gray-500/20 border-gray-500/40 text-gray-400'
                        }`}
                      >
                        {isPending
                          ? 'بانتظار الاعتماد'
                          : isSuspended
                          ? 'موقف'
                          : isOnline
                          ? 'متصل ومتاح'
                          : 'غير متاح'}
                      </span>

                      {!isPending && (
                        <span className="text-[10px] text-amber-300 flex items-center gap-1 font-bold">
                          <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                          <span>{driver.driverRating || 5.0}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5 mb-3 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-sans">رقم الهاتف:</span>
                      <span className="text-emerald-400 font-bold">{driver.phone}</span>
                    </div>

                    {driver.vehiclePlate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-sans">لوحة المركبة:</span>
                        <span className="text-gray-200 font-bold">{driver.vehiclePlate}</span>
                      </div>
                    )}

                    {!isPending && (
                      <div className="flex items-center justify-between font-sans pt-1 border-t border-white/5">
                        <span className="text-gray-400">إجمالي التوصيلات:</span>
                        <span className="font-bold text-cyan-400 font-mono">
                          {driver.completedDeliveries || 0} طلب
                        </span>
                      </div>
                    )}

                    {inFlightOrders.length > 0 && (
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-sans mt-1">
                        يقوم بتوصيل طلب نشط حالياً ({inFlightOrders[0].id})
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleApproveDriver(driver)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>قبول واعتماد المندوب</span>
                      </button>

                      <button
                        onClick={() => handleRejectDriver(driver)}
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
                        onClick={() => handleToggleOnline(driver)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isOnline
                            ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                            : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isOnline ? 'إيقاف الوردية' : 'تفعيل الوردية'}</span>
                      </button>

                      <a
                        href={`tel:${driver.phone}`}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold flex items-center gap-1 border border-white/10"
                        title="اتصال بالكابتن"
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

      {/* Modal: Register new driver */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1E2E] border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-400" />
                <span>تسجيل واعتماد مندوب توصيل جديد</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">اسم الكابتن الثلاثي:</label>
                  <input
                    type="text"
                    required
                    value={newDriverForm.name}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, name: e.target.value })}
                    placeholder="مثال: عمر صالح باداود"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    required
                    value={newDriverForm.phone}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, phone: e.target.value })}
                    placeholder="مثال: +967 771 999 888"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">نوع وسيلة النقل:</label>
                  <select
                    value={newDriverForm.vehicleType}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, vehicleType: e.target.value })}
                    className="w-full bg-[#07131E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="دراجة نارية (سريعة)">دراجة نارية (سريعة)</option>
                    <option value="سيارة صغيرة (سيدان)">سيارة صغيرة (سيدان)</option>
                    <option value="باص فان بضائع">باص فان بضائع</option>
                    <option value="شاحنة تبريد وتجميد">شاحنة تبريد وتجميد</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">رقم لوحة المركبة:</label>
                  <input
                    type="text"
                    value={newDriverForm.vehiclePlate}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, vehiclePlate: e.target.value })}
                    placeholder="مثال: ص-45920"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">رقم الهوية الوطنية / الإقامة:</label>
                <input
                  type="text"
                  value={newDriverForm.nationalId}
                  onChange={(e) => setNewDriverForm({ ...newDriverForm, nationalId: e.target.value })}
                  placeholder="مثال: 1048291048"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  حفظ وتفعيل الكابتن فوراً
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
