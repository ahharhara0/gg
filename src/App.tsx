import React, { useState, useEffect } from 'react';
import { 
  BRANCHES, 
  PRODUCTS, 
  NOTIFICATIONS, 
  DEVELOPER_INFO,
  APP_USERS,
  INITIAL_COMPLAINTS,
  INITIAL_DRIVER_AVAILABLE_ORDERS,
  CATEGORIES,
  PROMO_BANNERS
} from './data/initialCatalog';
import { 
  Product, 
  CartItem, 
  Branch, 
  Order, 
  Recipe, 
  NotificationItem,
  AppUser,
  ComplaintItem,
  OrderStatus,
  CategoryConfig,
  BannerConfig,
  PaymentMethodConfig,
  AppLanguage
} from './types';
import { INITIAL_PAYMENT_METHODS } from './data/paymentMethodsData';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, syncOrCreateFirestoreUserProfile } from './lib/firebase';
import { apiFetch } from './lib/api';
import {
  seedInitialFirestoreData,
  subscribeToProducts,
  subscribeToCategories,
  subscribeToPaymentMethods,
  dbSaveProduct,
  dbDeleteProduct,
  dbSaveCategories,
  dbSavePaymentMethods,
  dbDeletePaymentMethod,
  subscribeToOrders,
} from './lib/firestoreService';

import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { ProfileView } from './components/ProfileView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SearchScreenModal } from './components/SearchScreenModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { LiveTrackingView } from './components/LiveTrackingView';
import { WalletView } from './components/WalletView';
import { WaitingRoomModal } from './components/WaitingRoomModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { LocationPickerModal } from './components/LocationPickerModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ArchitectureDocsView } from './components/ArchitectureDocsView';
import { RoleSwitcherBar } from './components/RoleSwitcherBar';
import { RegistrationModal } from './components/RegistrationModal';
import { CourierDashboardView } from './components/CourierDashboardView';
import { MerchantDashboardView } from './components/MerchantDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { DeveloperDashboardView } from './components/DeveloperDashboardView';
import { DeveloperControlCenter } from './modules/developer/DeveloperControlCenter';
import { AdminControlCenter } from './modules/admin/AdminControlCenter';
import { CustomerSupportView } from './components/CustomerSupportView';
import { PoliciesModal } from './components/PoliciesModal';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { PendingApprovalView } from './components/PendingApprovalView';
import { 
  canAccessAdminCenter, 
  canAccessDeveloperCenter, 
  canAccessDriverDashboard, 
  canAccessMerchantDashboard,
  canAccessSupportCenter,
  subscribeToPermissions 
} from './modules/auth/permissions';

