import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, Camera, Check, Sparkles } from 'lucide-react';
import { AppLanguage } from '../types';

interface ImageUploaderProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  language?: AppLanguage;
  label?: string;
  className?: string;
}

const DEFAULT_LOCAL_IMAGES = [
  { path: '/assets/images/prod-sidr-honey.svg', nameAr: 'عسل سدر', nameEn: 'Sidr Honey' },
  { path: '/assets/images/prod-peshawar-rice.svg', nameAr: 'أرز بشاور', nameEn: 'Peshawar Rice' },
  { path: '/assets/images/prod-olive-oil.svg', nameAr: 'زيت زيتون', nameEn: 'Olive Oil' },
  { path: '/assets/images/prod-spices.svg', nameAr: 'بهارات', nameEn: 'Spices' },
  { path: '/assets/images/prod-coffee.svg', nameAr: 'بن يمني', nameEn: 'Coffee' },
  { path: '/assets/images/prod-apples.svg', nameAr: 'تفاح أحمر', nameEn: 'Apples' },
  { path: '/assets/images/prod-tomatoes.svg', nameAr: 'طماطم', nameEn: 'Tomatoes' },
  { path: '/assets/images/prod-meat.svg', nameAr: 'لحم نعيمي', nameEn: 'Fresh Meat' },
  { path: '/assets/images/prod-dairy.svg', nameAr: 'حليب طازج', nameEn: 'Fresh Milk' },
  { path: '/assets/images/prod-dates.svg', nameAr: 'تمور', nameEn: 'Dates' },
  { path: '/assets/images/prod-solar.svg', nameAr: 'طاقة شمسية', nameEn: 'Solar Panel' },
  { path: '/assets/images/prod-battery.svg', nameAr: 'بطارية', nameEn: 'Battery' },
  { path: '/assets/images/prod-oil-engine.svg', nameAr: 'زيت محرك', nameEn: 'Engine Oil' },
  { path: '/assets/images/prod-blender.svg', nameAr: 'خلاط مطبخ', nameEn: 'Blender' },
  { path: '/assets/images/prod-drill.svg', nameAr: 'دريل شحن', nameEn: 'Power Drill' },
];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = '',
  onChange,
  language = 'ar',
  label,
  className = '',
}) => {
  const isRtl = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(isRtl ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)' : 'Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-700">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="text-[11px] text-[#0E8A5E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>{isRtl ? 'اختيار من صور المشروع الجاهزة' : 'Pick from bundled assets'}</span>
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Upload / Preview Box */}
      {value ? (
        <div className="relative rounded-2xl border-2 border-emerald-500/30 bg-white p-2.5 flex items-center gap-3 shadow-xs">
          <img
            src={value}
            alt="Preview"
            className="w-16 h-16 rounded-xl object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
            onError={(e) => {
              // fallback if invalid
              (e.target as HTMLImageElement).src = '/assets/images/prod-sidr-honey.svg';
            }}
          />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-bold text-gray-800 truncate">
              {isRtl ? 'تم تحميل الصورة من الجهاز بنجاح' : 'Image loaded successfully'}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {value.startsWith('data:') ? (isRtl ? 'صورة محلية من الجهاز (Base64)' : 'Local Device Asset') : value}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Camera className="w-3 h-3 text-[#0E8A5E]" />
                <span>{isRtl ? 'تغيير الصورة من الجهاز' : 'Change from device'}</span>
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3 h-3" />
                <span>{isRtl ? 'حذف' : 'Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-gray-300 hover:border-[#0E8A5E] bg-gray-50/70 hover:bg-white'
          }`}
        >
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-[#0E8A5E] mb-2">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-800">
            {isRtl ? 'انقر لاختيار صورة من جهازك أو اسحبها وأفلتها هنا' : 'Click to upload from device or drag & drop'}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            {isRtl ? 'يدعم الصور من الهاتف أو الكمبيوتر (JPG, PNG, WebP, SVG)' : 'Supports phone/desktop files (JPG, PNG, WebP, SVG)'}
          </p>
        </div>
      )}

      {/* Preset bundled assets drawer */}
      {showPresets && (
        <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 animate-in fade-in">
          <p className="text-[11px] font-black text-emerald-900 mb-2">
            {isRtl ? 'صور افتراضية محملة محلياً داخل المشروع:' : 'Bundled local assets:'}
          </p>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
            {DEFAULT_LOCAL_IMAGES.map((img) => (
              <button
                key={img.path}
                type="button"
                onClick={() => {
                  onChange(img.path);
                  setShowPresets(false);
                }}
                className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 bg-white hover:border-[#0E8A5E] transition-all cursor-pointer ${
                  value === img.path ? 'border-2 border-[#0E8A5E] shadow-xs' : 'border-gray-200'
                }`}
              >
                <img src={img.path} alt={img.nameAr} className="w-8 h-8 object-contain" />
                <span className="text-[9px] font-bold text-gray-700 truncate w-full text-center">
                  {isRtl ? img.nameAr : img.nameEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
