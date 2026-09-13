import React, { useState } from 'react';
import { 
  Palette, 
  Plus, 
  Trash2, 
  Edit3, 
  Smartphone, 
  Sparkles, 
  Image as ImageIcon, 
  Eye, 
  Save, 
  MoveUp, 
  MoveDown,
  Megaphone,
  Check
} from 'lucide-react';
import { BannerConfig, CategoryConfig, AppUser } from '../../types';
import { auditLogger } from '../audit/auditLogger';
import { ImageUploader } from '../../components/ImageUploader';

interface AppBuilderCMSProps {
  banners: BannerConfig[];
  categories: CategoryConfig[];
  currentUser: AppUser;
  onUpdateBanners: (banners: BannerConfig[]) => void;
  onUpdateCategories: (categories: CategoryConfig[]) => void;
}

export const AppBuilderCMS: React.FC<AppBuilderCMSProps> = ({
  banners,
  categories,
  currentUser,
  onUpdateBanners,
  onUpdateCategories,
}) => {
  const [localBanners, setLocalBanners] = useState<BannerConfig[]>(banners);
  const [announcementText, setAnnouncementText] = useState('🔥 عروض نهاية الأسبوع في حضرموت هايبر: خصم 25% على اللحوم الطازجة والعسل الدوعني!');
  const [isSaved, setIsSaved] = useState(false);
  const [selectedBannerForEdit, setSelectedBannerForEdit] = useState<BannerConfig | null>(null);

  const handleSaveBanners = async () => {
    onUpdateBanners(localBanners);
    await auditLogger.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'CMS_BANNERS_UPDATED',
      category: 'operations',
      targetEntity: 'PromoBanners',
      details: { count: localBanners.length },
      severity: 'info'
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddBanner = () => {
    const newB: BannerConfig = {
      id: `b-${Date.now()}`,
      title: 'عرض استثنائي جديد',
      subtitle: 'أجود المنتجات الغذائية بأسعار منافسة',
      tag: 'عروض حصرية',
      bgGradient: 'from-emerald-700 to-teal-950',
      buttonText: 'تسوق الآن',
      categoryTarget: 'all',
      imageUrl: '/assets/images/banner_grocery.svg',
      isVisible: true
    };
    setLocalBanners([newB, ...localBanners]);
  };

  const handleDeleteBanner = (id: string) => {
    setLocalBanners(localBanners.filter((b) => b.id !== id));
  };

  const moveBanner = (index: number, direction: 'up' | 'down') => {
    const updated = [...localBanners];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setLocalBanners(updated);
  };

  return (
    <div className="space-y-6 text-right">
      {/* Top Banner */}
      <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              منشئ ومصمم واجهة التطبيق التفاعلي
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              تحكم ببنرات العروض الترويجية، الأقسام المميزة، والشريط الإعلاني المباشر.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>تم الحفظ والتطبيق!</span>
            </span>
          )}
          <button
            onClick={handleAddBanner}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>إضافة بنر جديد</span>
          </button>
          <button
            onClick={handleSaveBanners}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>نشر التغييرات على التطبيق</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / CMS Editor: 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          {/* Announcement Bar Editor */}
          <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5 mb-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>شريط التنبيهات والعروض الترويجية المتحرك</span>
            </h4>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Banners List */}
          <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
            <h4 className="text-xs font-black text-white mb-2">
              قائمة البنرات الترويجية الحالية ({localBanners.length})
            </h4>

            {localBanners.map((banner, idx) => (
              <div
                key={banner.id}
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveBanner(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                    >
                      <MoveUp className="w-3 h-3 text-gray-300" />
                    </button>
                    <button
                      onClick={() => moveBanner(idx, 'down')}
                      disabled={idx === localBanners.length - 1}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                    >
                      <MoveDown className="w-3 h-3 text-gray-300" />
                    </button>
                  </div>

                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-16 h-12 rounded-lg object-cover border border-white/10"
                  />

                  <div>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded">
                      {banner.tag || 'عرض'}
                    </span>
                    <p className="font-bold text-white text-xs mt-0.5">{banner.title}</p>
                    <p className="text-[10px] text-gray-400">{banner.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedBannerForEdit(banner)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-purple-300 transition-colors cursor-pointer"
                    title="تعديل البنر"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                    title="حذف البنر"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right / Live Phone Mockup Preview: 5 Cols */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[320px] bg-[#071D2F] border-4 border-slate-800 rounded-[36px] p-3 shadow-2xl overflow-hidden relative">
            {/* Phone Notch */}
            <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto mb-3" />

            {/* Mock Header */}
            <div className="flex items-center justify-between text-[11px] text-white font-bold mb-2 px-1">
              <span>حضرموت هايبر ماركت</span>
              <span className="text-amber-400 text-[9px]">4.9 ⭐</span>
            </div>

            {/* Mock Announcement Ticker */}
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-1.5 text-[9px] text-amber-200 mb-2 truncate">
              {announcementText}
            </div>

            {/* Mock Carousel Hero */}
            {localBanners[0] && (
              <div className={`rounded-xl p-3 text-white bg-gradient-to-r ${localBanners[0].bgGradient || 'from-emerald-700 to-teal-900'} relative overflow-hidden mb-3 shadow-md`}>
                <span className="text-[8px] bg-black/30 text-amber-300 font-bold px-1.5 py-0.5 rounded">
                  {localBanners[0].tag || 'مميز'}
                </span>
                <p className="font-black text-xs mt-1 text-white">{localBanners[0].title}</p>
                <p className="text-[9px] opacity-80 mt-0.5">{localBanners[0].subtitle}</p>
                <button className="mt-2 bg-amber-400 text-black text-[9px] font-bold px-2 py-0.5 rounded-md">
                  {localBanners[0].buttonText || 'تسوق الآن'}
                </button>
              </div>
            )}

            {/* Mock Categories Bar */}
            <div className="flex gap-1 overflow-x-auto pb-1 mb-3">
              {categories.slice(0, 4).map((c) => (
                <div key={c.id} className="bg-white/10 rounded-lg p-1.5 text-center min-w-[55px] shrink-0">
                  <span className="text-xs block">{c.icon || '🛍️'}</span>
                  <span className="text-[8px] text-white truncate block">{c.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>

            {/* Mock Products Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-white/5 border border-white/5 rounded-lg p-1.5">
                <div className="w-full h-12 bg-white/10 rounded mb-1" />
                <p className="text-[9px] font-bold text-white truncate">طماطم بلدي طازج</p>
                <p className="text-[8px] text-emerald-400 font-mono">1,200 ر.ي</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg p-1.5">
                <div className="w-full h-12 bg-white/10 rounded mb-1" />
                <p className="text-[9px] font-bold text-white truncate">عسل سدر دوعني</p>
                <p className="text-[8px] text-emerald-400 font-mono">14,500 ر.ي</p>
              </div>
            </div>

            <p className="text-center text-[9px] text-gray-500 mt-4">
              معاينة حية لواجهة المستخدم على شاشات الجوال
            </p>
          </div>
        </div>
      </div>

      {/* Edit Banner Modal */}
      {selectedBannerForEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1527] border border-purple-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl text-right animate-in fade-in zoom-in-95 space-y-3">
            <h4 className="text-sm font-black text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <Edit3 className="w-4 h-4 text-purple-400" />
              <span>تعديل محتوى البنر الترويجي</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">العنوان الرئيسي:</label>
                <input
                  type="text"
                  value={selectedBannerForEdit.title}
                  onChange={(e) => setSelectedBannerForEdit({ ...selectedBannerForEdit, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">العنوان الفرعي الوصفي:</label>
                <input
                  type="text"
                  value={selectedBannerForEdit.subtitle}
                  onChange={(e) => setSelectedBannerForEdit({ ...selectedBannerForEdit, subtitle: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">الشارة الترويجية:</label>
                <input
                  type="text"
                  value={selectedBannerForEdit.tag || ''}
                  onChange={(e) => setSelectedBannerForEdit({ ...selectedBannerForEdit, tag: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">صورة البنر (من الجهاز أو المكتبة):</label>
                <ImageUploader
                  currentImage={selectedBannerForEdit.imageUrl || ''}
                  onImageSelected={(url) => setSelectedBannerForEdit({ ...selectedBannerForEdit, imageUrl: url })}
                  label="اختيار أو رفع صورة البنر"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setLocalBanners(localBanners.map((b) => (b.id === selectedBannerForEdit.id ? selectedBannerForEdit : b)));
                  setSelectedBannerForEdit(null);
                }}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                تطبيق التعديل
              </button>
              <button
                onClick={() => setSelectedBannerForEdit(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
