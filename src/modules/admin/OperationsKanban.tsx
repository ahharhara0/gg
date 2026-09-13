import React, { useState } from 'react';
import { 
  Kanban, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  UserCheck, 
  Phone, 
  MapPin, 
  Printer, 
  Search, 
  AlertCircle,
  Eye,
  DollarSign
} from 'lucide-react';
import { Order, OrderStatus, AppUser } from '../../types';
import { auditLogger } from '../audit/auditLogger';

interface OperationsKanbanProps {
  orders: Order[];
  drivers: AppUser[];
  onUpdateOrder: (updatedOrder: Order) => void;
  currentUser: AppUser;
}

const KANBAN_COLUMNS: {
  status: OrderStatus;
  titleAr: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  icon: any;
}[] = [
  {
    status: 'PAID',
    titleAr: 'طلبات جديدة ومعتمدة',
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-400',
    icon: Package
  },
  {
    status: 'STORE_PICKING',
    titleAr: 'جاري التجهيز والتجميع',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-400',
    icon: Clock
  },
  {
    status: 'READY_FOR_PICKUP',
    titleAr: 'جاهز للاستلام من المندوب',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-400',
    icon: Truck
  },
  {
    status: 'IN_TRANSIT',
    titleAr: 'جاري التوصيل للعميل',
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-400',
    icon: MapPin
  },
  {
    status: 'DELIVERED',
    titleAr: 'تم التسليم بنجاح',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400',
    icon: CheckCircle2
  }
];

