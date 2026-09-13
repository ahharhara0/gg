import React, { useState } from 'react';
import { Camera, X, Scan, Check, Sparkles } from 'lucide-react';
import { Product, AppLanguage } from '../types';
import { getLocalizedProductName, formatPrice } from '../lib/translations';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  language?: AppLanguage;
  onProductFound: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  language = 'ar',
  onProductFound,
}) => {
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const isRtl = language === 'ar';

  if (!isOpen) return null;

  const handleSimulateScan = (product: Product) => {
    setScannedProduct(product);
    setTimeout(() => {
      onProductFound(product);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div 
        className="w-full max-w-md bg-[#0B253A] text-white rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 flex flex-col relative"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors z-10`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-5 text-center">
          <div className="inline-flex items-center gap-1.5 bg-[#0E8A5E]/40 text-emerald-300 border border-emerald-500/40 text-xs font-black px-3 py-1 rounded-full mb-2">
            <Camera className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>{isRtl ? 'ماسح الباركود الذكي (Google ML Kit)' : 'Smart Barcode Scanner (ML Kit)'}</span>
          </div>
          <h3 className="text-lg font-black">
            {isRtl ? 'وجه الكاميرا نحو باركود المنتج' : 'Point camera at product barcode'}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {isRtl 
              ? 'امسح أي منتج داخل أفرع حضرموت هايبر لمعرفة السعر الفوري وإضافته لسلتك'
              : 'Scan any in-store product for instant price check & add to cart'}
          </p>
        </div>

        {/* Viewfinder simulation */}
        <div className="relative w-full h-56 bg-black flex items-center justify-center overflow-hidden">
          {/* Laser scanning line */}
          <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-[#F5A623] to-transparent shadow-[0_0_12px_#F5A623] animate-[bounce_2s_infinite]" />

          {/* Viewfinder frame brackets */}
          <div className="w-56 h-36 border-2 border-dashed border-emerald-400/80 rounded-2xl relative flex items-center justify-center bg-emerald-500/5">
            <Scan className="w-12 h-12 text-emerald-400/40" />

            {/* Corner highlights */}
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#F5A623]" />
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#F5A623]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#F5A623]" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#F5A623]" />
          </div>

          {scannedProduct && (
            <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm flex flex-col items-center justify-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-[#0E8A5E] text-white flex items-center justify-center mb-2">
                <Check className="w-6 h-6 text-[#F5A623]" />
              </div>
              <p className="text-xs font-black text-emerald-300">
                {isRtl ? 'تم المسح بنجاح!' : 'Scanned successfully!'}
              </p>
              <p className="text-sm font-black text-white mt-1">
                {getLocalizedProductName(scannedProduct, language)}
              </p>
              <p className="text-xs text-[#F5A623] font-mono mt-0.5">
                {formatPrice(scannedProduct.price, scannedProduct.currency, language)}
              </p>
            </div>
          )}
        </div>

        {/* Test barcodes to click and scan instantly */}
        <div className="p-4 bg-black/30">
          <p className="text-xs text-gray-400 font-bold mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>{isRtl ? 'منتجات جاهزة للمسح الفوري:' : 'Ready for quick test scan:'}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(products || []).slice(0, 4).map((prod) => (
              <button
                key={prod.id}
                onClick={() => handleSimulateScan(prod)}
                className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 ${isRtl ? 'text-right' : 'text-left'} transition-all cursor-pointer flex items-center gap-2`}
              >
                <img
                  src={prod.image}
                  alt={getLocalizedProductName(prod, language)}
                  className="w-8 h-8 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white truncate">
                    {getLocalizedProductName(prod, language)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">{prod.barcode}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

