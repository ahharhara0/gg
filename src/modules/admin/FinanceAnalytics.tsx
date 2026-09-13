import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Wallet, 
  Truck, 
  CheckCircle2, 
  Building2, 
  BarChart3, 
  ArrowUpRight,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Order, PaymentMethodConfig, AppUser } from '../../types';
import { auditLogger } from '../audit/auditLogger';

interface FinanceAnalyticsProps {
  orders: Order[];
  currentUser: AppUser;
}

export const FinanceAnalytics: React.FC<FinanceAnalyticsProps> = ({
  orders,
  currentUser,
}) => {
  const [enabledGateways, setEnabledGateways] = useState<Record<string, boolean>>({
    'بنك الكريمي': true,
    'الدفع عند الاستلام': true,
    'محفظة جيب': true,
    'البطاقة الائتمانية': true,
  });

  // Calculate Aggregates
  const totalRevenueYER = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalDeliveryFees = orders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const totalDriverPayouts = Math.round(totalDeliveryFees * 0.8);
  const netPlatformMargin = Math.round(totalRevenueYER * 0.12);

  const handleToggleGateway = async (gatewayName: string) => {
    const nextVal = !enabledGateways[gatewayName];
    setEnabledGateways((prev) => ({ ...prev, [gatewayName]: nextVal }));

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'PAYMENT_GATEWAY_TOGGLED',
      category: 'finance',
      targetEntity: 'PaymentGateway',
      targetId: gatewayName,
      details: { gatewayName, enabled: nextVal },
      severity: 'warning'
    });
  };

  return (
    <div className="space-y-6 text-right">
      {/* Top Header */}
      <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              التحليلات المالية وبوابات الدفع
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              متابعة حجم المبيعات الإجمالي، أرباح المنصة، ومستحقات بنك الكريمي ومناديب التوصيل.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-mono">
            عملة الحسابات: ريال يمني (ر.ي)
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV */}
        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">إجمالي المبيعات</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-white">{totalRevenueYER.toLocaleString()}</span>
            <span className="text-xs text-gray-400">ر.ي</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 border-t border-white/5 pt-2">
            <span>من {orders.length} طلب منفذ</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>+18.4%</span>
            </span>
          </div>
        </div>

        {/* Net Margin */}
        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">صافي هامش الهايبر</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-amber-300">{netPlatformMargin.toLocaleString()}</span>
            <span className="text-xs text-gray-400">ر.ي</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 border-t border-white/5 pt-2">
            <span>متوسط النسبة: 12%</span>
            <span className="text-amber-400 font-bold">أرباح تشغيلية</span>
          </div>
        </div>

        {/* Driver Payouts */}
        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">مستحقات المناديب</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-purple-300">{totalDriverPayouts.toLocaleString()}</span>
            <span className="text-xs text-gray-400">ر.ي</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 border-t border-white/5 pt-2">
            <span>تسوية بنك الكريمي</span>
            <span className="text-purple-400 font-bold">جاهز للصرف</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">متوسط قيمة السلة الشرائية</span>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-cyan-300">
              {orders.length > 0 ? Math.round(totalRevenueYER / orders.length).toLocaleString() : 0}
            </span>
            <span className="text-xs text-gray-400">ر.ي</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 border-t border-white/5 pt-2">
            <span>سلة تسوق غنية</span>
            <span className="text-cyan-400 font-bold">معدل ممتاز</span>
          </div>
        </div>
      </div>

      {/* Payment Gateways Manager */}
      <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <h4 className="text-sm font-black text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>بوابات وطرق الدفع المعتمدة (Payment Gateway Channels)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(enabledGateways).map(([name, enabled]) => (
            <div
              key={name}
              className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  {name.includes('الكريمي') ? 'K' : name.includes('جيب') ? 'J' : name.includes('البطاقة') ? '💳' : '💵'}
                </div>
                <div>
                  <p className="font-bold text-white text-xs">{name}</p>
                  <p className="text-[10px] text-gray-400">
                    {name.includes('الكريمي') 
                      ? 'تسوية آلية فورية عبر حساب حضرموت هايبر' 
                      : name.includes('الاستلام') 
                      ? 'دفع كاش للمندوب عند باب المنزل' 
                      : 'دفع رقمي فوري وآمن'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleToggleGateway(name)}
                className="cursor-pointer"
              >
                {enabled ? (
                  <ToggleRight className="w-7 h-7 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-500" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