export const OperationsKanban: React.FC<OperationsKanbanProps> = ({
  orders,
  drivers,
  onUpdateOrder,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderForDriver, setSelectedOrderForDriver] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      o.id.toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerPhone || '').includes(q) ||
      (o.deliveryAddress || '').toLowerCase().includes(q)
    );
  });

  const advanceOrderStatus = async (order: Order, nextStatus: OrderStatus) => {
    const updated: Order = { ...order, status: nextStatus };
    onUpdateOrder(updated);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'ORDER_STATUS_CHANGED',
      category: 'operations',
      targetEntity: 'Order',
      targetId: order.id,
      details: {
        orderId: order.id,
        previousStatus: order.status,
        newStatus: nextStatus,
        customerName: order.customerName,
        total: order.total
      },
      severity: nextStatus === 'CANCELLED' ? 'warning' : 'info'
    });
  };

  const assignDriver = async (order: Order, driver: AppUser) => {
    const updated: Order = {
      ...order,
      driverName: driver.name,
      driverPhone: driver.phone,
      vehicleInfo: driver.vehicleType || driver.vehiclePlate || 'مركبة معتمدة',
      acceptedDriverId: driver.id,
      acceptedDriverName: driver.name,
      acceptedDriverPhone: driver.phone,
      status: 'IN_TRANSIT'
    };
    onUpdateOrder(updated);
    setSelectedOrderForDriver(null);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'ORDER_DRIVER_ASSIGNED',
      category: 'operations',
      targetEntity: 'Order',
      targetId: order.id,
      details: {
        driverName: driver.name,
        driverPhone: driver.phone,
        driverId: driver.id
      },
      severity: 'info'
    });
  };

  return (
    <div className="space-y-6 text-right">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[#0D1527] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              لوحة كانبان للعمليات اللوجستية وتجهيز الطلبات
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              متابعة مسار الطلب لحظياً من التجميع حتى التسليم للكابتن وباب العميل.
            </p>
          </div>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الطلب، اسم العميل، الهاتف..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {KANBAN_COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => {
            if (col.status === 'PAID') {
              return o.status === 'PAID' || o.status === 'CREATED';
            }
            return o.status === col.status;
          });

          const Icon = col.icon;

          return (
            <div
              key={col.status}
              className="bg-[#0D1527] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-3 min-h-[450px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-black text-white">{col.titleAr}</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${col.badgeBg} ${col.badgeBorder} ${col.badgeText} font-mono`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Order Cards List */}
              <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-0.5">
                {colOrders.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-[11px] border border-dashed border-white/10 rounded-xl">
                    لا توجد طلبات في هذه المرحلة
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-xl p-3 text-xs space-y-2.5 transition-all shadow-md"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-amber-300">
                          #{order.id}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {order.createdAt || 'الآن'}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div>
                        <p className="font-bold text-white text-xs">{order.customerName || 'عميل المتجر'}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{order.customerPhone || 'بدون هاتف'}</span>
                        </p>
                        <p className="text-[10px] text-gray-300 mt-1 line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{order.deliveryAddress}</span>
                        </p>
                      </div>

                      {/* Items and Total */}
                      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">
                          {order.items?.length || 0} أصناف
                        </span>
                        <span className="font-mono font-black text-emerald-400">
                          {order.total.toLocaleString()} ر.ي
                        </span>
                      </div>

                      {/* Driver Status if assigned */}
                      {order.driverName && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-1.5 text-[10px] text-purple-300 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            <span>الكابتن: {order.driverName}</span>
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 flex-wrap">
                        {/* Status Advancement Buttons */}
                        {(order.status === 'PAID' || order.status === 'CREATED') && (
                          <button
                            onClick={() => advanceOrderStatus(order, 'STORE_PICKING')}
                            className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            بدء التجهيز 🛒
                          </button>
                        )}

                        {order.status === 'STORE_PICKING' && (
                          <button
                            onClick={() => advanceOrderStatus(order, 'READY_FOR_PICKUP')}
                            className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            جاهز للاستلام ✓
                          </button>
                        )}

                        {order.status === 'READY_FOR_PICKUP' && (
                          <button
                            onClick={() => setSelectedOrderForDriver(order)}
                            className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            إسناد لمندوب 🛵
                          </button>
                        )}

                        {order.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => advanceOrderStatus(order, 'DELIVERED')}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            تأكيد التسليم 🏁
                          </button>
                        )}

                        {/* Invoice & Details */}
                        <button
                          onClick={() => setSelectedOrderForInvoice(order)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
                          title="عرض الفاتورة والطباعة"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Driver Assignment Modal */}
      {selectedOrderForDriver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1527] border border-cyan-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl text-right animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-black text-white flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>إسناد الطلب #{selectedOrderForDriver.id} لمندوب توصيل</span>
            </h3>

            <p className="text-xs text-gray-400 mb-4">
              اختر كابتن التوصيل المتاح لتوجيه الطلب إليه وتفعيل التتبع المباشر للعميل.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {drivers.map((d) => (
                <button
                  key={d.id}
                  onClick={() => assignDriver(selectedOrderForDriver, d)}
                  className="w-full text-right p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">
                      {d.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">{d.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{d.phone}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    متاح للتوصيل
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedOrderForDriver(null)}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl text-right animate-in fade-in zoom-in-95">
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="font-black text-lg text-emerald-800">حضرموت هايبر ماركت</h2>
              <p className="text-xs text-gray-500">فاتورة طلب وتجهيز رسمي</p>
              <p className="text-xs font-mono font-bold mt-1 text-gray-700">رقم الفاتورة: #{selectedOrderForInvoice.id}</p>
            </div>

            <div className="text-xs space-y-1.5 mb-4 font-sans">
              <p><span className="text-gray-500">العميل:</span> <strong className="text-black">{selectedOrderForInvoice.customerName}</strong></p>
              <p><span className="text-gray-500">الهاتف:</span> <span className="font-mono">{selectedOrderForInvoice.customerPhone}</span></p>
              <p><span className="text-gray-500">العنوان:</span> {selectedOrderForInvoice.deliveryAddress}</p>
              <p><span className="text-gray-500">طريقة الدفع:</span> {selectedOrderForInvoice.paymentMethod}</p>
            </div>

            <div className="border-t border-b py-3 mb-4">
              <p className="text-xs font-bold text-gray-700 mb-2">الأصناف المطلوبة:</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
                {selectedOrderForInvoice.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.product.name} × {it.quantity}</span>
                    <span className="font-mono font-bold">{(it.product.price * it.quantity).toLocaleString()} ر.ي</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-xs mb-5 font-mono">
              <div className="flex justify-between text-gray-600">
                <span>المجموع الفرعي:</span>
                <span>{selectedOrderForInvoice.subtotal?.toLocaleString()} ر.ي</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>رسوم التوصيل:</span>
                <span>{selectedOrderForInvoice.deliveryFee?.toLocaleString()} ر.ي</span>
              </div>
              <div className="flex justify-between font-black text-sm text-emerald-800 border-t pt-1.5">
                <span>الإجمالي النهائي:</span>
                <span>{selectedOrderForInvoice.total.toLocaleString()} ر.ي</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة</span>
              </button>
              <button
                onClick={() => setSelectedOrderForInvoice(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
