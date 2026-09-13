import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  RefreshCw, 
  Eye, 
  X, 
  Calendar, 
  User, 
  Terminal,
  Trash2
} from 'lucide-react';
import { auditLogger } from '../audit/auditLogger';
import { AuditLog, AuditSeverity, AuditCategory } from '../audit/types';

export const AuditLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'all'>('all');
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const unsubscribe = auditLogger.subscribe((updated) => {
      setLogs(updated);
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      !searchQuery ||
      log.action.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.targetEntity.toLowerCase().includes(q) ||
      (typeof log.details === 'string' && log.details.toLowerCase().includes(q));
    return matchesSeverity && matchesCategory && matchesSearch;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hadramout-audit-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const headers = ['ID,Timestamp,ActorName,ActorRole,Action,Category,TargetEntity,Severity,Status,Details'];
    const rows = logs.map((l) => {
      const cleanDetails = (typeof l.details === 'object' ? JSON.stringify(l.details) : l.details || '').replace(/"/g, '""');
      return `"${l.id}","${l.timestamp}","${l.actorName}","${l.actorRole}","${l.action}","${l.category}","${l.targetEntity}","${l.severity}","${l.status}","${cleanDetails}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent([headers, ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `hadramout-audit-logs-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getSeverityBadge = (sev: AuditSeverity) => {
    switch (sev) {
      case 'critical':
        return {
          label: 'حرج (CRITICAL)',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: ShieldAlert
        };
      case 'warning':
        return {
          label: 'تحذير (WARNING)',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: AlertTriangle
        };
      case 'info':
      default:
        return {
          label: 'معلوماتي (INFO)',
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: Info
        };
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header Banner */}
      <div className="bg-[#111927] border border-purple-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>سجل التدقيق الأمني غير القابل للتعديل (Immutable Audit Trail)</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-mono">
                {logs.length} EVENTS RECORDED
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              توثيق لحظي لكل العمليات الحساسة وتغييرات الأدوار وقواطع الطوارئ وقواعد البيانات.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>تصدير JSON</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الإجراءات، المستخدمين، الكيانات..."
            className="w-full bg-[#0D1527] border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as any)}
            className="w-full bg-[#0D1527] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">كل درجات الأهمية (All Severities)</option>
            <option value="critical">حرج فقط (Critical Only)</option>
            <option value="warning">تحذيرات (Warnings)</option>
            <option value="info">معلوماتي (Info)</option>
          </select>
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="w-full bg-[#0D1527] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">كل التصنيفات (All Categories)</option>
            <option value="security">أمان وصلاحيات (Security)</option>
            <option value="system">النظام والبنية التحتية (System)</option>
            <option value="operations">العمليات والطلبات (Operations)</option>
            <option value="catalog">المتجر والمنتجات (Catalog)</option>
            <option value="finance">المالية والمدفوعات (Finance)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0D1527] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-gray-400">
                <th className="p-3 font-bold">الوقت والتاريخ</th>
                <th className="p-3 font-bold">المستخدم المنفذ (Actor)</th>
                <th className="p-3 font-bold">الإجراء الأمني (Action)</th>
                <th className="p-3 font-bold">الكيان المستهدف</th>
                <th className="p-3 font-bold">مستوى الخطورة</th>
                <th className="p-3 font-bold text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    لا توجد سجلات تطابق الفلتر المحدد.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const s = getSeverityBadge(log.severity);
                  const Icon = s.icon;
                  const dateStr = new Date(log.timestamp).toLocaleString('ar-SA', {
                    dateStyle: 'short',
                    timeStyle: 'medium'
                  });

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors font-mono">
                      <td className="p-3 text-gray-400 whitespace-nowrap text-[11px]">
                        {dateStr}
                      </td>

                      <td className="p-3 font-sans">
                        <p className="font-bold text-white text-xs">{log.actorName}</p>
                        <p className="text-[10px] text-purple-400 font-mono">[{log.actorRole}]</p>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-amber-300 font-mono text-[11px] block">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-gray-400 font-sans">
                          {typeof log.details === 'string' ? log.details.slice(0, 45) + (log.details.length > 45 ? '...' : '') : JSON.stringify(log.details).slice(0, 40)}
                        </span>
                      </td>

                      <td className="p-3 text-gray-300">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[11px]">
                          {log.targetEntity} {log.targetId ? `(${log.targetId})` : ''}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${s.bg}`}>
                          <Icon className="w-3 h-3" />
                          <span>{s.label}</span>
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setInspectLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 font-sans"
                        >
                          <Eye className="w-3 h-3 text-purple-400" />
                          <span>فحص</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Inspector Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1527] border border-purple-500/40 rounded-2xl w-full max-w-xl p-5 shadow-2xl text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>فحص حمولة السجل الأمني (Audit Log Payload)</span>
              </h3>
              <button
                onClick={() => setInspectLog(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-black/50 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-emerald-400 max-h-80 overflow-y-auto ltr text-left">
                <pre>{JSON.stringify(inspectLog, null, 2)}</pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setInspectLog(null)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
