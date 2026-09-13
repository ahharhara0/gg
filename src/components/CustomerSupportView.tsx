import React, { useState } from 'react';
import { 
  Headphones, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Phone, 
  User, 
  ShoppingBag,
  Sparkles,
  RotateCcw,
  CheckCheck,
  ShieldCheck,
  Building2,
  Mail,
  RefreshCw,
  ArrowRight,
  Store
} from 'lucide-react';
import { ComplaintItem, AppUser } from '../types';

interface CustomerSupportViewProps {
  currentUser: AppUser;
  complaints: ComplaintItem[];
  onReplyComplaint: (id: string, reply: string) => void;
  onResolveComplaint?: (id: string) => void;
  onOpenPolicies?: () => void;
  onBackToApp?: () => void;
}

export const CustomerSupportView: React.FC<CustomerSupportViewProps> = ({
  currentUser,
  complaints,
  onReplyComplaint,
  onResolveComplaint,
  onOpenPolicies,
  onBackToApp,
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(complaints[0]?.id || '');
  const [replyText, setReplyText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [quickReplySuccess, setQuickReplySuccess] = useState<string | null>(null);

  const safeComplaints = complaints || [];
  const selectedTicket = safeComplaints.find(c => c.id === selectedTicketId) || safeComplaints[0];

  const filteredTickets = safeComplaints.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (ticket.customerName || '').toLowerCase().includes(q) ||
      (ticket.customerPhone || '').includes(q) ||
      (ticket.subject || ticket.title || '').toLowerCase().includes(q) ||
      (ticket.id || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    onReplyComplaint(selectedTicket.id, replyText);
    setReplyText('');
    setQuickReplySuccess('تم إرسال الرد للعميل وتحديث حالة التذكرة بنجاح');
    setTimeout(() => setQuickReplySuccess(null), 3000);
  };

  const handleQuickTemplate = (template: string) => {
    setReplyText(template);
  };

  const quickTemplates = [
    'أهلاً بك عميلنا العزيز، نعتذر عن أي إزعاج ونؤكد لك أنه تم مراجعة الشكوى وتوجيه الكابتن فورياً.',
    'تم التحقق من طلبكم وإعادة المبلغ كاملاً إلى محفظتك الرقمية داخل التطبيق مع إضافة نقاط ولاء تعويضية.',
    'تم التواصل مع إدارة الفرع لتجهيز وإرسال الطلب البديل خلال 30 دقيقة بإذن الله.',
    'شكراً لتواصلك، تم تحويل ملاحظتكم لقسم الجودة وجارٍ المتابعة للتأكد من رضاكم التام.'
  ];

  const getStatusBadge = (status: ComplaintItem['status']) => {
    switch (status) {
      case 'pending':
        return {
          label: 'قيد الانتظار',
          bg: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
          icon: Clock
        };
      case 'in_progress':
        return {
          label: 'جارِ المعالجة والرد',
          bg: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
          icon: RefreshCw
        };
      case 'resolved':
        return {
          label: 'تم الحل وإغلاق التذكرة',
          bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
          icon: CheckCircle2
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
          icon: AlertCircle
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#07131D] text-slate-100 p-4 md:p-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-6 bg-gradient-to-r from-[#0C1F2D] via-[#0E8A5E]/20 to-[#0C1F2D] border border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0E8A5E] to-[#095B3E] flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
              <Headphones className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  واجهة خدمة العملاء والدعم
                </span>
                <span className="text-xs text-slate-400">
                  صلاحيات مخصصة: استقبال رسائل وشكاوى العملاء والرد المباشر فقط
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white mt-1">
                مركز الشكاوى والرسائل وخدمة العملاء
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
              >
                <Store className="w-4 h-4" />
                عرض المتجر الرئيسي
              </button>
            )}
            {onOpenPolicies && (
              <button
                onClick={onOpenPolicies}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                الاطلاع على لوائح الخصوصية والإرجاع
              </button>
            )}
            <div className="bg-[#081723] px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <span className="text-slate-400">المستخدم الحالي: </span>
              <strong className="text-white font-bold">{currentUser.name}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout: 2 Columns */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Complaints & Inquiries List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#0C1F2D] border border-slate-800 rounded-3xl p-4 shadow-lg flex flex-col h-[750px]">
            {/* Search & Filter Header */}
            <div className="space-y-3 pb-4 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="بحث برقم الشكوى، الاسم، أو الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#081723] border border-slate-700/70 rounded-xl py-2 pr-10 pl-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-[#0E8A5E] text-white shadow'
                      : 'bg-[#081723] text-slate-400 hover:text-white'
                  }`}
                >
                  الكل ({complaints.length})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                    statusFilter === 'pending'
                      ? 'bg-amber-500 text-slate-900 shadow'
                      : 'bg-[#081723] text-amber-400/80 hover:text-amber-300'
                  }`}
                >
                  قيد الانتظار ({complaints.filter(c => c.status === 'pending').length})
                </button>
                <button
                  onClick={() => setStatusFilter('in_progress')}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                    statusFilter === 'in_progress'
                      ? 'bg-blue-500 text-white shadow'
                      : 'bg-[#081723] text-blue-400/80 hover:text-blue-300'
                  }`}
                >
                  جارِ المعالجة ({complaints.filter(c => c.status === 'in_progress').length})
                </button>
                <button
                  onClick={() => setStatusFilter('resolved')}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                    statusFilter === 'resolved'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-[#081723] text-emerald-400/80 hover:text-emerald-300'
                  }`}
                >
                  المحلولة ({complaints.filter(c => c.status === 'resolved').length})
                </button>
              </div>
            </div>

            {/* Ticket items list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  لا توجد رسائل أو شكاوى تطابق البحث المختار
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = ticket.id === (selectedTicket?.id || '');
                  const badge = getStatusBadge(ticket.status);
                  const Icon = badge.icon;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-right ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/40'
                          : 'bg-[#081723]/70 border-slate-800/80 hover:bg-[#081723] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-slate-400 font-bold">
                          #{ticket.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}>
                          <Icon className="w-2.5 h-2.5" />
                          {badge.label}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-white line-clamp-1 mb-1">
                        {ticket.subject}
                      </h4>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                        {ticket.details}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                        <span className="flex items-center gap-1 text-slate-300">
                          <User className="w-3 h-3 text-emerald-400" />
                          {ticket.customerName}
                        </span>
                        <span>{ticket.createdAt}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Ticket Detail & Direct Reply Interface (8 cols) */}
        <div className="lg:col-span-8">
          {selectedTicket ? (
            <div className="bg-[#0C1F2D] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-[750px]">
              
              {/* Ticket Top Meta */}
              <div className="pb-5 border-b border-slate-800">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                        تذكرة #{selectedTicket.id}
                      </span>
                      {selectedTicket.orderId && (
                        <span className="text-xs text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700/60 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-[#F5A623]" />
                          الطلب المرتبط: <strong>{selectedTicket.orderId}</strong>
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        تاريخ الإنشاء: {selectedTicket.createdAt}
                      </span>
                    </div>

                    <h2 className="text-lg md:text-xl font-black text-white">
                      {selectedTicket.subject}
                    </h2>
                  </div>

                  {/* Status & Resolve Button */}
                  <div className="flex items-center gap-2">
                    {selectedTicket.status !== 'resolved' && onResolveComplaint && (
                      <button
                        onClick={() => onResolveComplaint(selectedTicket.id)}
                        className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        إغلاق وحل المشكلة
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#081723] p-3 rounded-2xl border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">اسم العميل</span>
                      <strong className="text-white font-bold">{selectedTicket.customerName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-[#F5A623]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">رقم الهاتف للتواصل</span>
                      <strong className="text-white font-mono">{selectedTicket.customerPhone}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">نوع الشكوى</span>
                      <strong className="text-white">
                        {selectedTicket.category === 'delivery' ? 'تأخير أو مسار توصيل' : 
                         selectedTicket.category === 'product' ? 'جودة أو تطابق السلعة' :
                         selectedTicket.category === 'payment' ? 'دفع ومحفظة إلكترونية' : 'استفسار عام'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message thread / Content history */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {/* Customer Original Inquiry */}
                <div className="bg-[#081723] border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      رسالة العميل ({selectedTicket.customerName}):
                    </span>
                    <span className="text-[10px]">{selectedTicket.createdAt}</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-200 leading-relaxed bg-[#05101A] p-3.5 rounded-xl border border-slate-800/80">
                    {selectedTicket.details}
                  </p>
                </div>

                {/* Staff Previous Replies */}
                {selectedTicket.adminReply ? (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-xs text-emerald-400 mb-2">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        رد خدمة العملاء المعتمد:
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {selectedTicket.updatedAt || 'مؤخراً'}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-emerald-100 leading-relaxed bg-emerald-900/30 p-3.5 rounded-xl border border-emerald-500/20">
                      {selectedTicket.adminReply}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-[#081723]/40 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
                    لم يتم الرد على هذه الشكوى بعد. يمكنك كتابة رد مباشر أدناه أو اختيار رد سريع جاهز.
                  </div>
                )}
              </div>

              {/* Quick Template Presets */}
              <div className="pt-2 pb-3 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  قوالب ردود سريعة ومقترحة:
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleQuickTemplate(tpl)}
                      className="text-[10px] text-slate-300 bg-[#081723] hover:bg-[#0E8A5E]/20 hover:text-emerald-300 border border-slate-700/60 rounded-lg px-2.5 py-1 text-right line-clamp-1 max-w-xs transition-colors cursor-pointer"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Banner on Success */}
              {quickReplySuccess && (
                <div className="mb-2 p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{quickReplySuccess}</span>
                </div>
              )}

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب ردك للعميل هنا... (يتم إرساله كإشعار فوري للعميل في التطبيق)"
                    className="w-full bg-[#081723] border border-slate-700/80 rounded-2xl p-3 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-6 bg-gradient-to-r from-[#0E8A5E] to-[#095B3E] hover:from-[#095B3E] hover:to-[#0E8A5E] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs md:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال الرد</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[#0C1F2D] border border-slate-800 rounded-3xl p-12 text-center text-slate-400 h-[750px] flex flex-col items-center justify-center">
              <Headphones className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-white mb-1">حدد تذكرة أو شكوى للبدء</h3>
              <p className="text-xs text-slate-500">
                اختر أي رسالة من القائمة لعرض تفاصيلها وكتابة الرد المعتمد
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
