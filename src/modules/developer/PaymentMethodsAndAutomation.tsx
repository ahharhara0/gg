import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Zap, 
  Radio, 
  ShieldCheck, 
  Sparkles, 
  Sliders, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  Wallet, 
  DollarSign, 
  ToggleLeft, 
  ToggleRight, 
  Key, 
  Globe, 
  Send,
  ArrowRight,
  PlayCircle
} from 'lucide-react';
import { PaymentMethodConfig, AppUser, Order } from '../../types';
import { auditLogger } from '../audit/auditLogger';

interface PaymentMethodsAndAutomationProps {
  currentUser: AppUser;
  paymentMethods: PaymentMethodConfig[];
  orders?: Order[];
  onUpdatePaymentMethods: (methods: PaymentMethodConfig[]) => void;
  onUpdateOrder?: (order: Order) => void;
}

export const PaymentMethodsAndAutomation: React.FC<PaymentMethodsAndAutomationProps> = ({
  currentUser,
  paymentMethods,
  orders = [],
  onUpdatePaymentMethods,
  onUpdateOrder,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'methods' | 'automation' | 'webhooks' | 'gateways'>('methods');
  
  // Payment Method Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);

  // Form State
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [bankOrIssuer, setBankOrIssuer] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [badge, setBadge] = useState('');
  const [color, setColor] = useState('#095B3E');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [isCod, setIsCod] = useState(false);
  const [minOrdersForCod, setMinOrdersForCod] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);

  // Automation Settings
  const [autoVerifyTransfers, setAutoVerifyTransfers] = useState(true);
  const [autoApprovalThresholdYER, setAutoApprovalThresholdYER] = useState(50000);
  const [autoSplitSettlement, setAutoSplitSettlement] = useState(true);
  const [hyperCommissionRate, setHyperCommissionRate] = useState(10);
  const [merchantShareRate, setMerchantShareRate] = useState(90);
  const [driverFixedPayoutYER, setDriverFixedPayoutYER] = useState(1500);

  // Webhook Simulator State
  const [selectedGatewayForSim, setSelectedGatewayForSim] = useState('kuraimi_pay');
  const [simOrderId, setSimOrderId] = useState('');
  const [simAmountYER, setSimAmountYER] = useState(12500);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [recentWebhookEvents, setRecentWebhookEvents] = useState<{ id: string; event: string; status: string; time: string; payload: any }[]>([
    {
      id: 'wh-991',
      event: 'kuraimi.payment.settled',
      status: 'VERIFIED_200',
      time: 'منذ 3 دقائق',
      payload: { txId: 'TX-KRM-98124', amount: 8400, currency: 'YER', orderId: 'ORD-9821' }
    },
    {
      id: 'wh-990',
      event: 'mada.transaction.approved',
      status: 'VERIFIED_200',
      time: 'منذ 18 دقيقة',
      payload: { txId: 'TX-MDA-55012', amount: 45.0, currency: 'SAR', orderId: 'ORD-9750' }
    }
  ]);

  // Gateway credentials
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [kuraimiApiKey, setKuraimiApiKey] = useState('krm_live_sec_993821094812304912');
  const [qutaibiApiKey, setQutaibiApiKey] = useState('qtb_live_sec_884910293810293847');
  const [webhookSecret, setWebhookSecret] = useState('whsec_hadramout_hyper_super_hash_2026');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingMethod(null);
    setNameAr('');
    setNameEn('');
    setBankOrIssuer('');
    setAccountNumber('');
    setBadge('');
    setColor('#095B3E');
    setTextColor('#FFFFFF');
    setIsCod(false);
    setMinOrdersForCod(0);
    setIsEnabled(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (method: PaymentMethodConfig) => {
    setEditingMethod(method);
    setNameAr(method.name);
    setNameEn(method.nameEn || '');
    setBankOrIssuer(method.bankOrIssuer);
    setAccountNumber(method.accountNumber);
    setBadge(method.badge || '');
    setColor(method.color || '#095B3E');
    setTextColor(method.textColor || '#FFFFFF');
    setIsCod(!!method.isCod);
    setMinOrdersForCod(method.minOrdersForCod || 0);
    setIsEnabled(method.isEnabled);
    setIsModalOpen(true);
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !bankOrIssuer.trim()) return;

    let updatedMethods: PaymentMethodConfig[];

    if (editingMethod) {
      updatedMethods = paymentMethods.map((m) =>
        m.id === editingMethod.id
          ? {
              ...m,
              name: nameAr.trim(),
              nameEn: nameEn.trim() || nameAr.trim(),
              bankOrIssuer: bankOrIssuer.trim(),
              accountNumber: accountNumber.trim(),
              badge: badge.trim() || undefined,
              color,
              textColor,
              isCod,
              minOrdersForCod: isCod ? Number(minOrdersForCod) : undefined,
              isEnabled,
            }
          : m
      );
    } else {
      const newMethod: PaymentMethodConfig = {
        id: `pm-${Date.now()}`,
        key: `custom_${Date.now()}`,
        name: nameAr.trim(),
        nameEn: nameEn.trim() || nameAr.trim(),
        bankOrIssuer: bankOrIssuer.trim(),
        accountNumber: accountNumber.trim(),
        badge: badge.trim() || undefined,
        color,
        textColor,
        isCod,
        minOrdersForCod: isCod ? Number(minOrdersForCod) : undefined,
        isEnabled,
        order: paymentMethods.length + 1,
      };
      updatedMethods = [...paymentMethods, newMethod];
    }

    onUpdatePaymentMethods(updatedMethods);
    setIsModalOpen(false);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: editingMethod ? 'PAYMENT_METHOD_UPDATED' : 'PAYMENT_METHOD_CREATED',
      category: 'finance',
      targetEntity: 'PaymentMethod',
      targetId: editingMethod?.id || 'new',
      details: { nameAr, bankOrIssuer, isEnabled, isCod },
      severity: 'warning'
    });

    setSavedNotice('تم حفظ طريقة الدفع بنجاح وتعميمها على جميع المستخدمين!');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleToggleEnable = async (method: PaymentMethodConfig) => {
    const updated = paymentMethods.map((m) =>
      m.id === method.id ? { ...m, isEnabled: !m.isEnabled } : m
    );
    onUpdatePaymentMethods(updated);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'PAYMENT_METHOD_STATUS_TOGGLED',
      category: 'finance',
      targetEntity: 'PaymentMethod',
      targetId: method.id,
      details: { methodName: method.name, newState: !method.isEnabled },
      severity: 'warning'
    });
  };

  const handleDeleteMethod = async (methodId: string, methodName: string) => {
    const confirmed = confirm(`هل أنت متأكد من حذف طريقة الدفع [${methodName}] نهائياً من النظام؟`);
    if (!confirmed) return;

    const updated = paymentMethods.filter((m) => m.id !== methodId);
    onUpdatePaymentMethods(updated);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'PAYMENT_METHOD_DELETED',
      category: 'finance',
      targetEntity: 'PaymentMethod',
      targetId: methodId,
      details: { methodName },
      severity: 'critical'
    });
  };

  const handleTriggerSimulatedWebhook = () => {
    const targetOrder = orders.find(o => o.id === simOrderId) || orders[0];
    const eventId = `wh-sim-${Date.now().toString().slice(-4)}`;
    
    const newEvent = {
      id: eventId,
      event: `${selectedGatewayForSim}.payment.success`,
      status: 'HTTP_200_PROCESSED',
      time: 'الآن (مباشر)',
      payload: {
        gateway: selectedGatewayForSim,
        txRef: `TX-AUTO-${Date.now()}`,
        amountYER: simAmountYER,
        orderId: targetOrder ? targetOrder.id : (simOrderId || 'ORD-SIM-AUTO'),
        verificationEngine: 'INSTANT_SETTLEMENT_v2.4',
        timestamp: new Date().toISOString()
      }
    };

    setRecentWebhookEvents(prev => [newEvent, ...prev]);

    // If order was matched, update its payment status
    if (targetOrder && onUpdateOrder) {
      onUpdateOrder({
        ...targetOrder,
        paymentStatus: 'PAID',
        status: targetOrder.status === 'CREATED' ? 'STORE_PICKING' : targetOrder.status
      });
    }

    setWebhookStatus(`نجاح! تم استقبال ومعالجة إشعار الدفع الآلي لـ [${selectedGatewayForSim}] وتأكيد سداد الطلب.`);
    setTimeout(() => setWebhookStatus(null), 4500);
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header Banner */}
      <div className="bg-[#0B1528] border border-purple-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  محرك طرق الدفع وأتمتة العمليات المالية (Payment & Automation Engine)
                </h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono">
                  DEV ROOT PRIVILEGES
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                صلاحية حصرية لمهندس النظام: إضافة وتعديل أي طريقة دفع في أي وقت، تفعيل التحقق التلقائي، ومحاكاة Webhooks البنوك.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طريقة دفع جديدة</span>
            </button>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex gap-2 mt-5 border-t border-white/10 pt-3 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('methods')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'methods'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>طرق الدفع النشطة ({paymentMethods.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('automation')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'automation'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>أتمتة الدفع والتحقق الفوري</span>
          </button>

          <button
            onClick={() => setActiveSubTab('webhooks')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'webhooks'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>محاكي إشعارات البنوك (Webhooks Simulator)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('gateways')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'gateways'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>مفاتيح API وبيئة التشغيل</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Tab 1: Payment Methods List */}
      {activeSubTab === 'methods' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden shadow-xl ${
                method.isEnabled
                  ? 'bg-[#0E172A] border-purple-500/30 hover:border-purple-500/60'
                  : 'bg-[#0E172A]/50 border-white/5 opacity-60'
              }`}
            >
              {/* Top Accent Color Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: method.color || '#095B3E' }}
              />

              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">{method.name}</h4>
                      {method.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {method.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                      {method.nameEn} • {method.bankOrIssuer}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                      method.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {method.isEnabled ? 'مفعلة بالمشتريات' : 'معطلة'}
                  </span>
                </div>

                <div className="bg-[#080D1A] p-3 rounded-2xl border border-white/5 space-y-1.5 my-3 text-xs">
                  <div className="flex items-center justify-between text-gray-400 text-[11px]">
                    <span>رقم الحساب / الآيبان:</span>
                    <span className="font-mono font-bold text-purple-300">{method.accountNumber || 'تحويل مباشر'}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400 text-[11px]">
                    <span>النوع:</span>
                    <span className="text-gray-200">{method.isCod ? 'دفع عند الاستلام (COD)' : 'دفع إلكتروني / بنكي'}</span>
                  </div>
                  {method.isCod && (
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span>الحد الأدنى لطلبات العميل:</span>
                      <span className="text-amber-400 font-bold">{method.minOrdersForCod || 0} طلبات سابقة</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
                <button
                  onClick={() => handleToggleEnable(method)}
                  className={`text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    method.isEnabled
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  }`}
                >
                  {method.isEnabled ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>تعطيل مؤقت</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>تفعيل فوري</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(method)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="تعديل تفاصيل طريقة الدفع"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteMethod(method.id, method.name)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                    title="حذف طريقة الدفع"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Automated Payment Engine */}
      {activeSubTab === 'automation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Instant Verification Engine */}
          <div className="bg-[#0E172A] border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">قواعد التحقق التلقائي من الحوالات (Auto-Verification)</h4>
                <p className="text-xs text-gray-400">تأكيد سداد الطلبات آلياً بمجرد مطابقة الإشعار دون تدخل بشري</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-[#080D1A] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">محرك التحقق اللحظي من الحوالات المصرفية</span>
                  <span className="text-[11px] text-gray-400">فحص آلي لصيغ رسائل بنك الكريمي والقطيبي وإشعار SMS</span>
                </div>
                <button
                  onClick={() => setAutoVerifyTransfers(!autoVerifyTransfers)}
                  className={`p-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                    autoVerifyTransfers ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {autoVerifyTransfers ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{autoVerifyTransfers ? 'مفعل' : 'معطل'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#080D1A] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">سقف القبول الآلي اللحظي للطلبات (Auto-Approval Cap):</span>
                  <span className="font-mono text-purple-300 font-black">{autoApprovalThresholdYER.toLocaleString()} ر.ي</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="5000"
                  value={autoApprovalThresholdYER}
                  onChange={(e) => setAutoApprovalThresholdYER(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400">
                  الطلبات المدفوعة إلكترونياً التي تقل عن هذا المبلغ يتم تمريرها مباشرة لمرحلة التجهيز الفوري دون انتظار تدقيق المدير.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Automated Split Payouts Engine */}
          <div className="bg-[#0E172A] border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">التسوية الآلية للأرباح (Automated Revenue Split)</h4>
                <p className="text-xs text-gray-400">تقسيم وتوزيع الأرباح فور تسليم الطلب إلى محافظ التجار والمناديب</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-[#080D1A] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">التسوية المباشرة فور تسليم الطلب (Instant Settlement)</span>
                  <span className="text-[11px] text-gray-400">إيداع مستحقات التاجر وعمولة الكابتن لحظياً عند تحول حالة الطلب لـ DELIVERED</span>
                </div>
                <button
                  onClick={() => setAutoSplitSettlement(!autoSplitSettlement)}
                  className={`p-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                    autoSplitSettlement ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {autoSplitSettlement ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{autoSplitSettlement ? 'مفعل' : 'معطل'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#080D1A] border border-white/10 rounded-2xl">
                  <span className="text-gray-400 text-[11px] block">عمولة منصة الهايبر:</span>
                  <span className="font-mono text-lg font-black text-purple-300">{hyperCommissionRate}%</span>
                </div>
                <div className="p-3 bg-[#080D1A] border border-white/10 rounded-2xl">
                  <span className="text-gray-400 text-[11px] block">حصة التاجر الشريك:</span>
                  <span className="font-mono text-lg font-black text-emerald-400">{merchantShareRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Webhooks Simulator */}
      {activeSubTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-[#0E172A] border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">محاكي إشعارات البنوك الفورية (Bank Webhook Simulator)</h4>
                  <p className="text-xs text-gray-400">اختبار وصول إشعارات الدفع وتحديث حالة الطلبات مباشرة في بيئة الاختبار الحية</p>
                </div>
              </div>

              {webhookStatus && (
                <div className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-xl text-xs font-bold animate-in fade-in flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{webhookStatus}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">اختر البوابة أو البنك:</label>
                <select
                  value={selectedGatewayForSim}
                  onChange={(e) => setSelectedGatewayForSim(e.target.value)}
                  className="w-full bg-[#080D1A] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="kuraimi_pay">بنك الكريمي المميز (Kuraimi Instant Pay)</option>
                  <option value="qutaibi_bank">بنك القطيبي الإسلامي (Qutaibi Bank API)</option>
                  <option value="mada_network">شبكة مدى للمدفوعات السعودية (Mada)</option>
                  <option value="apple_pay">Apple Pay / Google Wallet</option>
                  <option value="jeeb_wallet">محفظة جيب كاش الرقمية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">معرف الطلب المراد سداده:</label>
                <select
                  value={simOrderId}
                  onChange={(e) => setSimOrderId(e.target.value)}
                  className="w-full bg-[#080D1A] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="">-- محاكاة طلب عام تلقائي --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      #{o.id} - {o.customerName} ({o.total} ر.ي) - {o.paymentStatus}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">المبلغ المحول (ر.ي):</label>
                <input
                  type="number"
                  value={simAmountYER}
                  onChange={(e) => setSimAmountYER(Number(e.target.value))}
                  className="w-full bg-[#080D1A] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleTriggerSimulatedWebhook}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/30 transition-all"
              >
                <PlayCircle className="w-4 h-4" />
                <span>إرسال Webhook فوري وتأكيد سداد الطلب الآن</span>
              </button>
            </div>
          </div>

          {/* Webhook Stream Logs */}
          <div className="bg-[#080D1A] border border-white/10 rounded-3xl p-5 space-y-3 font-mono text-xs">
            <h5 className="font-sans font-bold text-gray-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>سجل إشعارات الـ Webhooks الواردة مباشرة (Live Payload Stream)</span>
            </h5>
            <div className="space-y-2">
              {recentWebhookEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-2xl bg-[#0E172A] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">{evt.event}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                        {evt.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Payload: {JSON.stringify(evt.payload)}
                    </p>
                  </div>
                  <span className="text-gray-500 text-[11px] whitespace-nowrap">{evt.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Gateway Credentials */}
      {activeSubTab === 'gateways' && (
        <div className="bg-[#0E172A] border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">إعدادات بوابات الدفع وبيئة التشغيل (Gateway Config)</h4>
                <p className="text-xs text-gray-400">الربط البرمجي المشفر مع خوادم البنوك اليمنية والسعودية</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#080D1A] p-1.5 rounded-2xl border border-white/10 text-xs">
              <span className="text-gray-400 px-2">البيئة الحالية:</span>
              <button
                onClick={() => setIsLiveMode(false)}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  !isLiveMode ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Sandbox (اختبار)
              </button>
              <button
                onClick={() => setIsLiveMode(true)}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  isLiveMode ? 'bg-emerald-600 text-white font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Live (الإنتاج الفعلي)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#080D1A] border border-white/10 rounded-2xl space-y-2">
              <label className="block font-bold text-gray-300">مفتاح الربط السري لبنك الكريمي (Kuraimi API Secret):</label>
              <input
                type="password"
                value={kuraimiApiKey}
                onChange={(e) => setKuraimiApiKey(e.target.value)}
                className="w-full bg-[#0E172A] border border-white/10 rounded-xl px-3 py-2 text-purple-300 font-mono text-xs outline-none"
              />
            </div>

            <div className="p-4 bg-[#080D1A] border border-white/10 rounded-2xl space-y-2">
              <label className="block font-bold text-gray-300">مفتاح الربط السري لبنك القطيبي (Qutaibi API Secret):</label>
              <input
                type="password"
                value={qutaibiApiKey}
                onChange={(e) => setQutaibiApiKey(e.target.value)}
                className="w-full bg-[#0E172A] border border-white/10 rounded-xl px-3 py-2 text-purple-300 font-mono text-xs outline-none"
              />
            </div>

            <div className="sm:col-span-2 p-4 bg-[#080D1A] border border-white/10 rounded-2xl space-y-2">
              <label className="block font-bold text-gray-300">رمز توثيق إشعارات الـ Webhooks (Webhook Signing Secret):</label>
              <input
                type="text"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="w-full bg-[#0E172A] border border-white/10 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Payment Method Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0E172A] border border-purple-500/40 text-white rounded-3xl overflow-hidden shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {editingMethod ? 'تعديل بيانات طريقة الدفع' : 'إضافة طريقة دفع جديدة للنظام'}
                  </h4>
                  <p className="text-[11px] text-gray-400">ستظهر الطريقة فوراً للعملاء في نافذة إتمام الشراء</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMethod} className="space-y-4 pt-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">الاسم بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: حساب بنك التضامن"
                    className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Tadhamon Bank"
                    className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">اسم البنك أو المزود *</label>
                  <input
                    type="text"
                    required
                    value={bankOrIssuer}
                    onChange={(e) => setBankOrIssuer(e.target.value)}
                    placeholder="مثال: بنك التضامن الإسلامي"
                    className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">رقم الحساب أو الآيبان</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="مثال: 120491029481"
                    className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">شارة مميزة (Badge)</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="مثال: تحويل فوري 0% عمولة"
                    className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">لون التمييز (Accent Color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-[#080D1A] border border-white/10 rounded-xl px-3 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="p-3.5 rounded-2xl bg-[#080D1A] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">حالة طريقة الدفع</span>
                    <span className="text-[11px] text-gray-400">تفعيل أو تعطيل ظهورها للزبائن بالسلة</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                      isEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {isEnabled ? 'مفعلة' : 'معطلة'}
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                  <div>
                    <span className="font-bold text-white block">هل هي دفع عند الاستلام (COD)؟</span>
                    <span className="text-[11px] text-gray-400">يتم تحصيل المبلغ نقداً عبر كابتن التوصيل</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCod(!isCod)}
                    className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                      isCod ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {isCod ? 'نعم (COD)' : 'لا'}
                  </button>
                </div>

                {isCod && (
                  <div className="border-t border-white/5 pt-2.5">
                    <label className="block text-[11px] text-gray-300 mb-1">
                      الحد الأدنى لعدد طلبات العميل السابقة لإتاحة الدفع عند الاستلام:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minOrdersForCod}
                      onChange={(e) => setMinOrdersForCod(Number(e.target.value))}
                      className="w-32 bg-[#0E172A] border border-white/10 rounded-xl px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black cursor-pointer shadow-lg shadow-purple-600/30"
                >
                  {editingMethod ? 'تحديث وحفظ' : 'إضافة الطريقة الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
