import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  Calendar, 
  UserCheck, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Printer,
  Copy,
  Check
} from 'lucide-react';
import { getAppPolicies, subscribeToPolicies } from '../data/policyData';
import { PolicyContent, AppLanguage } from '../types';

interface PoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'return';
  language?: AppLanguage;
}

export const PoliciesModal: React.FC<PoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  language = 'ar',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'return'>(initialTab);
  const [policies, setPolicies] = useState<PolicyContent>(getAppPolicies());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const unsub = subscribeToPolicies(() => {
      setPolicies(getAppPolicies());
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const isRtl = language === 'ar';
  const currentContent = activeTab === 'privacy' 
    ? (isRtl ? policies.privacyPolicyAr : (policies.privacyPolicyEn || policies.privacyPolicyAr))
    : (isRtl ? policies.returnPolicyAr : (policies.returnPolicyEn || policies.returnPolicyAr));

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in text-right" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B253A] via-[#0E8A5E] to-[#095B3E] p-6 text-white relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-[#F5A623] shadow-inner">
              {activeTab === 'privacy' ? (
                <ShieldCheck className="w-6 h-6 text-[#F5A623]" />
              ) : (
                <RotateCcw className="w-6 h-6 text-[#F5A623]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-200 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  لوائح معتمدة رسمياً
                </span>
                <span className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  آخر تحديث: {policies.lastUpdated}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                {activeTab === 'privacy' ? 'سياسة الخصوصية وأمن البيانات' : 'سياسة الاستبدال والإرجاع واسترداد الأموال'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle bar */}
        <div className="flex border-b border-gray-100 bg-gray-50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-white text-[#0E8A5E] shadow-sm border border-gray-200/70'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            سياسة الخصوصية وأمن البيانات
          </button>
          <button
            onClick={() => setActiveTab('return')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'return'
                ? 'bg-white text-[#0E8A5E] shadow-sm border border-gray-200/70'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            سياسة الاستبدال والإرجاع واسترداد الأموال
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-gray-700 text-sm leading-relaxed whitespace-pre-line selection:bg-emerald-100">
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#0E8A5E]" />
              <span>
                معتمدة وقابلة للتعديل والتحكم الكامل بواسطة: <strong>{policies.updatedBy}</strong>
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-100 text-[#0E8A5E] font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>
          </div>

          <div className="prose prose-sm max-w-none text-gray-800 space-y-3">
            {currentContent.split('\n').map((line, idx) => {
              if (line.startsWith('## ')) {
                return <h2 key={idx} className="text-base font-black text-[#0B253A] border-b border-gray-100 pb-1.5 mt-2">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={idx} className="text-sm font-bold text-[#0E8A5E] mt-3">{line.replace('### ', '')}</h3>;
              }
              if (line.startsWith('* ')) {
                return (
                  <div key={idx} className="flex items-start gap-2 pr-2 text-xs text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E8A5E] mt-1.5 shrink-0" />
                    <span>{line.replace('* ', '')}</span>
                  </div>
                );
              }
              if (!line.trim()) return <div key={idx} className="h-1" />;
              return <p key={idx} className="text-xs text-gray-600 leading-relaxed">{line}</p>;
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-medium">
            تخضع هذه السياسات للقوانين التجارية وحماية المستهلك المعتمدة في اليمن وحضرموت
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#0E8A5E] hover:bg-[#095B3E] text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            إغلاق ومتابعة التسوق
          </button>
        </div>
      </div>
    </div>
  );
};
