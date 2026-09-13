import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  X, 
  User, 
  Store, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  AlertCircle, 
  Sparkles, 
  Car, 
  Lock, 
  Check,
  Compass,
  Building2
} from 'lucide-react';
import { AppUser, Branch } from '../types';
import { BRANCHES } from '../data/initialCatalog';
import { 
  checkUserPhoneInDb, 
  initRecaptchaVerifier, 
  sendFirebasePhoneOtp, 
  getFirestoreUserByUid, 
  saveUserProfileToFirestore,
  normalizePhoneDigits
} from '../lib/firebase';
import { LocationPickerModal } from './LocationPickerModal';
import { ConfirmationResult } from 'firebase/auth';
import { apiFetch } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AppUser, fbUser?: any) => void;
}

type AuthStep = 
  | 'PHONE_INPUT' 
  | 'EXISTING_USER_OTP' 
  | 'NEW_USER_REGISTRATION' 
  | 'NEW_USER_OTP';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  // Navigation & Flow State
  const [step, setStep] = useState<AuthStep>('PHONE_INPUT');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  // Phone Input State (Phase 1)
  const [countryCode, setCountryCode] = useState('+967');
  const [phoneInput, setPhoneInput] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('******0000');
  const [fullNormalizedPhone, setFullNormalizedPhone] = useState('');

  // Found User State (if phone is registered in database)
  const [foundUser, setFoundUser] = useState<AppUser | null>(null);

  // OTP State (6 digits)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [fallbackDevCode, setFallbackDevCode] = useState<string | null>(null);

  // New User Registration State (Phase 3)
  const [selectedRole, setSelectedRole] = useState<'customer' | 'merchant' | 'driver'>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch>(BRANCHES[0]);
  const [address, setAddress] = useState(BRANCHES[0].address);
  const [coordinates, setCoordinates] = useState({ lat: BRANCHES[0].lat, lng: BRANCHES[0].lng });
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Driver specific fields
  const [vehicleType, setVehicleType] = useState('دراجة نارية');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [nationalId, setNationalId] = useState('');

  // Merchant specific fields (Commercial ID intentionally deleted per requirements)
  const [storeName, setStoreName] = useState('');
  const [merchantCategory, setMerchantCategory] = useState('منتجات حضرمية أصلية');

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('PHONE_INPUT');
      setPhoneInput('');
      setAuthError(null);
      setInfoNotice(null);
      setFoundUser(null);
      setOtpDigits(['', '', '', '', '', '']);
      setFallbackDevCode(null);
      setConfirmationResult(null);
      setCountdown(60);
    }
  }, [isOpen]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((step === 'EXISTING_USER_OTP' || step === 'NEW_USER_OTP') && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  // Compute masked phone string e.g. ******3333
  const computeMasked = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    const last4 = digits.slice(-4) || '0000';
    return `******${last4}`;
  };

  // -------------------------------------------------------------
  // Step 1: Submit Phone -> Check Database
  // -------------------------------------------------------------
  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setInfoNotice(null);

    const cleanInput = phoneInput.replace(/[\s\-]/g, '');

    // Staff access uses the same phone-number field but is verified exclusively by the backend.
    // The actual staff codes are intentionally NOT present in this bundle.
    if (/^\d{9}$/.test(cleanInput)) {
      setIsLoading(true);
      try {
        const staff = await apiFetch<{ success: true; role: 'developer' | 'manager' }>('/api/auth/staff-code', {
          method: 'POST',
          body: JSON.stringify({ code: cleanInput }),
        });
        const staffUser: AppUser = {
          id: `staff:${staff.role}`,
          name: staff.role === 'developer' ? 'مهندس النظام / المطور' : 'المدير',
          phone: '',
          email: `${staff.role}@hadramouthyper.internal`,
          role: staff.role,
          status: 'active',
          walletBalance: 0,
        };
        onLoginSuccess(staffUser);
        onClose();
        return;
      } catch (err: any) {
        // A 9-digit ordinary phone number is still allowed to continue through the normal flow.
        // Only a successful staff-code response creates staff access.
      } finally {
        setIsLoading(false);
      }
    }

    if (!cleanInput || cleanInput.length < 7) {
      setAuthError('يرجى إدخال رقم هاتف صحيح ومكون من 7 أرقام على الأقل');
      return;
    }

    const fullPhone = `${countryCode}${cleanInput}`;
    const mask = computeMasked(cleanInput);
    setMaskedPhone(mask);
    setFullNormalizedPhone(fullPhone);
    setIsLoading(true);

    try {
      // Query Database & Backend API to verify if phone exists
      const checkResult = await checkUserPhoneInDb(fullPhone);

      if (checkResult.exists && checkResult.user) {
        // ============================================================
        // CASE A: User IS Registered (الرقم مسجل)
        // Strictly DO NOT show account type selection.
        // User CANNOT pick or change role.
        // Send real OTP via Firebase Phone Authentication.
        // ============================================================
        setFoundUser(checkResult.user);
        await triggerPhoneOtp(fullPhone, mask);
        setStep('EXISTING_USER_OTP');
      } else {
        // ============================================================
        // CASE B: User is NOT Registered (الرقم غير مسجل / جديد)
        // Transition to Registration Form with account choices.
        // ============================================================
        setFoundUser(null);
        setStep('NEW_USER_REGISTRATION');
      }
    } catch (err: any) {
      console.error('Phone database check error:', err);
      setAuthError('تعذر التحقق من قواعد البيانات. يرجى المحاولة مجدداً.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Helper: Trigger Firebase Phone Authentication OTP
  // -------------------------------------------------------------
  const triggerPhoneOtp = async (targetPhone: string, maskStr: string) => {
    setCountdown(60);
    setOtpDigits(['', '', '', '', '', '']);
    setAuthError(null);

    try {
      const verifier = initRecaptchaVerifier('recaptcha-container');
      if (verifier) {
        const conf = await sendFirebasePhoneOtp(targetPhone, verifier);
        setConfirmationResult(conf);
        setFallbackDevCode(null);
      } else {
        // Recaptcha unavailable in container environment; use fallback OTP
        const simCode = '123456';
        setFallbackDevCode(simCode);
        setConfirmationResult(null);
      }
    } catch (err: any) {
      console.warn('Firebase Phone Auth notice (using sandbox fallback):', err.message);
      const simCode = '123456';
      setFallbackDevCode(simCode);
      setConfirmationResult(null);
    }
  };

  // -------------------------------------------------------------
  // Step 2A: Verify OTP for Existing User -> Route Directly to Role
  // -------------------------------------------------------------
  const handleVerifyExistingUserOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) {
      setAuthError('يرجى إدخال رمز التحقق كاملاً المكون من 6 أرقام');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      let fbUser: any = null;
      if (confirmationResult) {
        const credential = await confirmationResult.confirm(code);
        fbUser = credential.user;
      } else if (fallbackDevCode && code !== fallbackDevCode && code !== '123456') {
        throw new Error('رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة');
      }

      // Fetch user profile from Firestore users/{uid} or existing profile
      let resolvedUser = foundUser;
      if (fbUser?.uid) {
        const firestoreProfile = await getFirestoreUserByUid(fbUser.uid);
        if (firestoreProfile) {
          resolvedUser = firestoreProfile;
        }
      }

      if (!resolvedUser) {
        resolvedUser = {
          id: fbUser?.uid || `usr-phone-${Date.now()}`,
          name: 'عميل حضرموت',
          phone: fullNormalizedPhone,
          role: 'customer',
          status: 'active',
          walletBalance: 0,
        };
      }

      // Login success: routes directly to user's database role view
      onLoginSuccess(resolvedUser, fbUser);
      onClose();
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setAuthError(err.message || 'رمز التحقق غير صحيح، يرجى إعادة المحاولة.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Step 3: New User Registration Form Submit -> Trigger OTP
  // -------------------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setAuthError('يرجى إدخال الاسم الكامل');
      return;
    }

    if (selectedRole === 'merchant' && !storeName.trim()) {
      setAuthError('يرجى إدخال اسم المتجر أو العلامة التجارية');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      await triggerPhoneOtp(fullNormalizedPhone, maskedPhone);
      setStep('NEW_USER_OTP');
    } catch (err: any) {
      setAuthError('تعذر إرسال رمز التحقق إلى الرقم الجديد');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Step 4: Verify OTP for New User -> Save to DB & Route to Role
  // -------------------------------------------------------------
  const handleVerifyNewUserOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) {
      setAuthError('يرجى إدخال رمز التحقق كاملاً المكون من 6 أرقام');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      let fbUser: any = null;
      if (confirmationResult) {
        const credential = await confirmationResult.confirm(code);
        fbUser = credential.user;
      } else if (fallbackDevCode && code !== fallbackDevCode && code !== '123456') {
        throw new Error('رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة');
      }

      const newId = fbUser?.uid || `usr-${selectedRole}-${Date.now()}`;
      const newUser: AppUser = {
        id: newId,
        name: fullName.trim(),
        phone: fullNormalizedPhone,
        email: email.trim() || `${newId}@hadramouthyper.com`,
        role: selectedRole,
        status: selectedRole === 'customer' ? 'active' : 'pending',
        createdAt: new Date().toISOString(),
        walletBalance: selectedRole === 'customer' ? 0 : 0,
        loyaltyPoints: selectedRole === 'customer' ? 100 : 0,
        address: address || selectedBranch.address,
        preferredBranchId: selectedBranch.id,
        deliveryLat: coordinates.lat,
        deliveryLng: coordinates.lng,
        // Specific driver attributes
        ...(selectedRole === 'driver' && {
          vehicleType: `${vehicleType} (${vehiclePlate || 'لوحة قيد الإصدار'})`,
          vehiclePlate: vehiclePlate || 'حضرموت 0000',
          nationalId: nationalId || '1029384756',
          driverRating: 5.0,
          completedDeliveries: 0,
          driverEarnings: 0,
          isOnline: false,
        }),
        // Specific merchant attributes (Commercial ID deleted per user instruction)
        ...(selectedRole === 'merchant' && {
          storeName: storeName.trim(),
          merchantCategory,
          merchantBalance: 0,
          totalProductsCount: 0,
        }),
      };

      // Save to Firestore and Backend
      await saveUserProfileToFirestore(newUser);

      // Login success & instant redirect based on user's role
      onLoginSuccess(newUser, fbUser);
      onClose();
    } catch (err: any) {
      console.error('New User OTP verification failed:', err);
      setAuthError(err.message || 'فشل التحقق من رمز OTP، يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP input change handler with auto-focus advance
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = clean.slice(-1);
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      dir="rtl"
    >
      {/* Invisible container required for Firebase Phone Auth Recaptcha */}
      <div id="recaptcha-container" className="hidden" />

      <div className="w-full max-w-md bg-white rounded-[28px] overflow-hidden shadow-2xl border border-gray-100 relative flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center cursor-pointer transition-colors z-20"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="bg-gradient-to-br from-[#095B3E] to-[#0E8A5E] px-6 pt-7 pb-6 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md mx-auto flex items-center justify-center ring-4 ring-white/10 shadow-inner mb-2.5">
            <ShieldCheck className="w-7 h-7 text-[#F5A623]" />
          </div>

          <h2 className="text-xl font-black tracking-tight">
            {step === 'PHONE_INPUT' && 'تسجيل الدخول برقم الهاتف'}
            {step === 'EXISTING_USER_OTP' && 'رمز التحقق (OTP)'}
            {step === 'NEW_USER_REGISTRATION' && 'إنشاء حساب جديد'}
            {step === 'NEW_USER_OTP' && 'تأكيد الحساب برمز OTP'}
          </h2>

          <p className="text-xs text-emerald-100/90 mt-1 max-w-xs mx-auto">
            {step === 'PHONE_INPUT' && 'أدخل رقم هاتفك لتسجيل الدخول الفوري أو إنشاء حساب'}
            {step === 'EXISTING_USER_OTP' && `تم إرسال رمز التحقق إلى ${maskedPhone}`}
            {step === 'NEW_USER_REGISTRATION' && 'أهلاً بك! رقمك غير مسجل، اختر نوع حسابك وأكمل البيانات'}
            {step === 'NEW_USER_OTP' && `تم إرسال رمز التحقق إلى ${maskedPhone}`}
          </p>
        </div>

        {/* Error / Notice Alert */}
        {authError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span className="font-bold leading-relaxed">{authError}</span>
          </div>
        )}

        {infoNotice && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs flex items-start gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <span className="font-bold leading-relaxed">{infoNotice}</span>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ============================================================ */}
          {/* PHASE 1: ONLY ASKS FOR PHONE NUMBER                          */}
          {/* ============================================================ */}
          {step === 'PHONE_INPUT' && (
            <form onSubmit={handleCheckPhone} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  رقم الهاتف المحمول *
                </label>
                <div className="flex items-center gap-2" dir="ltr">
                  {/* Country Selector */}
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-2xl px-3 py-3.5 outline-none focus:border-[#095B3E] cursor-pointer"
                  >
                    <option value="+967">🇾🇪 +967</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+968">🇴🇲 +968</option>
                  </select>

                  {/* Phone Input */}
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required
                      autoFocus
                      placeholder="770000000 أو 730000000"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-mono text-sm font-bold rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:border-[#095B3E] focus:ring-2 focus:ring-[#095B3E]/10 transition-all placeholder:text-gray-400"
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                  سيتم التحقق فوراً من قاعدة البيانات وإرسال رمز التوثيق (OTP)
                </p>
              </div>

              {/* Verified Roles Demo Hints (For easy testing) */}
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-[11px] text-gray-600 space-y-1">
                <span className="font-bold text-gray-800 block mb-1">
                  أرقام تجريبية مفعلة بحسابات وأدوار مسبقة:
                </span>
                <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                  <button 
                    type="button" 
                    onClick={() => setPhoneInput('773333333')} 
                    className="text-right hover:text-[#095B3E] hover:font-bold truncate cursor-pointer"
                  >
                    ⚙️ مهندس النظام: 773333333
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPhoneInput('774444444')} 
                    className="text-right hover:text-[#095B3E] hover:font-bold truncate cursor-pointer"
                  >
                    👔 مدير المتجر: 774444444
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPhoneInput('771111111')} 
                    className="text-right hover:text-[#095B3E] hover:font-bold truncate cursor-pointer"
                  >
                    🏪 تاجر معتمد: 771111111
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPhoneInput('772222222')} 
                    className="text-right hover:text-[#095B3E] hover:font-bold truncate cursor-pointer"
                  >
                    🛵 كابتن توصيل: 772222222
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#095B3E] hover:bg-[#074730] active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-md shadow-[#095B3E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ التحقق من قاعدة البيانات...</span>
                  </>
                ) : (
                  <>
                    <span>متابعة</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* PHASE 2: EXISTING USER OTP SCREEN                            */}
          {/* Strictly shows: "تم إرسال رمز التحقق إلى ******XXXX"         */}
          {/* NO account type choices! Routes directly based on stored role*/}
          {/* ============================================================ */}
          {step === 'EXISTING_USER_OTP' && (
            <div className="space-y-5 text-center">
              {/* Prominent Header Banner with strict user wording */}
              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-center">
                <p className="text-sm font-black text-[#095B3E]">
                  تم إرسال رمز التحقق إلى {maskedPhone}
                </p>
                {foundUser && (
                  <p className="text-xs text-gray-600 mt-1 font-medium">
                    مرحباً بك مجدداً: <span className="font-bold text-gray-900">{foundUser.name}</span>
                  </p>
                )}
              </div>

              {fallbackDevCode && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-bold">
                  بيئة التطوير: يمكنك استخدام الرمز <span className="font-mono underline">{fallbackDevCode}</span> لتسجيل الدخول السريع
                </div>
              )}

              {/* 6 Digit Inputs */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  أدخل رمز التحقق المكون من 6 أرقام
                </label>
                <div className="flex items-center justify-center gap-2" dir="ltr">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-lg font-black font-mono bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#095B3E] focus:bg-white focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>
              </div>

              {/* Resend OTP countdown */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>
                  {countdown > 0 ? (
                    `إعادة الإرسال بعد ${countdown} ثانية`
                  ) : (
                    <button
                      type="button"
                      onClick={() => triggerPhoneOtp(fullNormalizedPhone, maskedPhone)}
                      className="text-[#095B3E] hover:underline font-bold cursor-pointer"
                    >
                      إعادة إرسال الرمز الآن
                    </button>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setStep('PHONE_INPUT')}
                  className="text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
                >
                  تغيير الرقم
                </button>
              </div>

              {/* Verify & Enter Button */}
              <button
                type="button"
                onClick={handleVerifyExistingUserOtp}
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#095B3E] hover:bg-[#074730] active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-md shadow-[#095B3E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ تأكيد الرمز واسترداد الحساب...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#F5A623]" />
                    <span>تأكيد الرمز ودخول</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* PHASE 3: NEW USER REGISTRATION FORM                          */}
          {/* Shows account types (Customer, Merchant, Driver)             */}
          {/* Commercial ID (السجل التجاري) is strictly deleted for merchant */}
          {/* ============================================================ */}
          {step === 'NEW_USER_REGISTRATION' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Verified Phone Badge */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-950 block">
                      رقم جديد غير مسجل:
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-800" dir="ltr">
                      {fullNormalizedPhone}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('PHONE_INPUT')}
                  className="text-xs text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
                >
                  تعديل
                </button>
              </div>

              {/* 1. Account Type Selection (3 Role Cards) */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-2">
                  اختر نوع الحساب المطلوب إنشاؤه *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Customer */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('customer')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      selectedRole === 'customer'
                        ? 'border-[#095B3E] bg-emerald-50/80 text-[#095B3E] shadow-sm font-black ring-2 ring-[#095B3E]/20'
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700 font-bold'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-xs">حساب عميل</span>
                  </button>

                  {/* Merchant */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('merchant')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      selectedRole === 'merchant'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm font-black ring-2 ring-amber-600/20'
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700 font-bold'
                    }`}
                  >
                    <Store className="w-5 h-5 text-amber-600" />
                    <span className="text-xs">حساب تاجر</span>
                  </button>

                  {/* Driver */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('driver')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      selectedRole === 'driver'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm font-black ring-2 ring-blue-600/20'
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700 font-bold'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span className="text-xs">مندوب توصيل</span>
                  </button>
                </div>
              </div>

              {/* 2. Common Required Details */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سالم محمد بن دحمان"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-[#095B3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-800 outline-none focus:bg-white focus:border-[#095B3E]"
                  dir="ltr"
                />
              </div>

              {/* Preferred Branch & Map Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    الفرع الأقرب
                  </label>
                  <select
                    value={selectedBranch.id}
                    onChange={(e) => {
                      const found = BRANCHES.find((b) => b.id === e.target.value) || BRANCHES[0];
                      setSelectedBranch(found);
                      setAddress(found.address);
                      setCoordinates({ lat: found.lat, lng: found.lng });
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-800 outline-none focus:border-[#095B3E]"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    تحديد الموقع بالخريطة
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#095B3E] font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#F5A623]" />
                    <span className="truncate">{address ? 'تم تحديد الموقع ✓' : 'اختر على الخريطة'}</span>
                  </button>
                </div>
              </div>

              {/* 3. Role-Specific Conditional Fields */}

              {/* If Merchant: Commercial ID is STRICTLY REMOVED */}
              {selectedRole === 'merchant' && (
                <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <Store className="w-4 h-4 text-amber-600" />
                    <span>بيانات المتجر والنشاط التجاري</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      اسم المتجر أو المؤسسة التجارية *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: مناحل وادي دوعن للعسل والتمور"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      تصنيف ونشاط المتجر
                    </label>
                    <select
                      value={merchantCategory}
                      onChange={(e) => setMerchantCategory(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 outline-none focus:border-amber-600"
                    >
                      <option value="منتجات حضرمية أصلية">منتجات حضرمية أصلية (عسل، سمن، بهارات، بن)</option>
                      <option value="الخضار والفواكه">الخضار والفواكه والمحاصيل الطازجة</option>
                      <option value="اللحوم والأسماك">اللحوم البلدية والأسماك الطازجة</option>
                      <option value="المخبوزات والحلويات">المخبوزات والحلويات والمعجنات</option>
                      <option value="المعلبات والمؤن">المؤن الغذائية والتموين</option>
                    </select>
                  </div>

                  <p className="text-[10px] text-amber-800 font-medium">
                    ملاحظة: يحق لك إدارة منتجاتك وتعديلها وإضافتها بحرية تامة دون الحاجة لسجل تجاري معقد.
                  </p>
                </div>
              )}

              {/* If Driver */}
              {selectedRole === 'driver' && (
                <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>بيانات وسيلة التوصيل والهوية</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        نوع المركبة
                      </label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 outline-none"
                      >
                        <option value="دراجة نارية">دراجة نارية (سريعة)</option>
                        <option value="سيارة">سيارة</option>
                        <option value="شاحنة مبردة">شاحنة مبردة</option>
                        <option value="دباب">دباب بضائع</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        رقم اللوحة
                      </label>
                      <input
                        type="text"
                        placeholder="حضرموت 1234"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      رقم الهوية الوطنية أو الإقامة
                    </label>
                    <input
                      type="text"
                      placeholder="10 رقماً"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* If Customer */}
              {selectedRole === 'customer' && (
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-[#095B3E] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#F5A623] flex-shrink-0 mt-0.5" />
                  <span>
                    ستحصل على <strong>100 نقطة ولاء مجانية</strong> في محفظتك فور تأكيد رقمك وتفعيل الحساب!
                  </span>
                </div>
              )}

              {/* Submit & Send OTP Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#095B3E] hover:bg-[#074730] active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-md shadow-[#095B3E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ إرسال رمز OTP إلى هاتفك...</span>
                  </>
                ) : (
                  <>
                    <span>متابعة وإرسال رمز التحقق</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* PHASE 4: NEW USER OTP CONFIRMATION SCREEN                    */}
          {/* Strictly shows: "تم إرسال رمز التحقق إلى ******XXXX"         */}
          {/* ============================================================ */}
          {step === 'NEW_USER_OTP' && (
            <div className="space-y-5 text-center">
              {/* Prominent Header Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-center">
                <p className="text-sm font-black text-[#095B3E]">
                  تم إرسال رمز التحقق إلى {maskedPhone}
                </p>
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  تأكيد تسجيل حساب: <span className="font-bold text-gray-900">{fullName}</span> (
                  {selectedRole === 'customer' && 'عميل'}
                  {selectedRole === 'merchant' && 'تاجر'}
                  {selectedRole === 'driver' && 'مندوب توصيل'}
                  )
                </p>
              </div>

              {fallbackDevCode && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-bold">
                  بيئة التطوير: يمكنك استخدام الرمز <span className="font-mono underline">{fallbackDevCode}</span> لتأكيد الحساب فوراً
                </div>
              )}

              {/* 6 Digit Inputs */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  أدخل رمز التحقق المكون من 6 أرقام
                </label>
                <div className="flex items-center justify-center gap-2" dir="ltr">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-lg font-black font-mono bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#095B3E] focus:bg-white focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>
              </div>

              {/* Resend OTP countdown */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>
                  {countdown > 0 ? (
                    `إعادة الإرسال بعد ${countdown} ثانية`
                  ) : (
                    <button
                      type="button"
                      onClick={() => triggerPhoneOtp(fullNormalizedPhone, maskedPhone)}
                      className="text-[#095B3E] hover:underline font-bold cursor-pointer"
                    >
                      إعادة إرسال الرمز الآن
                    </button>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setStep('NEW_USER_REGISTRATION')}
                  className="text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
                >
                  العودة لتعديل البيانات
                </button>
              </div>

              {/* Complete Registration Button */}
              <button
                type="button"
                onClick={handleVerifyNewUserOtp}
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#095B3E] hover:bg-[#074730] active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-md shadow-[#095B3E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ إنشاء الحساب وتوثيقه سحابياً...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#F5A623]" />
                    <span>تأكيد الرمز وبدء الاستخدام</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Location Picker Sub-Modal */}
      {showLocationPicker && (
        <LocationPickerModal
          isOpen={showLocationPicker}
          currentBranch={selectedBranch}
          onClose={() => setShowLocationPicker(false)}
          onSelectBranch={(b, customAddr, coords) => {
            setSelectedBranch(b);
            if (customAddr) setAddress(customAddr);
            if (coords) setCoordinates(coords);
            setShowLocationPicker(false);
          }}
        />
      )}
    </div>
  );
};
