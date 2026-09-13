import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Store, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  Navigation, 
  ShoppingBag, 
  Star, 
  Sparkles, 
  AlertCircle,
  ShieldCheck,
  Check,
  Send,
  X
} from 'lucide-react';
import { AppUser, Order, OrderStatus } from '../types';
import { PendingApprovalView } from './PendingApprovalView';

interface CourierDashboardViewProps {
  courier: AppUser;
  availableOrders: Order[];
  onAcceptOrder: (orderId: string) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onBackToApp: () => void;
}

export const CourierDashboardView: React.FC<CourierDashboardViewProps> = ({
  courier,
  availableOrders,
  onAcceptOrder,
  onUpdateOrderStatus,
  onBackToApp,
}) => {
  const isPending = courier?.status === 'pending' && courier?.role !== 'admin' && courier?.role !== 'developer';

  if (isPending) {
    return (
      <PendingApprovalView
        currentUser={courier}
        onBackToApp={onBackToApp}
      />
    );
  }

  const [isOnline, setIsOnline] = useState(courier?.isOnline ?? true);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available');
  const [callingPerson, setCallingPerson] = useState<{ name: string; phone: string; role: string } | null>(null);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: 'driver' | 'customer'; text: string; time: string }[]>([
    { sender: 'customer', text: 'السلام عليكم يا كابتن، هل استلمت الطلب من فرع الهايبر؟', time: 'منذ 5 دقائق' },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [driverWallet, setDriverWallet] = useState(courier?.driverEarnings || 2840.0);
  const [completedList, setCompletedList] = useState<Order[]>([]);

  // Find if courier has any active order currently in progress
  const safeAvailableOrders = availableOrders || [];
  const courierId = courier?.id || 'd1';
  const activeOrder = safeAvailableOrders.find(
    (o) => o.acceptedDriverId === courierId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );

  // Orders not yet accepted by any driver
  const openOrders = safeAvailableOrders.filter(
    (o) => !o.acceptedDriverId && (o.status === 'READY_FOR_PICKUP' || o.status === 'STORE_PICKING' || o.status === 'CREATED')
  );

  const handleAccept = (orderId: string) => {
    onAcceptOrder(orderId);
    setActiveTab('active');
  };

  const handleStepForward = (order: Order) => {
    if (order.status === 'READY_FOR_PICKUP' || order.status === 'STORE_PICKING' || order.status === 'CREATED') {
      onUpdateOrderStatus(order.id, 'IN_TRANSIT');
    } else if (order.status === 'IN_TRANSIT') {
      onUpdateOrderStatus(order.id, 'DELIVERED');
      const payout = order.deliveryFee || order.driverEarnings || 22.0;
      setDriverWallet((prev) => prev + payout);
      setCompletedList((prev) => [order, ...prev]);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'driver', text: inputMsg.trim(), time: 'الآن' },
    ]);
    setInputMsg('');
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'customer', text: 'شكراً لك كابتن، بانتظارك عند الباب.', time: 'الآن' },
      ]);
    }, 1200);
  };

  return (
    <div className="flex flex-col flex-1 bg-[#F4F8F5] pb-12 font-sans text-right">
      {/* Top Header */}
      <div className="bg-gradient-to-l from-[#071D2F] to-[#0B253A] text-white p-4 shadow-md sticky top-0 z-20">
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
                <h2 className="text-base font-black">بوابة كابتن التوصيل السريع</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPending ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'}`}>
                  {isPending ? 'بانتظار الاعتماد' : 'لوحة المندوب'}
                </span>
              </div>
              <p className="text-[11px] text-gray-300">
                الكابتن: <strong className="text-amber-300">{courier?.name || 'الكابتن'}</strong> • {courier?.vehicleType || 'سيارة يارس'}
              </p>
            </div>
          </div>

          {/* Online status switch */}
          {!isPending && (
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-md ${
                isOnline
                  ? 'bg-emerald-500 text-white animate-pulse'
                  : 'bg-gray-600 text-gray-200'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white' : 'bg-gray-400'}`} />
              <span>{isOnline ? 'متاح للطلبات' : 'غير متصل'}</span>
            </button>
          )}
        </div>

        {/* Courier Key Metrics Ribbon */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">أرباح اليوم</span>
            <span className="text-xs font-black text-emerald-400 font-mono">176.00 ر.س</span>
          </div>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">محفظة الأرباح</span>
            <span className="text-xs font-black text-[#F5A623] font-mono">{driverWallet.toFixed(2)} ر.س</span>
          </div>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">مشاوير ناجحة</span>
            <span className="text-xs font-black text-white font-mono">{courier.completedDeliveries || 142}</span>
          </div>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">تقييم الكابتن</span>
            <div className="flex items-center justify-center gap-1 text-amber-300 font-black text-xs">
              <Star className="w-3 h-3 fill-amber-300" />
              <span>{courier.driverRating || 4.95}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto w-full p-4 space-y-4">
        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-xs">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'available'
                ? 'bg-[#0E8A5E] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>طلبات متاحة للقبول ({openOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
              activeTab === 'active'
                ? 'bg-[#0E8A5E] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>مشواري الحالي {activeOrder ? '⚡ (1)' : ''}</span>
            {activeOrder && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-2 right-4" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#0E8A5E] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>سجل المشاوير</span>
          </button>
        </div>

        {/* Tab 1: Available Orders for Pickup */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {!isOnline ? (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                <h4 className="text-sm font-black text-amber-900">أنت في وضع عدم الاتصال (Offline)</h4>
                <p className="text-xs text-amber-700">اضغط على زر "متاح للطلبات" بالأعلى لتبدأ باستقبال وإسناد طلبات التوصيل السريع.</p>
                <button
                  onClick={() => setIsOnline(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-md cursor-pointer hover:bg-amber-700"
                >
                  تفعيل الاتصال الآن
                </button>
              </div>
            ) : openOrders.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-black text-gray-800">لا توجد طلبات معلقة بانتظار مندوب حالياً</h4>
                <p className="text-xs text-gray-500">تم التقاط جميع الطلبات الحالية. فور إتمام عميل جديد للطلب ستظهر لك هنا مباشرة مع التنبيه الصوتي.</p>
              </div>
            ) : (
              openOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-emerald-200 shadow-md overflow-hidden hover:border-emerald-400 transition-all"
                >
                  {/* Card top banner: Earnings & Order ID */}
                  <div className="bg-gradient-to-r from-[#0E8A5E] to-[#095B3E] p-3 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs bg-white/15 px-2 py-0.5 rounded">
                        طلب #{order.id}
                      </span>
                      <span className="text-[11px] text-emerald-100">{order.createdAt}</span>
                    </div>

                    {/* How much the courier earns when delivered */}
                    <div className="bg-[#F5A623] text-[#0B253A] font-black px-3 py-1 rounded-xl text-xs flex items-center gap-1 shadow-md animate-pulse">
                      <span>أجرتك عند التوصيل:</span>
                      <span className="font-mono text-sm">{order.deliveryFee || 22.0} ر.س</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3.5">
                    {/* Pickup Details (من أين يستلم البضاعة) */}
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#0E8A5E] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                        <Store className="w-4 h-4 text-[#F5A623]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-[#0E8A5E] block">1. نقطة استلام البضاعة (الهايبر)</span>
                        <h4 className="text-xs font-black text-gray-900">{order.branchName}</h4>
                        <p className="text-[11px] text-gray-600 mt-0.5">{order.pickupAddress || 'قسم استلام الطلبات السريعة وبوابة التحميل'}</p>
                      </div>
                    </div>

                    {/* Dropoff Details (موقع العميل والتسليم) */}
                    <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                        <MapPin className="w-4 h-4 text-amber-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-blue-700 block">2. موقع العميل والتسليم</span>
                        <h4 className="text-xs font-black text-gray-900">{order.customerName || 'عميل حضرموت'}</h4>
                        <p className="text-[11px] text-gray-700 mt-0.5">{order.deliveryAddress}</p>
                        {order.customerNotes && (
                          <p className="text-[10px] text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded mt-1 font-medium">
                            ملاحظة العميل: {order.customerNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="text-xs text-gray-700 pt-1 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-gray-500">
                        محتويات السلة ({(order.items || []).length} أصناف) • إجمالي الطلب: {(order.total || 0).toFixed(2)} ر.س
                      </span>
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-600">
                        {order.paymentMethod}
                      </span>
                    </div>

                    {/* Accept button */}
                    <button
                      onClick={() => handleAccept(order.id)}
                      className="w-full py-3 rounded-2xl bg-[#0E8A5E] hover:bg-[#095B3E] active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-800/20 cursor-pointer transition-all"
                    >
                      <Check className="w-4 h-4 text-[#F5A623]" />
                      <span>قبول هذا الطلب والبدء بالتوصيل فوراً</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Active Accepted Order */}
        {activeTab === 'active' && (
          <div>
            {!activeOrder ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-2">
                <Truck className="w-10 h-10 text-gray-400 mx-auto" />
                <h4 className="text-sm font-black text-gray-800">لا يوجد لديك مشوار قيد التنفيذ حالياً</h4>
                <p className="text-xs text-gray-500">انتقل لتبويب "الطلبات المتاحة" واختر طلباً لقبوله والبدء في استلامه وتوصيله.</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="px-4 py-2 rounded-xl bg-[#0E8A5E] text-white font-bold text-xs shadow-md cursor-pointer hover:bg-[#095B3E]"
                >
                  عرض الطلبات المتاحة
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-emerald-300 shadow-xl overflow-hidden space-y-4 p-5">
                {/* Active Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] bg-[#F5A623] text-[#0B253A] font-black px-2.5 py-0.5 rounded-full">
                      مشوار نشط قيد التوصيل ⚡
                    </span>
                    <h3 className="text-base font-black text-gray-900 mt-1">طلب #{activeOrder.id}</h3>
                  </div>

                  <div className="text-left">
                    <span className="text-[10px] text-gray-400 block font-bold">أجرتك المستحقة</span>
                    <span className="text-lg font-black text-[#0E8A5E] font-mono">
                      +{activeOrder.deliveryFee || 22.0} ر.س
                    </span>
                  </div>
                </div>

                {/* Pickup & Destination Map Visual Simulation */}
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-200 flex items-center justify-around p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-2xl bg-[#0E8A5E] text-white flex items-center justify-center shadow-md">
                      <Store className="w-5 h-5 text-[#F5A623]" />
                    </div>
                    <span className="text-[10px] font-black text-gray-800 mt-1">{activeOrder.branchName}</span>
                    <span className="text-[9px] text-gray-500">نقطة الاستلام</span>
                  </div>

                  {/* Route Dash line with Moving Scooter */}
                  <div className="flex-1 px-4 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full mb-1">
                      مسافة: 3.4 كم (~14 دقيقة)
                    </span>
                    <div className="w-full h-1 bg-emerald-300 rounded relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#0B253A] text-[#F5A623] flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                      <MapPin className="w-5 h-5 text-amber-300" />
                    </div>
                    <span className="text-[10px] font-black text-gray-800 mt-1">{activeOrder.customerName || 'العميل'}</span>
                    <span className="text-[9px] text-gray-500">موقع التسليم</span>
                  </div>
                </div>

                {/* Communication Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setCallingPerson({
                        name: activeOrder.customerName || 'العميل',
                        phone: activeOrder.customerPhone || '+966 50 123 4567',
                        role: 'العميل المستلم',
                      })
                    }
                    className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0E8A5E] font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>اتصال بالعميل</span>
                  </button>

                  <button
                    onClick={() => setChatOrder(activeOrder)}
                    className="py-2.5 px-3 rounded-xl bg-[#0B253A] hover:bg-[#123652] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-[#F5A623]" />
                    <span>محادثة العميل</span>
                  </button>
                </div>

                {/* State Transition Button */}
                <div className="pt-2">
                  {activeOrder.status === 'READY_FOR_PICKUP' || activeOrder.status === 'STORE_PICKING' || activeOrder.status === 'CREATED' ? (
                    <button
                      onClick={() => handleStepForward(activeOrder)}
                      className="w-full py-3.5 rounded-2xl bg-[#0E8A5E] hover:bg-[#095B3E] active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Store className="w-4 h-4 text-[#F5A623]" />
                      <span>استلمت البضاعة من الفرع وتأكدت من الأكياس (الانطلاق للعميل)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStepForward(activeOrder)}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-105 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5 text-amber-300" />
                      <span>وصلت للعميل وتم تسليم الطلب واستلام المبلغ (+{activeOrder.deliveryFee || 22.0} ر.س)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 space-y-3">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0E8A5E]" />
              <span>سجل مشاويرك المكتملة</span>
            </h4>

            {completedList.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">لا توجد مشاوير مكتملة في هذه الجلسة بعد.</p>
            ) : (
              <div className="space-y-2">
                {completedList.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-gray-900">طلب #{ord.id}</span>
                        <span className="text-[10px] bg-emerald-100 text-[#0E8A5E] font-bold px-1.5 py-0.5 rounded">
                          تم التوصيل بنجاح ✓
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{ord.deliveryAddress}</p>
                    </div>

                    <div className="text-left">
                      <span className="font-mono font-black text-[#0E8A5E] text-xs">
                        +{ord.deliveryFee || 22.0} ر.س
                      </span>
                      <span className="block text-[9px] text-gray-400">أرباح أضيفت للمحفظة</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Direct Call Simulation Modal */}
      {callingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in zoom-in-95">
          <div className="w-full max-w-sm bg-[#0B253A] text-white rounded-3xl p-8 text-center flex flex-col items-center border border-emerald-500/30">
            <div className="w-20 h-20 rounded-full bg-[#0E8A5E] flex items-center justify-center text-3xl font-black mb-4 ring-8 ring-emerald-500/20 animate-pulse">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-base font-black">جاري الاتصال بـ: {callingPerson.name}</h3>
            <span className="text-xs text-amber-300 mt-0.5 font-bold">{callingPerson.role}</span>
            <p className="text-xs text-gray-400 mt-1 font-mono">{callingPerson.phone}</p>

            <div className="mt-8 flex gap-4 w-full">
              <button
                onClick={() => setCallingPerson(null)}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>إنهاء المكالمة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Chat Modal */}
      {chatOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md h-[480px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-200">
            <div className="bg-[#0E8A5E] text-white p-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black">محادثة العميل: {chatOrder.customerName || 'المستلم'}</h3>
                <p className="text-[10px] text-emerald-100">طلب #{chatOrder.id} • توصيل سريع</p>
              </div>
              <button
                onClick={() => setChatOrder(null)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-gray-50 text-xs">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'driver' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-2.5 rounded-2xl ${
                      m.sender === 'driver'
                        ? 'bg-[#0E8A5E] text-white rounded-tl-xs'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tr-xs shadow-xs'
                    }`}
                  >
                    <p>{m.text}</p>
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 px-1">{m.time}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="أرسل رسالة للعميل..."
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#0E8A5E]"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-[#0E8A5E] text-white flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
