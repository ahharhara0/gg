import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  Wallet, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Plus, 
  Phone, 
  Send,
  X
} from 'lucide-react';
import { AppUser, ComplaintItem, Order } from '../../types';
import { auditLogger } from '../audit/auditLogger';

interface CrmManagerProps {
  users: AppUser[];
  complaints: ComplaintItem[];
  orders: Order[];
  currentUser: AppUser;
  onUpdateUser: (user: AppUser) => void;
  onUpdateComplaint: (complaint: ComplaintItem) => void;
}

export const CrmManager: React.FC<CrmManagerProps> = ({
  users,
  complaints,
  orders,
  currentUser,
  onUpdateUser,
  onUpdateComplaint,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'tickets'>('tickets');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Wallet Top-up Modal
  const [selectedUserForTopUp, setSelectedUserForTopUp] = useState<AppUser | null>(null);
  const [topUpAmount, setTopUpAmount] = useState(5000);
  const [topUpReason, setTopUpReason] = useState('شحن رصيد / تعويض عميل');

  // Ticket Resolution Modal
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [resolutionResponse, setResolutionResponse] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'open' | 'in_progress' | 'resolved'>('resolved');

  const customerUsers = users.filter((u) => u.role === 'customer' || !u.role);

  const filteredComplaints = complaints.filter((c) => {
    const matchesFilter = ticketFilter === 'all' || c.status === ticketFilter;
    const q = searchQuery.toLowerCase();
    const detailsText = c.description || (c as any).details || '';
    const matchesSearch = 
      !searchQuery ||
      c.id.toLowerCase().includes(q) ||
      (c.customerName || '').toLowerCase().includes(q) ||
      detailsText.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const handleApplyTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForTopUp || topUpAmount <= 0) return;

    const currentBalance = selectedUserForTopUp.walletBalance || 0;
    const newBalance = currentBalance + topUpAmount;
    const updatedUser = { ...selectedUserForTopUp, walletBalance: newBalance };
    onUpdateUser(updatedUser);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'WALLET_BALANCE_ADJUSTED',
      category: 'finance',
      targetEntity: 'AppUser',
      targetId: selectedUserForTopUp.id,
      details: {
        customerName: selectedUserForTopUp.name,
        topUpAmount,
        previousBalance: currentBalance,
        newBalance,
        reason: topUpReason
      },
      severity: 'info'
    });

    setSelectedUserForTopUp(null);
  };

  const handleResolveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const updated: ComplaintItem = {
      ...selectedComplaint,
      status: resolutionStatus,
      adminResponse: resolutionResponse,
    };

    onUpdateComplaint(updated);

    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'COMPLAINT_STATUS_UPDATED',
      category: 'operations',
      targetEntity: 'Complaint',
      targetId: selectedComplaint.id,
      details: {
        complaintId: selectedComplaint.id,
        customerName: selectedComplaint.customerName,
        status: resolutionStatus,
        response: resolutionResponse
      },
      severity: 'info'
    });

    setSelectedComplaint(null);
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header and SubTabs */}
      <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              علاقات العملاء والدعم الفني
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              متابعة شكاوى وتذاكر المتسوقين، إدارة نقاط الولاء، وتعبئة محافظ العملاء.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveSubTab('tickets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'tickets' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>صندوق الشكاوى والتذاكر ({complaints.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('customers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'customers' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>دليل العملاء والمحافظ ({customerUsers.length})</span>
          </button>
        </div>
      </div>

      {/* SubTab 1: Tickets */}
      {activeSubTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setTicketFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  ticketFilter === st ? 'bg-cyan-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400'
                }`}
              >
                {st === 'all' && 'كل التذاكر'}
                {st === 'open' && 'مفتوحة وجديدة'}
                {st === 'in_progress' && 'قيد المعالجة'}
                {st === 'resolved' && 'تم حلها ✓'}
              </button>
            ))}
          </div>

          {/* Tickets Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComplaints.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-gray-500 bg-[#0D1527] rounded-2xl border border-white/10">
                لا توجد تذاكر أو شكاوى تطابق الفلتر المحدد.
              </div>
            ) : (
              filteredComplaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400 font-black">
                      #{c.id} {c.orderId ? `• طلب #${c.orderId}` : ''}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      c.status === 'open'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : c.status === 'in_progress'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {c.status === 'open' ? 'مفتوحة' : c.status === 'in_progress' ? 'قيد المراجعة' : 'تم الحل ✓'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-white">{c.title || c.type}</h4>
                    <p className="text-xs text-gray-300 mt-1">{c.description || (c as any).details}</p>
                  </div>

                  <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="font-bold text-white">{c.customerName}</span>
                    <span className="font-mono">{c.customerPhone}</span>
                  </div>

                  {c.adminResponse && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-[11px] text-emerald-300">
                      <p className="font-bold">رد الإدارة المعتمد:</p>
                      <p className="mt-0.5 opacity-90">{c.adminResponse}</p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedComplaint(c);
                      setResolutionResponse(c.adminResponse || '');
                      setResolutionStatus(c.status);
                    }}
                    className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>الرد على العميل وتحديث حالة التذكرة</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SubTab 2: Customers Directory */}
      {activeSubTab === 'customers' && (
        <div className="bg-[#0D1527] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-gray-400">
                  <th className="p-3 font-bold">اسم العميل</th>
                  <th className="p-3 font-bold">رقم الهاتف</th>
                  <th className="p-3 font-bold">رصيد المحفظة</th>
                  <th className="p-3 font-bold">نقاط المكافآت</th>
                  <th className="p-3 font-bold text-center">إجراءات الرصيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customerUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-bold text-white">{u.name}</td>
                    <td className="p-3 font-mono text-gray-300">{u.phone}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {(u.walletBalance || 0).toLocaleString()} ر.ي
                    </td>
                    <td className="p-3 font-mono text-amber-400 font-bold">
                      {(u.loyaltyPoints || 0)} نقطة ⭐
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedUserForTopUp(u)}
                        className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                      >
                        <Wallet className="w-3 h-3" />
                        <span>شحن الرصيد / تعويض</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wallet Top-up Modal */}
      {selectedUserForTopUp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleApplyTopUp} className="bg-[#0D1527] border border-emerald-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl text-right animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>شحن محفظة العميل أو تعويضه</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserForTopUp(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs space-y-1">
              <p className="text-gray-400">العميل المستفيد:</p>
              <p className="font-bold text-white text-sm">{selectedUserForTopUp.name} ({selectedUserForTopUp.phone})</p>
              <p className="text-gray-400 mt-1">الرصيد الحالي: <span className="text-emerald-400 font-mono font-bold">{(selectedUserForTopUp.walletBalance || 0).toLocaleString()} ر.ي</span></p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">المبلغ المراد إيداعه (ريال يمني):</label>
                <input
                  type="number"
                  step="500"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">سبب الشحن (للتوثيق في سجل التدقيق):</label>
                <input
                  type="text"
                  value={topUpReason}
                  onChange={(e) => setTopUpReason(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                تأكيد الإيداع في المحفظة
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserForTopUp(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket Response Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleResolveComplaint} className="bg-[#0D1527] border border-cyan-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl text-right animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <span>الرد على تذكرة #{selectedComplaint.id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs space-y-1">
              <p className="font-bold text-white">{selectedComplaint.customerName}: {selectedComplaint.title}</p>
              <p className="text-gray-300">{selectedComplaint.details}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">حالة التذكرة الجديدة:</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="in_progress" className="bg-[#0D1527]">قيد المعالجة والتواصل</option>
                  <option value="resolved" className="bg-[#0D1527]">تم الحل وإرضاء العميل ✓</option>
                  <option value="open" className="bg-[#0D1527]">مفتوحة بانتظار العميل</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">الرد الرسمي للعميل:</label>
                <textarea
                  rows={3}
                  value={resolutionResponse}
                  onChange={(e) => setResolutionResponse(e.target.value)}
                  placeholder="مثال: تم مراجعة الشكوى وإعادة رصيد الصنف المفقود لمحفظتكم فوراً..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
              >
                إرسال الرد وتحديث التذكرة
              </button>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
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
