import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  X, 
  Plus, 
  Check, 
  Repeat, 
  Package, 
  CreditCard, 
  HelpCircle, 
  Settings, 
  User, 
  ShoppingBag, 
  ShieldCheck, 
  Globe, 
  Bell, 
  Phone, 
  Mail, 
  MapPin, 
  LogOut, 
  Cpu, 
  MessageCircle,
  Truck,
  Store,
  Lock,
  Copy,
  Building2,
  Banknote,
  Wallet,
  Navigation,
  Compass
} from 'lucide-react';
import { DEVELOPER_INFO } from '../data/initialCatalog';
import { Order, CartItem, AppUser, Product } from '../types';
import { 
  t, 
  formatPrice, 
  getLocalizedProductName, 
  getLocalizedProductUnit, 
  getLocalizedOrderStatus 
} from '../lib/translations';

interface ProfileViewProps {
  userPhone: string;
  previousOrders: Order[];
  currentUser?: AppUser;
  products?: Product[];
  language?: 'ar' | 'en';
  deliveryAddress?: string;
  onOpenLocationPicker?: () => void;
  onToggleLanguage?: () => void;
  onSetLanguage?: (lang: 'ar' | 'en') => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  onReOrder: (items: CartItem[]) => void;
  onOpenDocs: () => void;
  onLogout: () => void;
  onOpenLogin?: () => void;
  onOpenRoleDashboard?: () => void;
  onOpenRegister?: () => void;
  onOpenPolicies?: (tab?: 'privacy' | 'return') => void;
}

type ActiveModal = 
  | null 
  | 'favorites' 
  | 'personal_info' 
  | 'orders' 
  | 'payment_methods' 
  | 'help' 
  | 'settings' 
  | 'privacy';

