import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Store, 
  User, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Building2, 
  FileText, 
  Car,
  Sparkles,
  ArrowLeft,
  Clock,
  Compass,
  Navigation
} from 'lucide-react';
import { AppUser, UserRole, Branch } from '../types';
import { BRANCHES } from '../data/initialCatalog';
import { LocationPickerModal } from './LocationPickerModal';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (newUser: AppUser) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<'driver' | 'merchant' | 'customer'>('driver');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Location via interactive map inside app
  const [selectedBranch, setSelectedBranch] = useState<Branch>(BRANCHES[0]);
  const [selectedBranchId, setSelectedBranchId] = useState(BRANCHES[0].id);
  const [address, setAddress] = useState(BRANCHES[0].address);
  const [coordinates, setCoordinates] = useState({ lat: BRANCHES[0].lat, lng: BRANCHES[0].lng });
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Driver fields
  const [vehicleType, setVehicleType] = useState('سيارة');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [nationalId, setNationalId] = useState('');

  // Merchant fields
  const [storeName, setStoreName] = useState('');
  const [merchantCategory, setMerchantCategory] = useState('منتجات حضرمية أصلية');

  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<AppUser | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const isPending = selectedRole === 'driver' || selectedRole === 'merchant';
    const newId = `u-${selectedRole}-${Date.now()}`;
    const newUser: AppUser = {
      id: newId,
      name,
      phone,
      email: email || `${newId}@hadramouthyper.com`,
      role: selectedRole,
      status: isPending ? 'pending' : 'active',
      createdAt: new Date().toISOString().split('T')[0],
      walletBalance: 0,
      address,
      deliveryLat: coordinates.lat,
      deliveryLng: coordinates.lng,
      preferredBranchId: selectedBranchId,
      ...(selectedRole === 'driver' && {
        vehicleType: `${vehicleType} (${vehiclePlate || 'لوحة قيد الإصدار'})`,
        vehiclePlate: vehiclePlate || 'ر ق م 0000',
        nationalId: nationalId || '1029384756',
        driverRating: 5.0,
        completedDeliveries: 0,
        driverEarnings: 0,
        isOnline: false,
        currentBranchId: selectedBranchId,
      }),
      ...(selectedRole === 'merchant' && {
        storeName: storeName || `متجر ${name}`,
        merchantCategory: merchantCategory,
        merchantBalance: 0,
        totalProductsCount: 0,
      }),
      ...(selectedRole === 'customer' && {
        loyaltyPoints: 100, // Welcome gift
        totalOrdersCount: 0,
      }),
    };

    onRegisterSuccess(newUser);
    setCreatedUser(newUser);

    if (isPending) {
      setIsSubmittedSuccess(true);
    } else {
      onClose();
    }
  };

  if (isSubmittedSuccess && createdUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 p-6 text-center text-right">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-lg font-black text-gray-900 text-center mb-2">
            تم تسجيل طلبك بنجاح وبانتظار اعتماد المدير العام!
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed text-center mb-4">
            وفقاً لسياسة حضرموت هايبر، لا يتم تفعيل حسابات{' '}
            <span className="font-bold text-gray-900">
              {createdUser.role === 'merchant' ? 'التجار والشركاء' : 'مناديب التوصيل'}
            </span>{' '}
            إلا بعد مراجعة بيانات الاعتماد والموافقة الرسمية من قبل <span className="font-bold text-emerald-700">المدير العام للمتجر</span>.
          </p>
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 mb-6 text-right space-y-1">
            <p className="font-bold">📋 بيانات الطلب المسجل:</p>
            <p>• الاسم: {createdUser.name}</p>
            <p>• الهاتف: {createdUser.phone}</p>
            <p>• الحالة الحالية: <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded font-black text-[10px]">قيد المراجعة والاعتماد (معلق)</span></p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer transition-all"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#095B3E] to-[#0E8A5E] p-5 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-[#F5A623] shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black">بوابة التسجيل والانضمام لعائلة الهايبر</h3>
              <p className="text-xs text-emerald-100">سجل كـ مندوب توصيل، تاجر معتمد، أو عميل مميز</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Picker Selector Tabs */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <label className="block text-xs font-bold text-gray-700 mb-2">اختر نوع الحساب المطلوب تسجيله:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('driver')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'driver'
                  ? 'bg-blue-50 border-blue-500 text-blue-800 font-black shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Truck className={`w-5 h-5 ${selectedRole === 'driver' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-xs">مندوب توصيل</span>
              <span className="text-[10px] text-blue-600/80 font-bold">أرباح فورية</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('merchant')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'merchant'
                  ? 'bg-amber-50 border-amber-500 text-amber-800 font-black shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Store className={`w-5 h-5 ${selectedRole === 'merchant' ? 'text-amber-600' : 'text-gray-400'}`} />
              <span className="text-xs">تاجر أو متجر</span>
              <span className="text-[10px] text-amber-600/80 font-bold">إضافة منتجاتك</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('customer')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'customer'
                  ? 'bg-emerald-50 border-emerald-500 text-[#0E8A5E] font-black shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className={`w-5 h-5 ${selectedRole === 'customer' ? 'text-[#0E8A5E]' : 'text-gray-400'}`} />
              <span className="text-xs">حساب عميل</span>
              <span className="text-[10px] text-emerald-600/80 font-bold">تسوق وكاشباك</span>
            </button>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-right">
          {/* General info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {selectedRole === 'merchant' ? 'اسم صاحب المتجر أو المسؤول' : 'الاسم الكامل'} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: سالم باحشوان"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-[#0E8A5E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">رقم الجوال النشط *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 50 000 0000"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-[#0E8A5E]"
              />
            </div>
          </div>

          {/* تحديد الموقع الجغرافي بالخريطة التفاعلية داخل التطبيق */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-50/90 to-teal-50/60 rounded-2xl border border-emerald-200 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#0E8A5E] font-extrabold text-xs">
                <Compass className="w-4 h-4 text-[#0E8A5E] animate-pulse" />
                <span>
                  {selectedRole === 'customer'
                    ? 'تحديد عنوان وموقع التوصيل بالخريطة'
                    : selectedRole === 'merchant'
                    ? 'تحديد موقع المتجر / المستودع بالخريطة'
                    : 'تحديد منطقة ونطاق تمركز الكابتن بالخريطة'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white/80 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-start gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0E8A5E] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2">{address}</p>
                <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                  <span>الفرع الأقرب:</span>
                  <span className="font-bold text-[#0E8A5E]">{selectedBranch.name} ({selectedBranch.city})</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0E8A5E] hover:bg-[#095B3E] active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-800/20 transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623]" />
              <span>فتح الخريطة داخل التطبيق لتحديد الموقع بدقة</span>
            </button>
          </div>

          {/* Conditional Driver Fields */}
          {selectedRole === 'driver' && (
            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>بيانات ومعلومات مركبة التوصيل</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">نوع المركبة</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 outline-none"
                  >
                    <option value="سيارة سيدان (تويوتا يارس / اكسنت)">سيارة سيدان (يارس / اكسنت)</option>
                    <option value="دراجة نارية / سكوتر توصيل سريع">دراجة نارية / سكوتر توصيل</option>
                    <option value="فان تبريد بضائع ومقاضي">فان مبرد للمقاضي واللحوم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">رقم اللوحة / الاستمارة</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="مثال: ر ق م 5544"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">رقم الهوية / الإقامة</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="10 رقماً"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">الفرع الرئيسي التابع له</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 outline-none"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  صلاحياتك كمندوب: ستتمكن فور التسجيل من تصفح كافة طلبات التوصيل الجاهزة، معرفة عنوان الاستلام وموقع العميل، وقيمة الأجرة التي ستحصل عليها فور التسليم!
                </span>
              </div>
            </div>
          )}

          {/* Conditional Merchant Fields */}
          {selectedRole === 'merchant' && (
            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <Store className="w-4 h-4 text-amber-600" />
                <span>بيانات المتجر والنشاط التجاري</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">اسم المتجر أو العلامة التجارية *</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="مثال: مناحل وادي دوعن للعسل"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">تصنيف منتجات المتجر</label>
                  <select
                    value={merchantCategory}
                    onChange={(e) => setMerchantCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 outline-none"
                  >
                    <option value="منتجات حضرمية أصلية">منتجات حضرمية أصلية (عسل، سمن، بهارات، بن)</option>
                    <option value="الخضار والفواكه">الخضار والفواكه والمحاصيل الطازجة</option>
                    <option value="اللحوم والأسماك">اللحوم البلدية والأسماك الطازجة</option>
                    <option value="المخبوزات والحلويات">المخبوزات والحلويات والمعجنات</option>
                    <option value="المعلبات والمؤن">المؤن الغذائية والتموين</option>
                  </select>
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  قاعدة الصلاحيات الصارمة: يحق لك إضافة وتعديل وتسعير المنتجات التي تضيفها أنت فقط، ولن تتمكن من تعديل أو حذف أي منتج تابع للمركز أو للتجار الآخرين.
                </span>
              </div>
            </div>
          )}

          {/* Conditional Customer Fields */}
          {selectedRole === 'customer' && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-[#095B3E] space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F5A623]" />
                <span>مرحباً بك في تجربة تسوق حضرموت هايبر الفائقة</span>
              </p>
              <p className="text-[11px] text-gray-600">
                ستحصل فور تسجيلك على 100 نقطة ولاء ترحيبية، وإمكانية تتبع المندوب ومعرفة وقته ورقم لوحته والتواصل معه مباشرة عبر الاتصال أو المحادثة الفورية.
              </p>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#0E8A5E] hover:bg-[#095B3E] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-800/20 cursor-pointer active:scale-98 transition-all"
            >
              <span>إتمام التسجيل والدخول الفوري للحساب</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* In-App Interactive Map Modal */}
        {isMapModalOpen && (
          <LocationPickerModal
            isOpen={isMapModalOpen}
            currentBranch={selectedBranch}
            language="ar"
            onClose={() => setIsMapModalOpen(false)}
            onSelectBranch={(branch, customAddress, coords) => {
              setSelectedBranch(branch);
              setSelectedBranchId(branch.id);
              if (customAddress) {
                setAddress(customAddress);
              }
              if (coords) {
                setCoordinates(coords);
              }
              setIsMapModalOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
};