export default function App() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'deals' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('hadramout_lang') as AppLanguage;
      if (saved === 'ar' || saved === 'en') return saved;
    } catch {}
    return 'ar';
  });

  useEffect(() => {
    try {
      localStorage.setItem('hadramout_lang', language);
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    } catch {}
  }, [language]);

  // Restore an active server-side Staff Access session after a page/app reload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiFetch<{ success: true; user: AppUser }>('/api/auth/me');
        if (cancelled || !result?.user?.id?.startsWith('staff:')) return;
        setCurrentUser(result.user);
        setUserPhone('');
        setActiveRoleView(result.user.role === 'developer' ? 'developer' : result.user.role === 'manager' ? 'admin' : null);
      } catch {
        // No active staff session — continue as normal customer/ Firebase user.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // User Accounts & Role-Based Access Control (RBAC)
  // In production, app starts as customer/guest unless a verified Firebase session exists.
  const defaultInitialUser = APP_USERS.find((u) => u.role === 'customer') || APP_USERS[0];
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser>(defaultInitialUser);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [activeRoleView, setActiveRoleView] = useState<'driver' | 'merchant' | 'admin' | 'developer' | 'support' | null>(null);
  const [, setPermissionsRevision] = useState<number>(0);

  useEffect(() => {
    const unsub = subscribeToPermissions(() => {
      setPermissionsRevision((r) => r + 1);
    });
    return () => unsub();
  }, []);

  // Firebase Real Auth State Listener & Session Persistence
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const syncedUser = await syncOrCreateFirestoreUserProfile(fbUser);
          setCurrentUser(syncedUser);
          setUserPhone(syncedUser.phone || syncedUser.email || fbUser.displayName || 'مستخدم مسجل');
        } catch (err) {
          console.warn('Firebase user sync listener:', err);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Dynamic products & categories & banners & payment methods & complaints & driver orders
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<CategoryConfig[]>(CATEGORIES);
  const [banners, setBanners] = useState<BannerConfig[]>(PROMO_BANNERS);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(INITIAL_PAYMENT_METHODS);
  const [driverAvailableOrders, setDriverAvailableOrders] = useState<Order[]>(INITIAL_DRIVER_AVAILABLE_ORDERS);
  const [complaints, setComplaints] = useState<ComplaintItem[]>(INITIAL_COMPLAINTS);

  // Modals & Overlay Screens
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState<boolean>(false);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [showWallet, setShowWallet] = useState<boolean>(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showDocs, setShowDocs] = useState<boolean>(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState<boolean>(false);
  const [policiesInitialTab, setPoliciesInitialTab] = useState<'privacy' | 'return'>('privacy');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Business State
  const [currentBranch, setCurrentBranch] = useState<Branch>(BRANCHES[0]);
  const [deliveryAddress, setDeliveryAddress] = useState<string>(BRANCHES[0].address);
  const [userPhone, setUserPhone] = useState<string>('+966 55 123 4567');
  const [walletBalance, setWalletBalance] = useState<number>(125.0);
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS);
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: products[0] || PRODUCTS[0], quantity: 1 },
    { product: products[3] || PRODUCTS[3], quantity: 2 },
  ]);

  // Checkout intermediate values
  const [appliedPromoDiscount, setAppliedPromoDiscount] = useState<number>(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');

  // Orders & Active Tracking
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1092',
      createdAt: '2026-09-08 18:30',
      items: [
        { product: products[1] || PRODUCTS[1], quantity: 2 },
        { product: products[2] || PRODUCTS[2], quantity: 1 },
      ],
      subtotal: 199.3,
      discount: 20.0,
      tax: 26.89,
      deliveryFee: 0,
      total: 206.19,
      status: 'DELIVERED',
      deliveryAddress: 'الرياض، حي النرجس، شارع أنس بن مالك',
      paymentMethod: 'محفظة فلوسك (بنك الكريمي)',
      branchName: 'فرع الهايبر الرئيسي - حي النرجس',
      estimatedDeliveryMinutes: 0,
    },
  ]);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);

  // Unread notifications count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Real-time Firestore synchronization on mount
  useEffect(() => {
    // Seed and listen to Firestore collections
    seedInitialFirestoreData();

    const unsubProducts = subscribeToProducts((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) {
        setProducts(liveProducts);
      }
    });

    const unsubCategories = subscribeToCategories((liveCategories) => {
      if (liveCategories && liveCategories.length > 0) {
        setCategories(liveCategories);
      }
    });

    const unsubPayments = subscribeToPaymentMethods((liveMethods) => {
      if (liveMethods && liveMethods.length > 0) {
        setPaymentMethods(liveMethods);
      }
    });

    const unsubOrders = subscribeToOrders((liveOrders) => {
      if (liveOrders && liveOrders.length > 0) {
        setOrders(liveOrders);
        setDriverAvailableOrders(liveOrders);
      }
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubPayments();
      unsubOrders();
    };
  }, []);

  // Language Toggle
  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  // Complaint Management Handlers for Customer Support and Admin
  const handleReplyComplaint = (id: string, reply: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status: 'in_progress',
            adminReply: reply,
            replyText: reply,
            updatedAt: 'الآن',
            replies: [
              ...(c.replies || []),
              {
                id: `rep-${Date.now()}`,
                sender: currentUser.name || 'خدمة العملاء',
                senderRole: currentUser.role === 'support' ? 'support' : 'admin',
                message: reply,
                timestamp: 'الآن',
              },
            ],
          };
        }
        return c;
      })
    );
  };

  const handleResolveComplaint = (id: string) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'resolved', updatedAt: 'الآن' } : c))
    );
  };

  // Role switching handlers
  const handleSwitchUser = (user: AppUser) => {
    setCurrentUser(user);
    if (user.role === 'customer') {
      setActiveRoleView(null);
    } else if (user.role === 'developer' || user.role === 'super_admin') {
      setActiveRoleView('developer');
    } else if (
      user.role === 'admin' ||
      user.role === 'manager' ||
      user.role === 'operations' ||
      user.role === 'finance'
    ) {
      setActiveRoleView('admin');
    } else if (user.role === 'support') {
      setActiveRoleView('support');
    } else if (user.role === 'driver') {
      setActiveRoleView('driver');
    } else if (user.role === 'merchant') {
      setActiveRoleView('merchant');
    } else {
      setActiveRoleView(null);
    }
  };

  const handleToggleDashboard = () => {
    if (activeRoleView) {
      setActiveRoleView(null);
    } else if (currentUser.role === 'developer' || currentUser.role === 'super_admin') {
      setActiveRoleView('developer');
    } else if (
      currentUser.role === 'admin' ||
      currentUser.role === 'manager' ||
      currentUser.role === 'operations' ||
      currentUser.role === 'finance'
    ) {
      setActiveRoleView('admin');
    } else if (currentUser.role === 'support') {
      setActiveRoleView('support');
    } else if (currentUser.role === 'driver') {
      setActiveRoleView('driver');
    } else if (currentUser.role === 'merchant') {
      setActiveRoleView('merchant');
    }
  };

  const handleRegisterSuccess = (newUser: AppUser) => {
    setAllUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    if (newUser.address) {
      setDeliveryAddress(newUser.address);
    }
    if (newUser.preferredBranchId) {
      const b = BRANCHES.find((br) => br.id === newUser.preferredBranchId);
      if (b) setCurrentBranch(b);
    }
    if (newUser.role === 'driver') {
      setActiveRoleView('driver');
    } else if (newUser.role === 'merchant') {
      setActiveRoleView('merchant');
    } else {
      setActiveRoleView(null);
    }
  };

  // Dedicated Login Success Handler with Direct Role-Based Routing
  const handleLoginSuccess = (user: AppUser, fbUser?: any) => {
    setAllUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id || u.phone === user.phone);
      return exists ? prev.map((u) => (u.id === user.id ? user : u)) : [user, ...prev];
    });
    setCurrentUser(user);
    setUserPhone(user.phone || fbUser?.phoneNumber || user.name);
    if (user.walletBalance !== undefined) {
      setWalletBalance(user.walletBalance);
    }
    if (user.address) {
      setDeliveryAddress(user.address);
    }
    if (user.preferredBranchId) {
      const b = BRANCHES.find((br) => br.id === user.preferredBranchId);
      if (b) setCurrentBranch(b);
    }

    // Role-based routing directly to the user's interface:
    // عميل → واجهة العميل.
    // تاجر → لوحة التاجر.
    // مندوب → لوحة المندوب.
    // مدير/مشرف → لوحة الإدارة حسب الصلاحيات.
    // مهندس/جذر → لوحة المطور.
    if (user.role === 'customer') {
      setActiveRoleView(null);
      setActiveTab('home');
    } else if (user.role === 'merchant') {
      setActiveRoleView('merchant');
    } else if (user.role === 'driver') {
      setActiveRoleView('driver');
    } else if (
      user.role === 'admin' ||
      user.role === 'manager' ||
      user.role === 'super_admin' ||
      user.role === 'operations' ||
      user.role === 'finance'
    ) {
      setActiveRoleView('admin');
    } else if (user.role === 'developer') {
      setActiveRoleView('developer');
    } else if (user.role === 'support') {
      setActiveRoleView('support');
    } else {
      setActiveRoleView(null);
    }
  };

  // Driver Actions
  const handleAcceptDriverOrder = (orderId: string) => {
    if (currentUser.role === 'driver' && currentUser.status !== 'active') {
      alert('تنبيه أمني: حساب مندوب التوصيل معلّق وبانتظار موافقة المدير العام. لا يمكن استلام طلبات.');
      return;
    }
    const updatedAvailable = driverAvailableOrders.map((o) =>
      o.id === orderId
        ? { ...o, status: 'ON_THE_WAY' as OrderStatus, driverName: currentUser.name }
        : o
    );
    setDriverAvailableOrders(updatedAvailable);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'ON_THE_WAY' as OrderStatus, driverName: currentUser.name }
          : o
      )
    );
    if (activeTrackingOrder && activeTrackingOrder.id === orderId) {
      setActiveTrackingOrder((prev) =>
        prev
          ? { ...prev, status: 'ON_THE_WAY', driverName: currentUser.name }
          : null
      );
    }
    setCurrentUser((prev) => ({
      ...prev,
      driverEarnings: (prev.driverEarnings || 176) + 25,
      driverCompletedTrips: (prev.driverCompletedTrips || 14) + 1,
    }));
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    if (currentUser.role === 'driver' && currentUser.status !== 'active') {
      alert('تنبيه أمني: حساب مندوب التوصيل معلّق وبانتظار موافقة المدير العام.');
      return;
    }
    setDriverAvailableOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (activeTrackingOrder && activeTrackingOrder.id === orderId) {
      setActiveTrackingOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Product Actions (Integrated with Firestore)
  const handleAddProduct = (newProd: Product) => {
    if (currentUser.role === 'merchant' && currentUser.status !== 'active') {
      alert('تنبيه أمني: حساب المتجر قيد المراجعة والمعاينة، ولا يمكن إضافة أي منتج إلا بعد اعتماد الحساب من المدير العام.');
      return;
    }
    setProducts((prev) => [newProd, ...prev]);
    dbSaveProduct(newProd);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    if (currentUser.role === 'merchant' && currentUser.status !== 'active') {
      alert('تنبيه أمني: لا يمكن تعديل المنتجات؛ حساب المتجر غير معتمد حتى موافقة المدير العام.');
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    );
    dbSaveProduct(updatedProd);
  };

  const handleDeleteProduct = (productId: string) => {
    if (currentUser.role === 'merchant' && currentUser.status !== 'active') {
      alert('تنبيه أمني: لا يمكن حذف المنتجات؛ حساب المتجر غير معتمد حتى موافقة المدير العام.');
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    dbDeleteProduct(productId);
  };

  // Admin Actions (Users, Categories, Payment Methods)
  const handleUpdateUser = (updatedUser: AppUser) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser.id === userId) {
      const fallback = allUsers.find((u) => u.id !== userId) || APP_USERS[0];
      setCurrentUser(fallback);
      if (fallback.role !== 'customer') setActiveRoleView(fallback.role);
      else setActiveRoleView(null);
    }
  };

  const handleAddUser = (newUser: AppUser) => {
    setAllUsers((prev) => [newUser, ...prev]);
  };

  const handleUpdateCategories = (cats: CategoryConfig[]) => {
    setCategories(cats);
    dbSaveCategories(cats);
  };

  const handleUpdateBanners = (banns: BannerConfig[]) => {
    setBanners(banns);
  };

  const handleUpdatePaymentMethods = (methods: PaymentMethodConfig[]) => {
    setPaymentMethods(methods);
    dbSavePaymentMethods(methods);
  };

  const handleUpdateComplaint = (
    complaintOrId: string | ComplaintItem,
    status?: 'open' | 'in_progress' | 'resolved',
    adminResponse?: string
  ) => {
    if (typeof complaintOrId === 'object') {
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintOrId.id ? complaintOrId : c))
      );
    } else {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintOrId
            ? {
                ...c,
                status: status || c.status,
                adminResponse: adminResponse || c.adminResponse,
              }
            : c
        )
      );
    }
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    setDriverAvailableOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    if (activeTrackingOrder && activeTrackingOrder.id === updatedOrder.id) {
      setActiveTrackingOrder(updatedOrder);
    }
  };

  const handleResetData = () => {
    setAllUsers([]);
    setCurrentUser(defaultInitialUser);
    setProducts(PRODUCTS);
    setDriverAvailableOrders(INITIAL_DRIVER_AVAILABLE_ORDERS);
    setComplaints(INITIAL_COMPLAINTS);
    setCategories(CATEGORIES);
    setBanners(PROMO_BANNERS);
    setPaymentMethods(INITIAL_PAYMENT_METHODS);
  };

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleAddRecipeIngredients = (recipe: Recipe) => {
    recipe.ingredients.forEach((ing) => {
      const prod = products.find((p) => p.id === ing.productId) || products[0] || PRODUCTS[0];
      handleAddToCart(prod, 1);
    });
    setShowCart(true);
  };

  // Order Handlers
  const handleProceedToCheckout = (discount: number, promoCode: string) => {
    setAppliedPromoDiscount(discount);
    setAppliedPromoCode(promoCode);
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleConfirmOrder = async (details: {
    paymentMethod: string;
    deliverySlot: string;
    totalAmount: number;
    usedWallet: boolean;
    transferReference?: string;
  }) => {
    let orderId = `HAD-${Date.now().toString().slice(-6)}`;
    let calculatedTotal = details.totalAmount;

    // 1. Call Backend API to create order (server-side valuation + stock reservation)
    //    Backend enforces Firebase Auth, validates products/prices from Firestore,
    //    applies coupon server-side, and creates the order atomically.
    try {
      const fbUser = auth.currentUser;
      const token = fbUser ? await fbUser.getIdToken(false) : null;
      const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const resp = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          // ONLY productId + quantity are trusted from client.
          // Backend reads prices from Firestore and recalculates total.
          items: cartItems.map((it) => ({
            productId: it.product.id,
            quantity: it.quantity,
          })),
          couponCode: appliedPromoCode || undefined,
          deliveryAddress: deliveryAddress || `${currentBranch?.city || 'المكلا'} - ${currentBranch?.address || 'الشارع العام'}`,
          deliverySlot: details.deliverySlot,
          paymentMethod: details.paymentMethod,
          branchId: currentBranch?.id,
          transferReference: details.transferReference,
          useWallet: details.usedWallet,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success && data.order) {
        orderId = data.order.id;
        calculatedTotal = data.order.total;
      } else if (!resp.ok) {
        // Backend rejected — show error and abort.
        console.warn('Backend order creation rejected:', data?.error);
        alert(data?.error?.message || 'تعذر إنشاء الطلب. يرجى المحاولة لاحقًا.');
        return;
      }
    } catch (err) {
      console.warn('Backend order creation failed:', err);
      alert('تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
      return;
    }

    // 2. Wallet deduction is now handled SERVER-SIDE inside the order transaction.
    //    The backend `recordWalletDebit` updates `wallet_accounts/{uid}` and
    //    appends an immutable `wallet_transactions/{txId}` ledger entry.
    //    We only update local UI state here for instant feedback.
    if (details.usedWallet && walletBalance > 0) {
      const deduction = Math.min(walletBalance, calculatedTotal);
      setWalletBalance((prev) => Math.max(0, prev - deduction));
    }

    const newOrder: Order = {
      id: orderId,
      createdAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      items: [...cartItems],
      subtotal: (cartItems || []).reduce((s, i) => s + (i.product?.price || 0) * (i.quantity || 1), 0),
      discount: appliedPromoDiscount,
      tax: 15.0,
      deliveryFee: 18.0,
      total: calculatedTotal,
      status: 'READY_FOR_PICKUP',
      deliveryAddress: deliveryAddress || `${currentBranch?.city || 'المكلا'} - ${currentBranch?.address || 'الشارع العام'}`,
      paymentMethod: details.paymentMethod,
      branchName: currentBranch?.name || 'فرع المكلا',
      pickupAddress: currentBranch?.address || 'المكلا',
      estimatedDeliveryMinutes: 25,
      deliveryFeePayout: 20.0,
      customerPhone: userPhone || currentUser.phone || '770000000',
      driverName: 'سالم النهدي (في انتظار القبول)',
    };

    // 3. Order persistence is now handled by the backend `/api/orders/create`
    //    call above (Firebase Admin writes to Firestore, bypassing client rules).
    //    Local `dbSaveOrder()` would fail under hardened rules (clients can't
    //    create orders directly) — so we skip the direct write and rely on
    //    the server's response.

    // 4. Update application state (UI feedback only).
    setOrders((prev) => [newOrder, ...prev]);
    setDriverAvailableOrders((prev) => [newOrder, ...prev]);
    setActiveTrackingOrder(newOrder);
    setCartItems([]);
  };

  const handleReorder = (items: CartItem[]) => {
    setCartItems(items);
    setShowCart(true);
  };

  const handleSelectCategoryFromHome = (catId: string) => {
    setSelectedCategory(catId);
    setActiveTab('catalog');
  };

  const handleStaffLogout = async () => {
    try {
      await apiFetch('/api/auth/staff-logout', { method: 'POST' });
    } catch {
      // Still clear local staff view if the server session is already gone.
    }
    setActiveRoleView(null);
    setCurrentUser(defaultInitialUser);
    setUserPhone('');
    setWalletBalance(defaultInitialUser.walletBalance ?? 0);
  };

  // Application frame wrapper (Desktop / Mobile responsive container)
  return (
    <div 
      className="min-h-screen bg-[#071927] flex flex-col items-center justify-center p-0 md:p-4 select-none font-sans"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Optional Splash Screen */}
      {showSplash && <SplashScreen onDismiss={() => setShowSplash(false)} />}

      {/* Main App Container */}
      <div
        className={`w-full bg-[#F4F8F5] overflow-hidden flex flex-col transition-all duration-300 shadow-2xl relative ${
          activeRoleView === 'developer' || activeRoleView === 'admin' || activeRoleView === 'support'
            ? 'max-w-7xl min-h-screen md:rounded-3xl border border-white/10 bg-[#07131E]'
            : isMobileFrame
            ? 'max-w-[430px] min-h-[860px] md:h-[92vh] md:rounded-[44px] md:border-8 md:border-[#1E293B] ring-1 ring-white/20'
            : 'max-w-6xl min-h-screen md:rounded-3xl border border-gray-200'
        }`}
      >
        {/* Top Role Switcher Bar - Fast switching across all accounts */}
        <RoleSwitcherBar
          currentUser={currentUser}
          allUsers={allUsers}
          activeRoleView={activeRoleView}
          language={language}
          onToggleLanguage={handleToggleLanguage}
          onSwitchUser={handleSwitchUser}
          onOpenRegister={() => setShowRegisterModal(true)}
          onToggleDashboard={handleToggleDashboard}
          onOpenAdminCenter={() => setActiveRoleView('admin')}
          onOpenDeveloperCenter={() => setActiveRoleView('developer')}
          onOpenSupportCenter={() => setActiveRoleView('support')}
          onLogout={currentUser.id.startsWith('staff:') ? handleStaffLogout : undefined}
        />



        {/* Header (Only shown when not in full role dashboard or live tracking, and activeTab is not home or profile) */}
        {!activeRoleView && !activeTrackingOrder && activeTab !== 'home' && activeTab !== 'profile' && (
          <Header
            currentBranch={currentBranch}
            walletBalance={walletBalance}
            unreadNotificationsCount={unreadCount}
            isMobileFrame={isMobileFrame}
            language={language}
            onToggleLanguage={handleToggleLanguage}
            onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
            onOpenBranchPicker={() => setShowLocationPicker(true)}
            onOpenNotifications={() => setShowNotifications(true)}
            onOpenWallet={() => setShowWallet(true)}
            onOpenDocs={() => setShowDocs(true)}
            onOpenWaitingRoom={() => setShowWaitingRoom(true)}
            onHiddenStaffAccess={() => {
              const marker = window.prompt('بوابة الموظفين الداخلية\nأدخل رمز البوابة المنشور للفريق:');
              if (marker?.trim() === 'HHP-OPS') setShowAuth(true);
            }}
          />
        )}

        {/* Body View Switching */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {/* 1. Driver / Courier Dashboard View */}
          {activeRoleView === 'driver' ? (
            currentUser.status === 'pending' ? (
              <PendingApprovalView
                currentUser={currentUser}
                onBackToApp={() => setActiveRoleView(null)}
                onSwitchUser={handleSwitchUser}
                allUsers={allUsers}
                onOpenAdminApproval={() => setActiveRoleView('admin')}
              />
            ) : !canAccessDriverDashboard(currentUser) ? (
              <AccessRestrictedView
                currentUser={currentUser}
                requestedArea="لوحة تحكم كابتن التوصيل (Courier Dashboard)"
                requiredPermission="ACCESS_DRIVER_DASHBOARD"
                onBackToApp={() => setActiveRoleView(null)}
                onSwitchUser={handleSwitchUser}
                allUsers={allUsers}
              />
            ) : (
              <CourierDashboardView
                courier={currentUser}
                availableOrders={driverAvailableOrders}
                onAcceptOrder={handleAcceptDriverOrder}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onBackToApp={() => setActiveRoleView(null)}
              />
            )
          ) : /* 2. Merchant Dashboard View */
          activeRoleView === 'merchant' ? (
            currentUser.status === 'pending' ? (
              <PendingApprovalView
                currentUser={currentUser}
                onBackToApp={() => setActiveRoleView(null)}
                onSwitchUser={handleSwitchUser}
                allUsers={allUsers}
                onOpenAdminApproval={() => setActiveRoleView('admin')}
              />
            ) : !canAccessMerchantDashboard(currentUser) ? (
              <AccessRestrictedView
                currentUser={currentUser}
                requestedArea="لوحة تحكم التاجر الشريك (Merchant Dashboard)"
                requiredPermission="ACCESS_MERCHANT_DASHBOARD"
                onBackToApp={() => setActiveRoleView(null)}
                onSwitchUser={handleSwitchUser}
                allUsers={allUsers}
              />
            ) : (
              <MerchantDashboardView
                merchant={currentUser}
                products={products}
                allProducts={products}
                language={language}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onBackToApp={() => setActiveRoleView(null)}
              />
            )
          ) : /* 3. General Super Admin Dashboard View */
          activeRoleView === 'admin' ? (
            !canAccessAdminCenter(currentUser.role) ? (
              <AccessRestrictedView
                currentUser={currentUser}
                requestedArea="مركز إدارة وعمليات الهايبر (Admin Operations Center)"
                requiredPermission="ACCESS_ADMIN_CENTER"
                onBackToApp={() => setActiveRoleView(null)}
                onSwitchUser={handleSwitchUser}
                allUsers={allUsers}
              />
            ) : (
              <AdminControlCenter
                currentUser={currentUser}
                allUsers={allUsers}
                orders={orders}
                products={products}
                categories={categories}
                banners={banners}
                complaints={complaints}
                onUpdateOrder={handleUpdateOrder}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateBanners={handleUpdateBanners}
                onUpdateCategories={handleUpdateCategories}
                onUpdateUser={handleUpdateUser}
                onUpdateComplaint={handleUpdateComplaint}
                onBackToApp={() => setActiveRoleView(null)}
                onOpenDeveloperCenter={() => setActiveRoleView('developer')}
              />
            )
          ) : /* 4. Developer Console Dashboard View */
          activeRoleView === 'developer' ? (
            !canAccessDeveloperCenter(currentUser.role) ? (
              <AccessRestrictedView
                currentUser={currentUser}
                requestedArea="لوحة تحكم مهندس النظام والأمان (Developer Root Center)"
                requiredPermission="ACCESS_DEVELOPER_CENTER"
                onBackToApp={() => setActiveRoleView(null)}
                onSwitchUser={handleSwitchUser}
                allUsers={allUsers}
              />
            ) : (
              <DeveloperControlCenter
                currentUser={currentUser}
                allUsers={allUsers}
                paymentMethods={paymentMethods}
                orders={orders}
                onUpdateUser={handleUpdateUser}
                onUpdatePaymentMethods={handleUpdatePaymentMethods}
                onUpdateOrder={handleUpdateOrder}
                onResetData={handleResetData}
                onBackToApp={() => setActiveRoleView(null)}
                onOpenAdminCenter={() => setActiveRoleView('admin')}
              />
            )
          ) : /* 5. Customer Support Workspace View */
          activeRoleView === 'support' ? (
            !canAccessSupportCenter(currentUser.role) ? (
              <AccessRestrictedView
                currentUser={currentUser}
                requestedArea="مركز خدمة العملاء والدعم (Customer Support Center)"
                requiredPermission="ACCESS_SUPPORT_CENTER"
                onBackToApp={() => setActiveRoleView(null)}
                onSwitchUser={handleSwitchUser}
                allUsers={allUsers}
              />
            ) : (
              <CustomerSupportView
                currentUser={currentUser}
                complaints={complaints}
                onReplyComplaint={handleReplyComplaint}
                onResolveComplaint={handleResolveComplaint}
                onOpenPolicies={() => {
                  setPoliciesInitialTab('privacy');
                  setShowPoliciesModal(true);
                }}
                onBackToApp={() => setActiveRoleView(null)}
              />
            )
          ) : /* 6. Customer Live Tracking View */
          activeTrackingOrder ? (
            <LiveTrackingView
              order={activeTrackingOrder}
              onBackToHome={() => setActiveTrackingOrder(null)}
            />
          ) : /* 7. Customer Home Tab */
          activeTab === 'home' ? (
            <HomeView
              products={products}
              categories={categories}
              banners={banners}
              currentBranch={currentBranch}
              walletBalance={walletBalance}
              unreadNotificationsCount={unreadCount}
              isMobileFrame={isMobileFrame}
              language={language}
              onOpenProduct={(p) => setSelectedProduct(p)}
              onAddToCart={handleAddToCart}
              onOpenSearch={() => setShowSearchModal(true)}
              onOpenBarcodeScanner={() => setShowBarcodeScanner(true)}
              onSelectCategory={handleSelectCategoryFromHome}
              onAddRecipeIngredients={handleAddRecipeIngredients}
              onOpenBranchPicker={() => setShowLocationPicker(true)}
              onOpenNotifications={() => setShowNotifications(true)}
              onOpenWallet={() => setShowWallet(true)}
              onOpenDocs={() => setShowDocs(true)}
              onOpenWaitingRoom={() => setShowWaitingRoom(true)}
              onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
            />
          ) : /* 8. Customer Catalog / Deals Tab */
          activeTab === 'catalog' || activeTab === 'deals' ? (
            <CatalogView
              products={products}
              categories={categories}
              selectedCategory={activeTab === 'deals' ? 'all' : selectedCategory}
              language={language}
              onSelectCategory={setSelectedCategory}
              onOpenProduct={(p) => setSelectedProduct(p)}
              onAddToCart={handleAddToCart}
            />
          ) : (
            /* 9. Customer Profile Tab */
            <ProfileView
              userPhone={userPhone}
              previousOrders={orders}
              currentUser={currentUser}
              products={products}
              language={language}
              deliveryAddress={deliveryAddress}
              onOpenLocationPicker={() => setShowLocationPicker(true)}
              onToggleLanguage={handleToggleLanguage}
              onSetLanguage={(lang) => setLanguage(lang)}
              onAddToCart={handleAddToCart}
              onReOrder={handleReorder}
              onOpenDocs={() => setShowDocs(true)}
              onLogout={() => setShowAuth(true)}
              onOpenLogin={() => setShowAuth(true)}
              onOpenRoleDashboard={() => {
                if (currentUser.role === 'developer' || currentUser.role === 'super_admin') {
                  setActiveRoleView('developer');
                } else if (
                  currentUser.role === 'admin' ||
                  currentUser.role === 'operations' ||
                  currentUser.role === 'finance'
                ) {
                  setActiveRoleView('admin');
                } else if (currentUser.role === 'support') {
                  setActiveRoleView('support');
                } else if (currentUser.role === 'driver') {
                  setActiveRoleView('driver');
                } else if (currentUser.role === 'merchant') {
                  setActiveRoleView('merchant');
                }
              }}
              onOpenRegister={() => setShowRegisterModal(true)}
              onOpenPolicies={(tab) => {
                setPoliciesInitialTab(tab || 'privacy');
                setShowPoliciesModal(true);
              }}
            />
          )}
        </main>

        {/* Bottom Navigation (Only in consumer store view) */}
        {!activeRoleView && !activeTrackingOrder && (
          <BottomNav
            activeTab={activeTab}
            cartItems={cartItems}
            language={language}
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenCart={() => setShowCart(true)}
          />
        )}
      </div>

      {/* ALL OVERLAY MODALS */}
      <RegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          allProducts={products}
          language={language}
          onOpenProduct={(p) => setSelectedProduct(p)}
          onOpenCart={() => setShowCart(true)}
        />
      )}

      <SearchScreenModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        products={products}
        language={language}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          setShowSearchModal(false);
        }}
        onAddToCart={handleAddToCart}
        onOpenBarcodeScanner={() => {
          setShowSearchModal(false);
          setShowBarcodeScanner(true);
        }}
      />

      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        products={products}
        language={language}
        onProductFound={(p) => setSelectedProduct(p)}
      />

      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cartItems={cartItems}
        language={language}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cartItems={cartItems}
        branch={currentBranch}
        walletBalance={walletBalance}
        promoDiscount={appliedPromoDiscount}
        promoCode={appliedPromoCode}
        completedOrdersCount={orders.length}
        paymentMethods={paymentMethods}
        language={language}
        onConfirmOrder={handleConfirmOrder}
      />

      <WalletView
        isOpen={showWallet}
        balance={walletBalance}
        language={language}
        onTopUp={(amt) => setWalletBalance((prev) => prev + amt)}
        onClose={() => setShowWallet(false)}
      />

      <WaitingRoomModal
        isOpen={showWaitingRoom}
        onClose={() => setShowWaitingRoom(false)}
        onEnterStore={() => setActiveTab('home')}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onLoginSuccess={(loggedInUser, fbUser) => {
          handleLoginSuccess(loggedInUser, fbUser);
        }}
      />

      <LocationPickerModal
        isOpen={showLocationPicker}
        currentBranch={currentBranch}
        language={language}
        onClose={() => setShowLocationPicker(false)}
        onSelectBranch={(branch, customAddress) => {
          setCurrentBranch(branch);
          if (customAddress) {
            setDeliveryAddress(customAddress);
          }
        }}
      />

      <NotificationsModal
        isOpen={showNotifications}
        notifications={notifications}
        language={language}
        onClose={() => setShowNotifications(false)}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
      />

      {showDocs && (
        <ArchitectureDocsView
          isOpen={showDocs}
          onClose={() => setShowDocs(false)}
        />
      )}

      <PoliciesModal
        isOpen={showPoliciesModal}
        onClose={() => setShowPoliciesModal(false)}
        initialTab={policiesInitialTab}
        language={language}
      />
    </div>
  );
}