export const ProfileView: React.FC<ProfileViewProps> = ({
  userPhone,
  previousOrders,
  currentUser,
  products = [],
  language = 'ar',
  deliveryAddress,
  onOpenLocationPicker,
  onToggleLanguage,
  onSetLanguage,
  onAddToCart,
  onReOrder,
  onOpenDocs,
  onLogout,
  onOpenLogin,
  onOpenRoleDashboard,
  onOpenRegister,
  onOpenPolicies,
}) => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reorderedOrderId, setReorderedOrderId] = useState<string | null>(null);

  // Personal Info Form State
  const [name, setName] = useState(currentUser?.name || 'أحمد بن هرهره');
  const [phone, setPhone] = useState(currentUser?.phone || userPhone || '+966 55 123 4567');
  const [email, setEmail] = useState(currentUser?.email || 'customer@hadramouthyper.com');
  const [address, setAddress] = useState(deliveryAddress || currentUser?.address || 'الرياض، حي النرجس، شارع أنس بن مالك');
  const [infoSavedToast, setInfoSavedToast] = useState(false);

  useEffect(() => {
    if (deliveryAddress) {
      setAddress(deliveryAddress);
    }
  }, [deliveryAddress]);

  // Payment Methods State (Wallets & Accounts)
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [userWallets, setUserWallets] = useState([
    { id: 'w1', name: 'محفظة فلوسك (بنك الكريمي)', type: 'فلوسك', account: '777123456', isDefault: true, color: 'from-blue-600 to-blue-700' },
    { id: 'w2', name: 'تحويل بنك القطيبي', type: 'قطيبي', account: '122456789', isDefault: false, color: 'from-emerald-700 to-emerald-800' },
    { id: 'w3', name: 'محفظة شلن', type: 'شلن', account: 'SH-998822', isDefault: false, color: 'from-amber-500 to-amber-600' },
    { id: 'w4', name: 'محفظة قروشي (بنك التضامن)', type: 'قروشي', account: '778899001', isDefault: false, color: 'from-purple-600 to-purple-700' },
    { id: 'w5', name: 'تحويل شركة العمقي للصرافة', type: 'عمقي', account: '25410988', isDefault: false, color: 'from-teal-700 to-teal-800' },
  ]);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletType, setNewWalletType] = useState('فلوسك');
  const [newWalletAccount, setNewWalletAccount] = useState('');

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletAccount.trim()) return;
    const colorMap: Record<string, string> = {
      'فلوسك': 'from-blue-600 to-blue-700',
      'قطيبي': 'from-emerald-700 to-emerald-800',
      'شلن': 'from-amber-500 to-amber-600',
      'قروشي': 'from-purple-600 to-purple-700',
      'عمقي': 'from-teal-700 to-teal-800',
    };
    setUserWallets((prev) => [
      ...prev,
      {
        id: `w-${Date.now()}`,
        name: `حسابي في ${newWalletType}`,
        type: newWalletType,
        account: newWalletAccount,
        isDefault: false,
        color: colorMap[newWalletType] || 'from-gray-700 to-gray-800',
      },
    ]);
    setNewWalletAccount('');
    setShowAddWallet(false);
  };

  // Favorites curated from products
  const favoriteProducts = products.slice(0, 4);

  const handleReorderClick = (order: Order) => {
    onReOrder(order.items);
    setReorderedOrderId(order.id);
    setTimeout(() => setReorderedOrderId(null), 1500);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setInfoSavedToast(true);
    setTimeout(() => {
      setInfoSavedToast(false);
      setActiveModal(null);
    }, 1200);
  };

  const isRtl = language === 'ar';
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="flex-1 bg-white flex flex-col min-h-full select-none" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Header Bar strictly matching the screenshot */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-50 px-6 py-4 flex items-center justify-between">
        {/* Left Side: "تسجيل الدخول" / Login link */}
        <button
          onClick={onOpenLogin || onLogout}
          className="text-[#0A7D8C] hover:text-[#086673] font-bold text-sm cursor-pointer transition-colors active:scale-95"
        >
          {currentUser?.name 
            ? (isRtl ? 'تسجيل الخروج' : t('logout', language)) 
            : (isRtl ? 'تسجيل الدخول' : t('login', language))}
        </button>

        {/* Center: Title "حسابي" */}
        <h1 className="text-xl font-black text-gray-900 tracking-tight">
          {isRtl ? 'حسابي' : t('myAccount', language)}
        </h1>

        {/* Right side spacer for balance */}
        <div className="w-16" />
      </div>

      {/* Menu Rows List matching the screenshot exactly */}
      <div className="flex-1 flex flex-col divide-y divide-gray-100">
        {/* 1. المفضلة (Favorites) */}
        <button
          onClick={() => setActiveModal('favorites')}
          className={`w-full px-6 py-4.5 flex items-center justify-between hover:bg-gray-50/80 active:bg-gray-100/70 transition-colors ${isRtl ? 'text-right' : 'text-left'} cursor-pointer group`}
        >
          <div className="flex items-center gap-4">
            {/* Soft Gray Folder / Cards Glyph */}
            <div className="w-7 h-7 flex items-center justify-center text-gray-300">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M4 4h7l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 4v10h16V8H4z" />
              </svg>
            </div>
            <span className="text-[15px] font-bold text-gray-800 group-hover:text-gray-900">
              {t('favorites', language)}
            </span>
          </div>
          <ChevronIcon className={`w-5 h-5 text-gray-300 group-hover:text-gray-400 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'} transition-all`} />
        </button>

        {/* 2. المعلومات الشخصية (Personal Information) */}
        <button
          onClick={() => setActiveModal('personal_info')}
          className={`w-full px-6 py-4.5 flex items-center justify-between hover:bg-gray-50/80 active:bg-gray-100/70 transition-colors ${isRtl ? 'text-right' : 'text-left'} cursor-pointer group`}
        >
          <div className="flex items-center gap-4">
            {/* Soft Gray User Silhouette Glyph */}
            <div className="w-7 h-7 flex items-center justify-center text-gray-300">
              <User className="w-6 h-6 fill-current stroke-none" />
            </div>
            <span className="text-[15px] font-bold text-gray-800 group-hover:text-gray-900">
              {t('personalInfo', language)}
            </span>
          </div>
          <ChevronIcon className={`w-5 h-5 text-gray-300 group-hover:text-gray-400 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'} transition-all`} />
        </button>

        {/* 2.5 موقع وعنوان التوصيل على الخريطة (Delivery Location Map) */}
        <button
          onClick={() => onOpenLocationPicker?.()}
          className={`w-full px-6 py-4.5 flex items-center justify-between hover:bg-gray-50/80 active:bg-gray-100/70 transition-colors ${isRtl ? 'text-right' : 'text-left'} cursor-pointer group`}
        >
          <div className="flex items-center gap-4">
            <div className="w-7 h-7 flex items-center justify-center text-gray-300 group-hover:text-[#0A7D8C] transition-colors">
              <MapPin className="w-6 h-6 fill-current stroke-none" />
            </div>
            <div>
              <span className="text-[15px] font-bold text-gray-800 group-hover:text-gray-900 block">
                {isRtl ? 'موقع وعنوان التوصيل على الخريطة' : 'Delivery Location on Map'}
              </span>
              <span className="text-xs text-gray-400 font-medium truncate max-w-[240px] block mt-0.5">
                {deliveryAddress || address || (isRtl ? 'انقر لتحديد موقعك بالخريطة' : 'Tap to pinpoint on map')}
              </span>
            </div>
          </div>
          <ChevronIcon className={`w-5 h-5 text-gray-300 group-hover:text-gray-400 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'} transition-all`} />
        </button>

        {/* 3. طلباتي (My Orders) */}
        <button
          onClick={() => setActiveModal('orders')}
          className={`w-full px-6 py-4.5 flex items-center justify-between hover:bg-gray-50/80 active:bg-gray-100/70 transition-colors ${isRtl ? 'text-right' : 'text-left'} cursor-pointer group`}
        >
          <div className="flex items-center gap-4">
            {/* Soft Gray Shopping Bag Glyph */}
            <div className="w-7 h-7 flex items-center justify-center text-gray-300">
              <ShoppingBag className="w-6 h-6 fill-current stroke-none" />
            </div>
            <span className="text-[15px] font-bold text-gray-800 group-hover:text-gray-900">
              {t('myOrders', language)}
            </span>
          </div>
          <ChevronIcon className={`w-5 h-5 text-gray-300 group-hover:text-gray-400 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'} transition-all`} />
        </button>

        {/* 4. طرق الدفع (Payment Methods) */}
        <button
          onClick={() => setActiveModal('payment_methods')}
          className={`w-full px-6 py-4.5 flex items-center justify-between hover:bg-gray-50/80 active:bg-gray-100/70 transition-colors ${isRtl ? 'text-right' : 'text-left'} cursor-pointer group`}
        >
          <div className="flex items-center gap-4">
            {/* Soft Gray Credit Card / Wallet Glyph */}
            <div className="w-7 h-7 flex items-center justify-center text-gray-300">
              <CreditCard className="w-6 h-6 fill-current stroke-none" />
            </div>
            <span className="text-[15px] font-bold text-gray-800 group-hover:text-gray-900">
              {t('paymentMethods', language)}
            </span>
          </div>
          <ChevronIcon className={`w-5 h-5 text-gray-300 group-hover:text-gray-400 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'} transition-all`} />
        </button>

        {/* 5. المساعدة والأسئلة الشائعة (Help & FAQs) */}
        <button
          onClick={() => setActiveModal('help')}
          className={`w-full px-6 py-4.5 flex items-center justify-between hover:bg-gray-50/80 active:bg-gray-100/70 transition-colors ${isRtl ? 'text-right' : 'text-left'} cursor-pointer group`}
        >
          <div className="flex items-center gap-4">
            {/* Soft Gray Help Circle Glyph */}
            <div className="w-7 h-7 flex items-center justify-center text-gray-300">
              <HelpCircle className="w-6 h-6 fill-current stroke-none" />
            </div>
            <span className="text-[15px] font-bold text-gray-800 group-hover:text-gray-900">
              {t('helpAndFaq', language)}
            </span>
          </div>
          <ChevronIcon className={`w-5 h-5 text-gray-300 group-hover:text-gray-400 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'} transition-all`} />
        </button>

        {/* 6. الاعدادات (Settings) */}
        <button
          onClick={() => setActiveModal('settings')}
          className={`w-full px-6 py-4.5 flex items-center justify-between hover:bg-gray-50/80 active:bg-gray-100/70 transition-colors ${isRtl ? 'text-right' : 'text-left'} cursor-pointer group`}
        >
          <div className="flex items-center gap-4">
            {/* Soft Gray Settings Cog Glyph */}
            <div className="w-7 h-7 flex items-center justify-center text-gray-300">
              <Settings className="w-6 h-6 fill-current stroke-none" />
            </div>
            <span className="text-[15px] font-bold text-gray-800 group-hover:text-gray-900">
              {t('settings', language)}
            </span>
          </div>
          <ChevronIcon className={`w-5 h-5 text-gray-300 group-hover:text-gray-400 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'} transition-all`} />
        </button>
      </div>

      {/* Bottom Version and Privacy Info */}
      <div className="pt-16 pb-8 text-center flex flex-col items-center justify-center text-gray-400">
        <p className="text-xs font-medium text-gray-400 tracking-wide">
          {t('version', language)}: {DEVELOPER_INFO.version}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={() => {
              if (onOpenPolicies) onOpenPolicies('privacy');
              else setActiveModal('privacy');
            }}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            {t('privacyPolicy', language)}
          </button>
          <span className="text-gray-300">•</span>
          <button
            onClick={() => {
              if (onOpenPolicies) onOpenPolicies('return');
              else setActiveModal('privacy');
            }}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            {isRtl ? 'سياسة الاستبدال والإرجاع' : 'Return Policy'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Interactive Sub-Modals for each menu item                                 */}
      {/* ========================================================================= */}

      {/* 1. Modal: المفضلة (Favorites) */}
      {activeModal === 'favorites' && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-black text-gray-900">{t('favorites', language)} ❤️</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {favoriteProducts.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs font-bold">
                  {t('noFavorites', language)}
                </div>
              ) : (
                favoriteProducts.map((p) => (
                  <div 
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-gray-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-black text-gray-800">{getLocalizedProductName(p, language)}</h4>
                        <p className="text-[11px] text-gray-400 font-medium">{getLocalizedProductUnit(p, language)}</p>
                        <p className="text-xs font-black text-[#E11D48] font-mono mt-0.5">
                          {formatPrice(p.price, p.currency, language)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onAddToCart?.(p, 1)}
                      className="px-3 py-1.5 rounded-xl bg-[#0A7D8C] hover:bg-[#086673] text-white font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('addToCart', language)}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: المعلومات الشخصية (Personal Information) */}
      {activeModal === 'personal_info' && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-black text-gray-900">{t('personalInfo', language)} 👤</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {infoSavedToast && (
              <div className="mb-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'تم حفظ التعديلات بنجاح!' : 'Changes saved successfully!'}</span>
              </div>
            )}

            <form onSubmit={handleSaveInfo} className="space-y-4 text-xs font-bold text-gray-700">
              <div>
                <label className="block mb-1.5 text-gray-600">{t('fullName', language)}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-gray-900 font-medium outline-none focus:border-[#0A7D8C] focus:bg-white transition-all"
                  />
                  <User className={`w-4 h-4 text-gray-400 absolute ${isRtl ? 'left-3' : 'right-3'} top-3`} />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-gray-600">{t('phoneNumber', language)}</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-gray-900 font-mono font-medium outline-none focus:border-[#0A7D8C] focus:bg-white transition-all"
                    dir="ltr"
                  />
                  <Phone className={`w-4 h-4 text-gray-400 absolute ${isRtl ? 'left-3' : 'right-3'} top-3`} />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-gray-600">{t('email', language)}</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-gray-900 font-mono font-medium outline-none focus:border-[#0A7D8C] focus:bg-white transition-all"
                    dir="ltr"
                  />
                  <Mail className={`w-4 h-4 text-gray-400 absolute ${isRtl ? 'left-3' : 'right-3'} top-3`} />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-gray-600">{t('addressLabel', language)}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-gray-900 font-medium outline-none focus:border-[#0A7D8C] focus:bg-white transition-all"
                  />
                  <MapPin className={`w-4 h-4 text-gray-400 absolute ${isRtl ? 'left-3' : 'right-3'} top-3`} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    onOpenLocationPicker?.();
                  }}
                  className="mt-2 w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-[#0A7D8C] font-black text-xs flex items-center justify-center gap-2 border border-emerald-200 cursor-pointer transition-all"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#0A7D8C] fill-[#0A7D8C]" />
                  <span>{isRtl ? '📍 فتح الخريطة داخل التطبيق لتحديد الموقع بدقة' : '📍 Open Map in App to Pinpoint Location'}</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#0A7D8C] hover:bg-[#086673] active:scale-95 text-white font-black text-sm cursor-pointer shadow-md transition-all mt-4"
              >
                {t('saveChanges', language)}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: طلباتي (My Orders) */}
      {activeModal === 'orders' && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-black text-gray-900">{t('myOrders', language)} 📦</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(previousOrders || []).length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300 stroke-1" />
                <p className="text-sm font-bold text-gray-500">{t('noOrdersYet', language)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isRtl ? 'ابدأ تسوقك مع حضرموت هايبر لتصلك طلباتك سريعاً' : 'Start shopping with Hadramout Hyper to receive your orders quickly'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {previousOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-gray-800">#{ord.id}</span>
                        <span className="text-[10px] bg-emerald-100 text-[#0A7D8C] font-black px-2 py-0.5 rounded-full">
                          {getLocalizedOrderStatus(ord.status || 'DELIVERED', language)} ✓
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        {(ord.items || []).length} {t('itemsCount', language)} • <strong className="font-mono text-gray-800">{formatPrice(ord.total || 0, 'SAR', language)}</strong>
                      </p>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(ord.createdAt || Date.now()).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleReorderClick(ord)}
                      className="px-3.5 py-2 rounded-xl bg-[#0A7D8C] hover:bg-[#086673] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      <span>{reorderedOrderId === ord.id ? (isRtl ? 'تمت الإضافة!' : 'Added!') : t('reorder', language)}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Modal: طرق الدفع (Payment Methods) */}
      {activeModal === 'payment_methods' && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">{t('paymentMethods', language)} 💳</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isRtl ? 'محافظ إلكترونية يمنية وحوالات بنكية معتمدة' : 'Yemeni e-wallets and approved bank transfers'}
                </p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Cash on Delivery Conditional Status Banner */}
              {(() => {
                const COD_REQ = 5;
                const completedCount = (previousOrders || []).length;
                const isCodEnabled = completedCount >= COD_REQ;
                const remaining = Math.max(0, COD_REQ - completedCount);

                return (
                  <div className={`p-4 rounded-2xl border ${
                    isCodEnabled 
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/80 border-amber-200 text-amber-950'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                          isCodEnabled ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {isCodEnabled ? <Check className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black">{t('cashOnDelivery', language)}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCodEnabled 
                                ? 'bg-emerald-200 text-emerald-800' 
                                : 'bg-amber-200 text-amber-800'
                            }`}>
                              {isCodEnabled 
                                ? (isRtl ? 'مفعل بحسابك ✓' : 'Active in your account ✓') 
                                : (isRtl ? 'مقفل مؤقتاً' : 'Temporarily locked')}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            {isCodEnabled 
                              ? (isRtl ? 'تهانينا! لقد أتممت 5 طلبات بنجاح ويمكنك الآن اختيار الدفع عند استلام مشترياتك.' : 'Congratulations! You have completed 5 orders and can now choose cash on delivery.')
                              : (isRtl ? 'لا يتفعل خيار الدفع عند الاستلام إلا بعد إتمام أول 5 طلبات عبر الدفع المقدم.' : 'Cash on delivery unlocks automatically after completing your first 5 prepaid orders.')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!isCodEnabled && (
                      <div className="mt-3 pt-2.5 border-t border-amber-200/80">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className="text-amber-900">
                            {isRtl ? 'مستوى إنجاز تفعيل الدفع عند الاستلام:' : 'COD activation progress:'}
                          </span>
                          <span className="font-mono text-[#0A7D8C]">
                            {isRtl 
                              ? `${completedCount} من أصل ${COD_REQ} طلبات (متبقي ${remaining})`
                              : `${completedCount} of ${COD_REQ} orders (${remaining} left)`}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#0A7D8C] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (completedCount / COD_REQ) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Official Store Accounts to transfer to */}
              <div>
                <h4 className="text-xs font-black text-gray-800 mb-2">
                  {isRtl ? 'حسابات حضرموت هايبر المعتمدة للتحويل المباشر:' : 'Approved Hadramout Hyper Accounts for Direct Transfer:'}
                </h4>
                <div className="space-y-2.5">
                  {/* 1. فلوسك */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        {isRtl ? 'فلوسك' : 'Floosak'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900">{isRtl ? 'محفظة فلوسك' : 'Floosak Wallet'}</span>
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{isRtl ? 'بنك الكريمي' : 'Kuraimi Bank'}</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-gray-700 mt-0.5" dir="ltr">777123456</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyText('floosak', '777123456')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 active:scale-95 text-xs font-bold text-blue-700 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAccount === 'floosak' ? t('copied', language) : t('copy', language)}</span>
                    </button>
                  </div>

                  {/* 2. تحويل قطيبي */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        {isRtl ? 'القطيبي' : 'Qutaibi'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900">{isRtl ? 'تحويل قطيبي' : 'Qutaibi Transfer'}</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">{isRtl ? 'بنك القطيبي الإسلامي' : 'Al-Qutaibi Bank'}</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-gray-700 mt-0.5" dir="ltr">122456789</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyText('qutaibi', '122456789')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 active:scale-95 text-xs font-bold text-emerald-800 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAccount === 'qutaibi' ? t('copied', language) : t('copy', language)}</span>
                    </button>
                  </div>

                  {/* 3. محفظة شلن */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        {isRtl ? 'شلن' : 'Shilling'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900">{isRtl ? 'محفظة شلن' : 'Shilling Wallet'}</span>
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">{isRtl ? 'محفظة شلن' : 'Shilling Wallet'}</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-gray-700 mt-0.5" dir="ltr">SH-998822</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyText('shilling', 'SH-998822')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 hover:bg-amber-50 active:scale-95 text-xs font-bold text-amber-800 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAccount === 'shilling' ? t('copied', language) : t('copy', language)}</span>
                    </button>
                  </div>

                  {/* 4. محفظة قروشي */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        {isRtl ? 'قروشي' : 'Qroushi'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900">{isRtl ? 'محفظة قروشي' : 'Qroushi Wallet'}</span>
                          <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">{isRtl ? 'بنك التضامن' : 'Tadhamon Bank'}</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-gray-700 mt-0.5" dir="ltr">778899001</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyText('qroushi', '778899001')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 hover:bg-purple-50 active:scale-95 text-xs font-bold text-purple-800 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAccount === 'qroushi' ? t('copied', language) : t('copy', language)}</span>
                    </button>
                  </div>

                  {/* 5. تحويل عمقي */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        {isRtl ? 'العمقي' : 'Omqi'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900">{isRtl ? 'تحويل عمقي' : 'Al-Omqi Transfer'}</span>
                          <span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">{isRtl ? 'شركة العمقي للصرافة' : 'Al-Omqi Exchange'}</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-gray-700 mt-0.5" dir="ltr">25410988</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyText('omqi', '25410988')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-teal-200 hover:bg-teal-50 active:scale-95 text-xs font-bold text-teal-800 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAccount === 'omqi' ? t('copied', language) : t('copy', language)}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Saved User Accounts */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-gray-800">
                    {isRtl ? 'حساباتي ومحافظي المسجلة:' : 'My Registered Accounts & Wallets:'}
                  </h4>
                  {!showAddWallet && (
                    <button
                      onClick={() => setShowAddWallet(true)}
                      className="text-xs font-bold text-[#0A7D8C] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'إضافة حساب' : 'Add Account'}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {userWallets.map((w) => (
                    <div 
                      key={w.id}
                      className={`p-3 rounded-2xl bg-gradient-to-r ${w.color} text-white shadow-sm flex items-center justify-between`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{w.name}</span>
                          {w.isDefault && (
                            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                              {isRtl ? 'افتراضي' : 'Default'}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs tracking-wider mt-0.5 text-white/90" dir="ltr">{w.account}</p>
                      </div>
                      <span className="text-[10px] bg-black/20 text-white/90 px-2 py-1 rounded-lg font-bold">
                        {w.type}
                      </span>
                    </div>
                  ))}

                  {showAddWallet && (
                    <form onSubmit={handleAddWallet} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 animate-in fade-in">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          {isRtl ? 'نوع المحفظة أو الحساب' : 'Wallet / Account Type'}
                        </label>
                        <select
                          value={newWalletType}
                          onChange={(e) => setNewWalletType(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#0A7D8C]"
                        >
                          <option value="فلوسك">{isRtl ? 'محفظة فلوسك (بنك الكريمي)' : 'Floosak Wallet (Kuraimi)'}</option>
                          <option value="قطيبي">{isRtl ? 'تحويل بنك القطيبي' : 'Qutaibi Bank Transfer'}</option>
                          <option value="شلن">{isRtl ? 'محفظة شلن' : 'Shilling Wallet'}</option>
                          <option value="قروشي">{isRtl ? 'محفظة قروشي (التضامن)' : 'Qroushi Wallet (Tadhamon)'}</option>
                          <option value="عمقي">{isRtl ? 'تحويل شركة العمقي للصرافة' : 'Al-Omqi Exchange Transfer'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          {isRtl ? 'رقم الحساب أو رقم الهاتف' : 'Account or Phone Number'}
                        </label>
                        <input
                          type="text"
                          placeholder={isRtl ? "مثال: 777123456 أو رقم الحساب" : "e.g., 777123456 or account number"}
                          value={newWalletAccount}
                          onChange={(e) => setNewWalletAccount(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#0A7D8C]"
                          dir="ltr"
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl bg-[#0A7D8C] hover:bg-[#086673] text-white text-xs font-bold cursor-pointer transition-all"
                        >
                          {isRtl ? 'حفظ طريقة الدفع' : 'Save Payment Method'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddWallet(false)}
                          className="px-3 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
                        >
                          {t('cancel', language)}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: المساعدة والأسئلة الشائعة (Help & FAQs) */}
      {activeModal === 'help' && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-black text-gray-900">{t('helpAndFaq', language)} 💡</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick WhatsApp Support banner */}
            <div className="mb-4 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-900">
                    {isRtl ? 'خدمة العملاء المباشرة' : 'Direct Customer Support'}
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    {isRtl ? 'دعم متواصل على مدار الساعة' : '24/7 continuous support'}
                  </p>
                </div>
              </div>
              <a
                href="https://wa.me/966551234567"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs"
              >
                {isRtl ? 'محادثة واتساب' : 'WhatsApp Chat'}
              </a>
            </div>

            {/* FAQs Accordion */}
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <h5 className="text-xs font-black text-gray-900 mb-1">
                  {isRtl ? 'كم يستغرق توصيل الطلب؟' : 'How long does delivery take?'}
                </h5>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isRtl 
                    ? 'يتم تجهيز الطلب وإرساله مع مندوبي حضرموت هايبر خلال مدة تتراوح بين 25 إلى 45 دقيقة حسب موقعك.'
                    : 'Orders are prepared and dispatched with our couriers within 25 to 45 minutes depending on your location.'}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <h5 className="text-xs font-black text-gray-900 mb-1">
                  {isRtl ? 'كيف أحصل على التوصيل المجاني؟' : 'How do I get free delivery?'}
                </h5>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isRtl 
                    ? 'يتوفر التوصيل المجاني تلقائياً عند تجاوز قيمة الطلب 150 ر.س أو عند استخدام كوبون التوصيل المجاني.'
                    : 'Free delivery applies automatically when your order exceeds 150 SAR or when using a free delivery coupon.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: الاعدادات (Settings) */}
      {activeModal === 'settings' && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-black text-gray-900">{t('settings', language)} ⚙️</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Language Selection */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-gray-800">
                  <Globe className="w-4 h-4 text-[#0A7D8C]" />
                  <span>{t('language', language)}</span>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 text-xs">
                  <button
                    onClick={() => {
                      if (onSetLanguage) onSetLanguage('ar');
                      else if (language !== 'ar' && onToggleLanguage) onToggleLanguage();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      language === 'ar' ? 'bg-[#0A7D8C] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    العربية
                  </button>
                  <button
                    onClick={() => {
                      if (onSetLanguage) onSetLanguage('en');
                      else if (language !== 'en' && onToggleLanguage) onToggleLanguage();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      language === 'en' ? 'bg-[#0A7D8C] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Notifications Switch */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-gray-800">
                  <Bell className="w-4 h-4 text-[#0A7D8C]" />
                  <span>{t('notifications', language)}</span>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    notificationsEnabled ? 'bg-[#0A7D8C] justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>

              {/* Delivery Address & Map Setting */}
              <div className="p-3.5 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-[#0A7D8C]">
                    <MapPin className="w-4 h-4 text-[#0A7D8C]" />
                    <span>{isRtl ? 'موقع التوصيل المحدد بالخريطة' : 'Delivery Location on Map'}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                    {isRtl ? 'دقيق ومحدد' : 'Pinpointed'}
                  </span>
                </div>
                <p className="text-xs text-gray-700 font-medium leading-snug line-clamp-2">
                  {deliveryAddress || address}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    onOpenLocationPicker?.();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0A7D8C] hover:bg-[#086673] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623]" />
                  <span>{isRtl ? 'فتح الخريطة لتحديد أو تعديل الموقع' : 'Open Map to Set Location'}</span>
                </button>
              </div>

              {/* Logout button */}
              <button
                onClick={() => {
                  setActiveModal(null);
                  onLogout();
                }}
                className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs flex items-center justify-center gap-2 border border-rose-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isRtl ? 'تسجيل الخروج' : t('logout', language)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: سياسة الخصوصية والاستخدام (Privacy & Terms) */}
      {activeModal === 'privacy' && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-black text-gray-900">{t('privacyPolicy', language)} 🛡️</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-gray-600 leading-relaxed space-y-3">
              {isRtl ? (
                <>
                  <p>
                    نحن في <strong>حضرموت هايبر</strong> نلتزم بأعلى معايير حماية البيانات وسرية معلومات عملائنا الكرام. يتم تشفير جميع المعاملات المالية ومعلومات البطاقات البنكية وفق أعلى المعايير المصرفية العالمية.
                  </p>
                  <p>
                    يتم استخدام بيانات الموقع الجغرافي فقط لتحديد أقرب فرع ولإيصال مندوب التوصيل إلى عنوانك بدقة متناهية وسرعة قياسية.
                  </p>
                  <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    جميع الحقوق محفوظة © {new Date().getFullYear()} حضرموت هايبر ماركت.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    At <strong>Hadramout Hyper</strong>, we adhere to the highest standards of data security and confidentiality for our valued clients. All financial transactions and payment data are encrypted under strict banking-grade safeguards.
                  </p>
                  <p>
                    Location data is solely used to identify the nearest fulfillment branch and route couriers directly and quickly to your verified address.
                  </p>
                  <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    All rights reserved © {new Date().getFullYear()} Hadramout Hyper Market.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
