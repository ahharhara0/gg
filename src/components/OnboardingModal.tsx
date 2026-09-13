import React, { useState } from 'react';
import { ShoppingBasket, Zap, Truck, ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ONBOARDING_SLIDES = [
  {
    icon: ShoppingBasket,
    badge: 'تسوق الهايبر المتكامل',
    title: 'جميع احتياجاتك ومؤن منزلك في مكان واحد',
    description:
      'اكتشف آلاف المنتجات الطازجة يومياً من الخضار واللحوم البلدية والمنتجات الحضرمية الأصيلة بأعلى معايير النظافة والجودة.',
    color: 'from-[#0E8A5E] to-[#095B3E]',
  },
  {
    icon: Zap,
    badge: 'مساعد صوتي & ذكاء اصطناعي',
    title: 'تسوّق بصوتك بالعامية في ثوانٍ معدودة',
    description:
      'تحدث مع مساعد حضرموت الذكي: قل فقط "أريد 2 كيلو طماطم وحليب المراعي" وستضاف المنتجات فوراً إلى سلة مشترياتك!',
    color: 'from-[#D97706] to-[#B45309]',
  },
  {
    icon: Truck,
    badge: 'توصيل فائق السرعة',
    title: 'توصيل سريع مبرد خلال 45 دقيقة وتتبع مباشر',
    description:
      'شاهد مندوب التوصيل لحظة بلحظة على الخريطة الحية حتى وصوله لعتبة بابك، مع خيارات دفع مرنة: مدى، فيزا، Apple Pay، أو عند الاستلام.',
    color: 'from-[#0B253A] to-[#1E3A8A]',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slide = ONBOARDING_SLIDES[currentSlide];
  const IconComponent = slide.icon;

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        {/* Top visual hero section */}
        <div className={`p-8 bg-gradient-to-br ${slide.color} text-white flex flex-col items-center justify-center text-center relative transition-colors duration-500`}>
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-xs text-white/70 hover:text-white bg-black/20 px-3 py-1 rounded-full cursor-pointer transition-colors"
          >
            تخطي الشرح
          </button>

          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-4 ring-4 ring-white/10 shadow-inner">
            <IconComponent className="w-10 h-10 text-[#F5A623]" />
          </div>

          <span className="inline-block bg-[#F5A623] text-[#0B253A] text-[11px] font-black px-3 py-1 rounded-full shadow-md mb-2">
            {slide.badge}
          </span>

          <h3 className="text-xl sm:text-2xl font-black leading-snug">
            {slide.title}
          </h3>
        </div>

        {/* Content body */}
        <div className="p-6 text-center flex flex-col items-center">
          <p className="text-sm text-gray-600 leading-relaxed max-w-xs mb-6">
            {slide.description}
          </p>

          {/* Dots pagination */}
          <div className="flex items-center gap-2 mb-6">
            {ONBOARDING_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide ? 'w-8 bg-[#0E8A5E]' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between w-full gap-3">
            {currentSlide > 0 ? (
              <button
                onClick={handlePrev}
                className="w-12 h-12 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                title="السابق"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-12" />
            )}

            <button
              onClick={handleNext}
              className="flex-1 py-3 px-6 rounded-2xl bg-[#0E8A5E] hover:bg-[#095B3E] active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-800/30 transition-all cursor-pointer"
            >
              {currentSlide === ONBOARDING_SLIDES.length - 1 ? (
                <>
                  <span>ابدأ التسوق الآن</span>
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>التالي</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
