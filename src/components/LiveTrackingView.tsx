import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Navigation, 
  Store, 
  Truck, 
  Star, 
  Send, 
  X, 
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface LiveTrackingViewProps {
  order: Order;
  onBackToHome: () => void;
  onAdvanceOrderStatus?: (newStatus: OrderStatus) => void;
}

const ORDER_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'CREATED', label: 'تم استلام الطلب', desc: 'تم توثيق طلبك وإرساله للفرع' },
  { status: 'STORE_PICKING', label: 'قيد التجهيز والتغليف', desc: 'طاقم الهايبر يجمع المنتجات الطازجة' },
  { status: 'READY_FOR_PICKUP', label: 'جاهز للتسليم', desc: 'تم استلام السلة من قبل المندوب' },
  { status: 'IN_TRANSIT', label: 'في طريق التوصيل', desc: 'المندوب في طريقه لعنوانك' },
  { status: 'DELIVERED', label: 'تم التوصيل بنجاح', desc: 'بالهناء والشفاء! تم إضافة الكاشباك' },
];

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  order,
  onBackToHome,
}) => {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status || 'IN_TRANSIT');
  const [carProgress, setCarProgress] = useState(65); // percentage along route
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'driver'; text: string; time: string }[]>([
    { sender: 'driver', text: 'السلام عليكم، معك الكابتن سالم النهدي. استلمت طلبك من هايبر ماركت حي النرجس وفي طريقي إليك.', time: '12:30 م' },
    { sender: 'driver', text: 'هل تفضل رنين الجرس أم ترك الطلب عند الباب؟', time: '12:32 م' },
  ]);
  const [newMsg, setNewMsg] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  // Auto progression of order stages to demonstrate the state machine
  useEffect(() => {
    const timer = setInterval(() => {
      setCarProgress((prev) => {
        if (prev >= 95) {
          setCurrentStatus('DELIVERED');
          return 100;
        }
        return prev + 3;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const userMessage = { sender: 'user' as const, text: newMsg.trim(), time: 'الآن' };
    setChatMessages((prev) => [...prev, userMessage]);
    setNewMsg('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'driver', text: 'أبشر ولا يهمك، دقيقتين وأكون عندك إن شاء الله.', time: 'الآن' },
      ]);
    }, 1200);
  };

  const getStepIndex = (status: OrderStatus) => {
    return ORDER_STEPS.findIndex((s) => s.status === status);
  };

  const currentStepIdx = getStepIndex(currentStatus);

  const driverDisplayName = order.acceptedDriverName || order.driverName || 'سالم النهدي';
  const driverDisplayVehicle = order.acceptedDriverVehicle || 'مركبة: تويوتا يارس • لوحة: ر ق م 1234';
  const driverDisplayPhone = order.acceptedDriverPhone || '+966 50 123 4567';
  const driverInitial = driverDisplayName.charAt(0) || 'س';

  return (
    <div className="flex flex-col flex-1 bg-[#F4F8F5] pb-10">
      {/* Top action header */}
      <div className="bg-[#0E8A5E] text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-black">تتبع مسار الطلب الحي</h2>
            <p className="text-[11px] text-emerald-100 font-mono">
              رقم الطلب: #{order.id} • {order.branchName}
            </p>
          </div>
        </div>

        <span className="text-[11px] bg-[#F5A623] text-[#0B253A] font-black px-3 py-1 rounded-full shadow-md animate-pulse">
          توصيل مباشر ⚡
        </span>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full space-y-4">
        {/* Interactive Live Map Section */}
        <div className="relative w-full h-72 rounded-3xl overflow-hidden bg-[#dce7e1] border border-emerald-200 shadow-md">
          {/* Map Grid Pattern */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: 'radial-gradient(#0E8A5E 1.2px, transparent 1.2px), radial-gradient(#0E8A5E 1.2px, #dce7e1 1.2px)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
            }}
          />

          {/* SVG Route Line from Store to Customer */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 240" preserveAspectRatio="none">
            {/* Base road */}
            <path
              d="M 50 190 Q 150 160 220 110 T 350 40"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Animated green delivery path */}
            <path
              d="M 50 190 Q 150 160 220 110 T 350 40"
              fill="none"
              stroke="#0E8A5E"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="8 4"
            />
          </svg>

          {/* Store Pin (Start) */}
          <div className="absolute left-[12%] bottom-[16%] flex flex-col items-center">
            <div className="bg-[#0B253A] text-white text-[9px] font-black px-2 py-0.5 rounded shadow mb-1">
              فرع حضرموت هايبر
            </div>
            <div className="w-9 h-9 rounded-full bg-[#0E8A5E] text-white flex items-center justify-center shadow-lg ring-4 ring-white">
              <Store className="w-5 h-5 text-[#F5A623]" />
            </div>
          </div>

          {/* Customer House Pin (Destination) */}
          <div className="absolute right-[12%] top-[12%] flex flex-col items-center">
            <div className="bg-[#0E8A5E] text-white text-[9px] font-black px-2 py-0.5 rounded shadow mb-1">
              عتبة منزلك
            </div>
            <div className="w-9 h-9 rounded-full bg-[#0B253A] text-white flex items-center justify-center shadow-lg ring-4 ring-white">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          {/* Courier Car Moving along path based on carProgress */}
          <div
            className="absolute transition-all duration-700 ease-out -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${12 + (carProgress * 0.74)}%`,
              top: `${80 - (carProgress * 0.65)}%`,
            }}
          >
            <div className="relative flex flex-col items-center">
              <div className="bg-[#F5A623] text-[#0B253A] text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white whitespace-nowrap mb-1 animate-bounce">
                الكابتن سالم ({100 - carProgress > 5 ? `${Math.round((100 - carProgress) / 5)} دقائق` : 'يصل الآن!'})
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0B253A] text-white flex items-center justify-center shadow-2xl ring-4 ring-[#F5A623]">
                <Truck className="w-5 h-5 text-[#F5A623]" />
              </div>
            </div>
          </div>

          {/* ETA Badge */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-emerald-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0E8A5E]" />
            <div>
              <p className="text-[10px] text-gray-400 font-bold">الوقت المتوقع للتوصيل</p>
              <p className="text-xs font-black text-[#0B253A]">
                {currentStatus === 'DELIVERED' ? 'تم التسليم الآن' : '15 - 20 دقيقة'}
              </p>
            </div>
          </div>
        </div>

        {/* Driver Card with Call & Chat */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-13 h-13 rounded-2xl bg-[#095B3E] text-white font-black text-lg flex items-center justify-center shadow-md">
                {driverInitial}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[9px]">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-gray-900">الكابتن: {driverDisplayName}</h4>
                <div className="flex items-center text-amber-500 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="mr-0.5">4.95</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {driverDisplayVehicle}
              </p>
              <p className="text-[11px] text-[#0E8A5E] font-bold mt-0.5">
                مندوب معتمد بحضرموت هايبر • متصل وجاهز للخدمة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Call button */}
            <button
              onClick={() => setIsCalling(true)}
              className="w-10 h-10 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#0E8A5E] flex items-center justify-center transition-colors cursor-pointer border border-emerald-200 shadow-xs"
              title="اتصال بالمندوب"
            >
              <Phone className="w-4 h-4" />
            </button>

            {/* Chat button */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-10 h-10 rounded-2xl bg-[#0B253A] hover:bg-[#123652] text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
              title="محادثة المندوب"
            >
              <MessageSquare className="w-4 h-4 text-[#F5A623]" />
            </button>
          </div>
        </div>

        {/* Order Lifecycle Milestones State Machine */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
          <h4 className="text-xs font-black text-gray-800 mb-4 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#0E8A5E]" />
            <span>مراحل دورة حياة الطلب (Order Lifecycle)</span>
          </h4>

          <div className="space-y-4 relative pr-2">
            {/* Vertical connector line */}
            <div className="absolute right-4 top-3 bottom-3 w-0.5 bg-gray-200" />

            {ORDER_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step.status} className="relative flex items-start gap-4">
                  {/* Step circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 ring-4 ring-white transition-all ${
                      isPast
                        ? 'bg-[#0E8A5E] text-white shadow-sm'
                        : isCurrent
                        ? 'bg-[#F5A623] text-[#0B253A] font-black shadow-md scale-110 animate-pulse'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-black ${
                        isCurrent
                          ? 'text-[#0E8A5E]'
                          : isPast
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items Preview */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-[#0E8A5E]" />
              <span>محتويات السلة ({(order.items || []).length} أصناف)</span>
            </h4>
            <span className="font-mono font-black text-xs text-[#0E8A5E]">
              {order.total.toFixed(2)} ر.س
            </span>
          </div>

          <div className="space-y-2">
            {(order.items || []).map((item, idx) => {
              const product = item?.product;
              const quantity = item?.quantity || 1;
              if (!product) return null;
              return (
                <div
                  key={product.id || idx}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={product.image}
                      alt={product.name || ''}
                      className="w-8 h-8 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="font-bold text-gray-800 line-clamp-1">{product.name}</span>
                      <span className="text-[10px] text-gray-400">× {quantity}</span>
                    </div>
                  </div>
                  <span className="font-mono text-gray-700">
                    {((product.price || 0) * quantity).toFixed(2)} ر.س
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Driver Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md h-[500px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-200">
            {/* Chat header */}
            <div className="bg-[#0E8A5E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  س
                </div>
                <div>
                  <h3 className="text-xs font-black">محادثة الكابتن سالم النهدي</h3>
                  <p className="text-[10px] text-emerald-100">مندوب توصيل حضرموت هايبر • متصل الآن</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages box */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-start' : 'items-end'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#0E8A5E] text-white rounded-tr-xs'
                        : 'bg-white text-gray-800 border border-gray-200 shadow-xs rounded-tl-xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="اكتب رسالة للمندوب..."
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#0E8A5E]"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-[#0E8A5E] hover:bg-[#095B3E] text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Driver Calling simulation Modal */}
      {isCalling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in zoom-in-95">
          <div className="w-full max-w-sm bg-[#0B253A] text-white rounded-3xl p-8 text-center flex flex-col items-center border border-emerald-500/30">
            <div className="w-20 h-20 rounded-full bg-[#0E8A5E] flex items-center justify-center text-3xl font-black mb-4 ring-8 ring-emerald-500/20 animate-pulse">
              {driverInitial}
            </div>
            <h3 className="text-lg font-black">جاري الاتصال بالكابتن {driverDisplayName}...</h3>
            <p className="text-xs text-gray-400 mt-1 font-mono">{driverDisplayPhone}</p>

            <div className="mt-8 flex gap-4 w-full">
              <button
                onClick={() => setIsCalling(false)}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Phone className="w-4 h-4 rotate-135" />
                <span>إنهاء المكالمة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
