import { AppLanguage, ProductCurrency, Product, Branch, OrderStatus, UserRole } from '../types';

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  ar: {
    // Brand & App
    appName: 'حضرموت هايبر',
    appEnglishName: 'HADRAMOUT HYPER',
    deliveryComingSoon: 'سيتوفر التوصيل قريباً',
    activeAccount: 'الحساب النشط:',
    switchRole: 'التبديل السريع بين الأدوار',
    accountsCount: 'حسابات',
    viewStore: 'عرض المتجر 🛍️',
    dashboard: 'لوحة التحكم ⚡',
    registerNew: 'تسجيل جديد',
    createNewAccount: 'إنشاء حساب مندوب أو تاجر جديد',
    appTagline: 'الهايبر ماركت الأسرع والأشمل في اليمن والسعودية',
    deliveryAvailableSoon: 'توصيل فائق السرعة خلال 20-30 دقيقة',
    hyperDelivery: 'توصيل الهايبر السريع',
    freeDeliveryPromo: 'توصيل مجاني للطلبات فوق 150 ر.س 🚚',
    freeDeliveryNote: 'استخدم كود HADRAMOUT لخصم 10% إضافي على أول طلب',
    featuredForYou: 'مختارات خصيصاً لك',
    tailoredForYou: 'منتجات طازجة ومختارة بعناية لأجلك',
    viewMore: 'عرض المزيد',
    superWeeklyDeal: 'صفقة الأسبوع الكبرى 🌟',
    saveUpTo50: 'وفر حتى 50% على سلات الفواكه واللحوم الطازجة',
    browseSuper: 'تصفح الصفقة',
    flashDealsTitle: 'عروض الصاعقة والتخفيضات',
    discountsUpTo45: 'خصومات حصرية تصل حتى 45%',
    limitedQuantities: 'كميات محدودة وأسعار استثنائية تنتهي قريباً',
    hadramoutSpecialsTitle: 'كنوز وتراث حضرموت الأصيل',
    hadramoutSpecialsDesc: 'عسل دوعني نقي، بهارات المندي، زيت سمسم بلدي، وبن قشر فاخر',
    smartRecipesTitle: 'وصفات المطبخ الحضرمي الذكية',
    smartRecipesDesc: 'اختر وصفتك المفضلة وأضف كافة مقاديرها للسلة بنقرة زر واحدة',
    totalAmount: 'المبلغ الإجمالي',
    addAllIngredients: 'أضف كافة المقادير للسلة',

    // SubCategory Chips & Category Navigation
    catAll: 'الكل',
    catGroceries: 'البقالة والتموين',
    catFresh: 'طازج يومياً',
    catBeverages: 'المشروبات والعصائر',
    catHomeCare: 'العناية بالمنزل',
    catPersonalCare: 'العناية الشخصية',
    catHadramoutSpecial: 'المميز الحضرمي',

    // Bottom Nav & Tabs
    tabHome: 'الرئيسية',
    tabCatalog: 'الأقسام',
    tabDeals: 'العروض',
    tabCart: 'السلة',
    tabProfile: 'حسابي',
    viewCart: 'عرض السلة',
    smartCart: 'سلة التسوق الذكية',
    itemsCount: 'منتج',

    // Header
    selectBranch: 'اختر الفرع',
    wallet: 'المحفظة',
    notifications: 'التنبيهات',
    architectureDocs: 'توثيق النظام',
    virtualQueue: 'غرفة الانتظار',

    // Search Bar & Search Screen
    searchPlaceholder: 'جرب تبحث عن.. سلة الإفطار، أرز، حليب، عسل...',
    searchCatalogPlaceholder: 'ابحث في حضرموت هايبر عن منتجات، طازج، بهارات، عسل...',
    searchHeaderTitle: 'البحث في حضرموت هايبر',
    recentSearches: 'عمليات البحث الأخيرة',
    clearAll: 'مسح الكل',
    clearSearch: 'مسح',
    popularSearches: 'الأكثر بحثاً وشهرة 🔥',
    browseCategories: 'تصفح حسب الفئات',
    filterByCurrency: 'تصفية حسب العملة',
    allCurrencies: 'جميع العملات',
    currencySAR: 'ريال سعودي (ر.س)',
    currencyYER: 'ريال يمني (ر.ي)',
    searchResults: 'نتائج البحث',
    foundProducts: 'منتج مطابق',
    noSearchResults: 'لم نجد أي نتائج مطابقة لبحثك',
    trySearchingOther: 'جرّب البحث بكلمة أخرى مثل: أرز، حليب، عسل دوعني، دجاج...',
    typeToSearch: 'اكتب اسم المنتج أو القسم للبحث الفوري',
    addToCart: 'أضف للسلة',
    added: 'تمت الإضافة!',
    inStock: 'متوفر',
    outOfStock: 'نفد من المخزون',
    allSections: 'كافة الأقسام',
    popularSort: 'الأكثر شهرة',
    priceLowSort: 'السعر: من الأقل',
    priceHighSort: 'السعر: من الأعلى',
    ratingSort: 'الأعلى تقييماً',
    noProductsInCat: 'لا توجد منتجات مطابقة حالياً',

    // Categories
    cat_all: 'الكل',
    cat_fruits_veg: 'الخضار والفواكه',
    cat_fresh_meat: 'اللحوم والأسماك',
    cat_dairy: 'الألبان والأجبان',
    cat_bakery: 'المخبوزات والحلويات',
    cat_pantry: 'المعلبات والمؤن',
    cat_hadramout_specials: 'منتجات حضرمية أصلية',
    cat_cleaning: 'المنظفات والمنزل',
    cat_personal_care: 'العناية الشخصية',

    // Home Sections
    flashDeals: 'عروض الصاعقة والتخفيضات',
    endsIn: 'ينتهي خلال',
    viewAll: 'عرض الكل',
    hadramoutTreasures: 'كنوز حضرموت الأصيلة',
    hadramoutTreasuresSub: 'عسل دوعني، بهارات شبوانية، زيت سمسم معصور طازج',
    recipesTitle: 'وصفات المطبخ الحضرمي الذكية',
    recipesSub: 'اختر الوصفة وأضف كافة مقاديرها للسلة بضغطة زر واحدة',
    addIngredientsToCart: 'أضف المقادير للسلة',
    ingredientsAdded: 'تمت إضافة المقادير بنجاح!',
    difficultyEasy: 'سهل',
    difficultyMedium: 'متوسط',
    difficultyHard: 'صعب',
    servings: 'أشخاص',
    minutes: 'دقيقة',

    // Product Details
    productDetails: 'تفاصيل المنتج',
    calories: 'السعرات',
    origin: 'المنشأ',
    unit: 'الوحدة',
    quantity: 'الكمية',
    totalPrice: 'الإجمالي',
    frequentlyBoughtTogether: 'يُشترى معه عادةً',
    volumeDiscountAvailable: 'خصم الجملة متاح',
    decreaseQty: 'تقليل الكمية',
    increaseQty: 'زيادة الكمية',
    addToFavorites: 'إضافة إلى المفضلة',
    removeFromFavorites: 'إزالة من المفضلة',

    // Cart & Cart Drawer
    myCart: 'سلة المشتريات',
    cartTitle: 'سلة المشتريات',
    cartEmpty: 'عربة التسوق فارغة حالياً',
    cartEmptyTitle: 'عربة التسوق فارغة حالياً',
    cartEmptySub: 'تصفح أقسام حضرموت هايبر أو استخدم البحث لإضافة طلباتك بسهولة',
    cartEmptySubtitle: 'تصفح أقسام حضرموت هايبر أو استخدم البحث لإضافة طلباتك بسهولة',
    startShopping: 'ابدأ التسوق الآن',
    browseProductsNow: 'تصفح المنتجات الآن',
    subtotal: 'المجموع الفرعي',
    codeDiscount: 'خصم الكود',
    discount: 'الخصم',
    tax: 'ضريبة القيمة المضافة',
    deliveryFee: 'رسوم التوصيل',
    freeDelivery: 'توصيل مجاني',
    total: 'المبلغ الإجمالي',
    proceedToCheckout: 'متابعة إتمام الطلب',
    proceedToPayment: 'متابعة إتمام الطلب',
    promoCode: 'كود الخصم أو القسيمة',
    promoPlaceholder: 'كود الخصم (جرب HADRAMOUT أو AHMED)',
    apply: 'تطبيق',
    applyCode: 'تطبيق',
    deleteItem: 'حذف المنتج',
    freeDeliveryUnlocked: 'مبروك! حصلت على توصيل مجاني 🚚',
    freeDeliveryProgress: 'أضف بقيمة {amount} للحصول على توصيل مجاني!',
    vatInclusive: 'شامل ضريبة القيمة المضافة',

    // Checkout Modal
    checkoutTitle: 'إتمام الطلب والدفع',
    checkoutHeader: 'إتمام الطلب والدفع السريع',
    deliveryBranch: 'فرع التجهيز والتوصيل',
    deliveryAddress: 'عنوان التوصيل',
    deliverySlot: 'موعد الاستلام أو التوصيل',
    deliverySlotTitle: 'موعد الاستلام أو التوصيل',
    expressSlot: 'توصيل فوري سريع (20-30 دقيقة)',
    expressSlotSub: 'أسرع شاحنة مبردة تنطلق فوراً',
    scheduledSlot: 'توصيل مجدول لاحقاً',
    scheduledSlotSub: 'حدد موعداً مناسباً لاستلام مشترياتك',
    asapDelivery: 'أسرع وقت متاح (خلال 30 دقيقة)',
    paymentMethod: 'طريقة الدفع',
    selectPaymentMethod: 'اختر وسيلة الدفع',
    confirmOrder: 'تأكيد الطلب والدفع',
    confirmAndPlaceOrder: 'تأكيد وإرسال الطلب',
    walletDeductionLabel: 'استخدام رصيد المحفظة',
    walletAvailable: 'الرصيد المتاح:',
    transferRefLabel: 'رقم الإشعار أو الحوالة',
    transferRefPlaceholder: 'أدخل رقم الحوالة أو الإشعار البنكي للتحقق',
    copyAccount: 'نسخ رقم الحساب',
    copied: 'تم النسخ!',
    codLabel: 'الدفع نقداً عند الاستلام',
    codUnlockedSub: 'متاح للعملاء الموثوقين',
    codLockedSub: 'الدفع عند الاستلام متاح بعد إكمال 5 طلبات سابقة بنجاح',
    processing: 'جارٍ تأكيد الطلب...',
    fastDeliveryGuarantee: 'ضمان وصول الطلب طازجاً ومبرداً 100%',
    securePaymentGuarantee: 'دفع محمي وتشفير بنكي آمن',

    // Profile & Settings
    personalInfo: 'المعلومات الشخصية',
    personalInfoSub: 'تعديل الاسم ورقم الجوال والعنوان',
    myOrders: 'طلباتي',
    myOrdersSub: 'تتبع الطلبات وسجل الفواتير',
    paymentMethods: 'طرق الدفع',
    paymentMethodsSub: 'إدارة المحافظ والحسابات البنكية',
    helpFaqs: 'المساعدة والأسئلة الشائعة',
    helpFaqsSub: 'مركز الدعم والتواصل الفوري',
    settings: 'الاعدادات',
    settingsSub: 'اللغة، الإشعارات، وتفضيلات العرض',
    favorites: 'المفضلة',
    favoritesSub: 'المنتجات التي حفظتها للشراء',
    version: 'رقم النسخة:',
    privacyPolicy: 'سياسة الخصوصية والاستخدام',
    fullName: 'الاسم الكامل',
    phoneNumber: 'رقم الجوال',
    emailAddress: 'البريد الإلكتروني',
    defaultAddress: 'العنوان الافتراضي',
    saveChanges: 'حفظ التغييرات',
    savedSuccessfully: 'تم الحفظ بنجاح!',
    notificationsSetting: 'الإشعارات والتنبيهات',
    enablePromoNotifications: 'استلام إشعارات العروض اليومية وحالة الطلب',
    languageSetting: 'لغة التطبيق (Language)',
    arabicLang: 'العربية (Arabic)',
    englishLang: 'English (الإنجليزية)',
    activeRole: 'نوع الحساب الحالي',
    switchAccount: 'تبديل الحساب',
    logoutAccount: 'تسجيل الخروج',
    loginAccount: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    myAccount: 'حسابي',
    helpAndFaq: 'المساعدة والأسئلة الشائعة',
    noFavorites: 'لا توجد منتجات في المفضلة حالياً',
    email: 'البريد الإلكتروني',
    addressLabel: 'العنوان الافتراضي',
    noOrdersYet: 'لا توجد طلبات سابقة حتى الآن',
    reorder: 'إعادة الطلب',
    cashOnDelivery: 'الدفع نقداً عند الاستلام',
    language: 'اللغة',
    honoraryDeveloper: 'فريق التطوير الفخري',
    viewDocs: 'عرض التوثيق التقني',
    orderNumber: 'رقم الطلب #',
    orderStatus: 'حالة الطلب',
    orderDelivered: 'تم التوصيل بنجاح',
    reOrder: 'إعادة الطلب',
    reorderedSuccess: 'تمت إضافة طلبك السابق إلى السلة بنجاح!',

    // Courier & Driver
    courierControl: 'لوحة كابتن التوصيل',
    onlineStatus: 'متصل ومتاح للطلبات',
    offlineStatus: 'غير متصل حالياً',
    availableOrders: 'طلبات جديدة جاهزة للاستلام',
    activeDeliveries: 'الطلبات قيد التوصيل الحالية',
    deliveryHistory: 'سجل التوصيلات المكتملة',
    acceptDeliveryOrder: 'قبول واستلام الطلب',
    updateDeliveryStatus: 'تحديث حالة التوصيل',
    callCustomer: 'اتصال بالعميل',
    chatCustomer: 'محادثة العميل',
    pickupFromStore: 'استلام من الهايبر',
    deliverToCustomer: 'تسليم للعميل',
    earningsSummary: 'أرباح ومستحقات التوصيل',

    // Merchant Dashboard
    merchantDashboard: 'لوحة تحكم التاجر',
    merchantStore: 'متجر التاجر',
    merchantProducts: 'منتجاتي',
    allCatalog: 'كتالوج الهايبر العام',
    addNewProduct: 'إضافة منتج جديد',
    editProduct: 'تعديل المنتج',
    productNameAr: 'اسم المنتج بالعربية',
    productNameEn: 'اسم المنتج بالإنجليزية',
    productCategory: 'القسم / التصنيف',
    productPrice: 'سعر المنتج',
    originalPriceOptional: 'السعر قبل الخصم (اختياري)',
    productCurrency: 'عملة المنتج',
    currency_SAR_label: 'ريال سعودي (ر.س - SAR)',
    currency_YER_label: 'ريال يمني (ر.ي - YER)',
    productUnit: 'الوحدة (حبة، 1 كيلو، كرتون...)',
    stockCount: 'الكمية بالمخزن',
    productBadge: 'الشارة (مثل: طازج، حصري)',
    productOrigin: 'بلد المنشأ',
    productDescription: 'وصف المنتج',
    saveProduct: 'حفظ المنتج',
    cancel: 'إلغاء',
    deleteProduct: 'حذف المنتج',
    deleteConfirm: 'هل أنت متأكد من حذف هذا المنتج؟',
    permissionDenied: 'تنبيه الصلاحيات: لا يمكنك تعديل هذا المنتج لأنه يتبع لتاجر آخر أو إدارة الهايبر المركزية.',

    // Admin & Developer Centers
    adminControlCenter: 'مركز إدارة وتشغيل الهايبر',
    developerControlCenter: 'لوحة المطور والأمان والهندسة',
    operationsKanban: 'لوحة العمليات والطلبات',
    catalogManager: 'إدارة الكتالوج والمنتجات',
    appBuilderCMS: 'منشئ الواجهات والمحتوى (CMS)',
    crmManager: 'إدارة العملاء والشكاوى',
    financeAnalytics: 'التقارير المالية والمدفوعات',
    systemLogs: 'سجلات النظام والأمان',
    featureFlags: 'مفاتيح الميزات (Feature Flags)',
    apiIntegrations: 'التكاملات والـ API',
    backToStore: 'عرض المتجر',

    // Roles
    role_customer: 'عميل',
    role_driver: 'كابتن توصيل',
    role_merchant: 'تاجر شريك',
    role_admin: 'مدير عام',
    role_developer: 'مطور نظام',
    role_super_admin: 'المدير التنفيذي الأعلى',
  role_manager: 'المدير',
    role_operations: 'مسؤول العمليات',
    role_finance: 'المدير المالي',
    role_support: 'خدمة العملاء',

    // Currencies
    yer_symbol: 'ر.ي',
    sar_symbol: 'ر.س',
    currency_yer: 'ريال يمني',
    currency_sar: 'ريال سعودي',

    // Order Statuses
    status_DRAFT: 'مسودة',
    status_CREATED: 'تم إنشاء الطلب',
    status_PAID: 'تم الدفع',
    status_STORE_PICKING: 'جاري التجهيز في المتجر',
    status_READY_FOR_PICKUP: 'جاهز للاستلام والتوصيل',
    status_IN_TRANSIT: 'في الطريق مع المندوب',
    status_ON_THE_WAY: 'في الطريق مع المندوب',
    status_DELIVERED: 'تم التوصيل',
    status_CANCELLED: 'ملغي',
  },

  en: {
    // Brand & App
    appName: 'Hadramout Hyper',
    appEnglishName: 'HADRAMOUT HYPER',
    deliveryComingSoon: 'Delivery coming soon ⚡',
    activeAccount: 'Active Account:',
    switchRole: 'Quick Role Switcher',
    accountsCount: 'accounts',
    viewStore: 'View Store 🛍️',
    dashboard: 'Dashboard ⚡',
    registerNew: 'Register New',
    createNewAccount: 'Register Merchant / Driver Account',
    appTagline: 'The fastest & most comprehensive hypermarket in Yemen & Saudi',
    deliveryAvailableSoon: 'Superfast delivery within 20-30 minutes',
    hyperDelivery: 'Hyper Express Delivery',
    freeDeliveryPromo: 'Free delivery on orders over 150 SAR 🚚',
    freeDeliveryNote: 'Use code HADRAMOUT for an extra 10% off your first order',
    featuredForYou: 'Featured for You',
    tailoredForYou: 'Fresh, handpicked products curated especially for you',
    viewMore: 'View More',
    superWeeklyDeal: 'Mega Weekly Deal 🌟',
    saveUpTo50: 'Save up to 50% on fresh fruit and meat baskets',
    browseSuper: 'Explore Deal',
    flashDealsTitle: 'Flash Deals & Discounts',
    discountsUpTo45: 'Exclusive discounts up to 45%',
    limitedQuantities: 'Limited stock and exceptional prices ending soon',
    hadramoutSpecialsTitle: 'Treasures of Authentic Hadramout',
    hadramoutSpecialsDesc: 'Pure Doani honey, Mandi spices, organic sesame oil, and signature coffee',
    smartRecipesTitle: 'Hadramout Smart Recipes',
    smartRecipesDesc: 'Select your recipe and add all fresh ingredients with a single click',
    totalAmount: 'Total Amount',
    addAllIngredients: 'Add All Ingredients to Cart',

    // SubCategory Chips & Category Navigation
    catAll: 'All',
    catGroceries: 'Groceries',
    catFresh: 'Daily Fresh',
    catBeverages: 'Beverages',
    catHomeCare: 'Home Care',
    catPersonalCare: 'Personal Care',
    catHadramoutSpecial: 'Hadramout Specials',

    // Bottom Nav & Tabs
    tabHome: 'Home',
    tabCatalog: 'Categories',
    tabDeals: 'Offers',
    tabCart: 'Cart',
    tabProfile: 'Profile',
    viewCart: 'View Cart',
    smartCart: 'Smart Shopping Cart',
    itemsCount: 'items',

    // Header
    selectBranch: 'Select Branch',
    wallet: 'Wallet',
    notifications: 'Notifications',
    architectureDocs: 'System Docs',
    virtualQueue: 'Waiting Room',

    // Search Bar & Search Screen
    searchPlaceholder: 'Search for breakfast, rice, milk, honey, chicken...',
    searchCatalogPlaceholder: 'Search Hadramout Hyper for products, fresh produce, spices, honey...',
    searchHeaderTitle: 'Search in Hadramout Hyper',
    recentSearches: 'Recent Searches',
    clearAll: 'Clear All',
    clearSearch: 'Clear',
    popularSearches: 'Trending & Popular 🔥',
    browseCategories: 'Browse by Categories',
    filterByCurrency: 'Filter by Currency',
    allCurrencies: 'All Currencies',
    currencySAR: 'Saudi Riyal (SAR)',
    currencyYER: 'Yemeni Riyal (YER)',
    searchResults: 'Search Results',
    foundProducts: 'matching products',
    noSearchResults: 'No products matched your search',
    trySearchingOther: 'Try different keywords like: Rice, Milk, Doany Honey, Chicken...',
    typeToSearch: 'Type a product name or category to search instantly',
    addToCart: 'Add to Cart',
    added: 'Added!',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    allSections: 'All Departments',
    popularSort: 'Most Popular',
    priceLowSort: 'Price: Low to High',
    priceHighSort: 'Price: High to Low',
    ratingSort: 'Top Rated',
    noProductsInCat: 'No matching products found',

    // Categories
    cat_all: 'All',
    cat_fruits_veg: 'Fruits & Veg',
    cat_fresh_meat: 'Meat & Seafood',
    cat_dairy: 'Dairy & Cheese',
    cat_bakery: 'Bakery & Sweets',
    cat_pantry: 'Pantry & Canned',
    cat_hadramout_specials: 'Authentic Hadramout',
    cat_cleaning: 'Cleaning & Household',
    cat_personal_care: 'Personal Care',

    // Home Sections
    flashDeals: 'Flash Deals & Discounts',
    endsIn: 'Ends in',
    viewAll: 'View All',
    hadramoutTreasures: 'Treasures of Authentic Hadramout',
    hadramoutTreasuresSub: 'Doany honey, Shabwani spices, freshly pressed sesame oil',
    recipesTitle: 'Hadramout Smart Recipes',
    recipesSub: 'Pick a recipe and add all fresh ingredients with a single click',
    addIngredientsToCart: 'Add Ingredients to Cart',
    ingredientsAdded: 'All Ingredients Added!',
    difficultyEasy: 'Easy',
    difficultyMedium: 'Medium',
    difficultyHard: 'Hard',
    servings: 'servings',
    minutes: 'mins',

    // Product Details
    productDetails: 'Product Details',
    calories: 'Calories',
    origin: 'Origin',
    unit: 'Unit',
    quantity: 'Quantity',
    totalPrice: 'Total Price',
    frequentlyBoughtTogether: 'Frequently Bought Together',
    volumeDiscountAvailable: 'Wholesale Discount Available',
    decreaseQty: 'Decrease quantity',
    increaseQty: 'Increase quantity',
    addToFavorites: 'Add to Favorites',
    removeFromFavorites: 'Remove from Favorites',

    // Cart & Cart Drawer
    myCart: 'Shopping Cart',
    cartTitle: 'Shopping Cart',
    cartEmpty: 'Your Cart is Empty',
    cartEmptyTitle: 'Your Cart is Currently Empty',
    cartEmptySub: 'Explore our fresh departments to fill up your shopping cart',
    cartEmptySubtitle: 'Explore our fresh departments or search to easily add your items',
    startShopping: 'Start Shopping',
    browseProductsNow: 'Browse Products Now',
    subtotal: 'Subtotal',
    codeDiscount: 'Promo Discount',
    discount: 'Discount',
    tax: 'VAT (Tax)',
    deliveryFee: 'Delivery Fee',
    freeDelivery: 'Free Delivery',
    total: 'Total Amount',
    proceedToCheckout: 'Proceed to Checkout',
    proceedToPayment: 'Proceed to Checkout',
    promoCode: 'Promo Code / Voucher',
    promoPlaceholder: 'Promo code (Try HADRAMOUT or AHMED)',
    apply: 'Apply',
    applyCode: 'Apply',
    deleteItem: 'Delete item',
    freeDeliveryUnlocked: 'Congratulations! You unlocked free delivery 🚚',
    freeDeliveryProgress: 'Add {amount} more for free delivery!',
    vatInclusive: 'Inclusive of VAT',

    // Checkout Modal
    checkoutTitle: 'Checkout & Payment',
    checkoutHeader: 'Fast Checkout & Payment',
    deliveryBranch: 'Fulfillment & Delivery Branch',
    deliveryAddress: 'Delivery Address',
    deliverySlot: 'Delivery / Pickup Slot',
    deliverySlotTitle: 'Delivery / Pickup Slot',
    expressSlot: 'Express Delivery (20-30 mins)',
    expressSlotSub: 'Fast refrigerated delivery dispatched immediately',
    scheduledSlot: 'Scheduled Delivery',
    scheduledSlotSub: 'Choose a suitable time slot for delivery',
    asapDelivery: 'Fastest Available (Within 30 mins)',
    paymentMethod: 'Payment Method',
    selectPaymentMethod: 'Select Payment Method',
    confirmOrder: 'Confirm Order & Pay',
    confirmAndPlaceOrder: 'Confirm & Place Order',
    walletDeductionLabel: 'Use Wallet Balance',
    walletAvailable: 'Available Balance:',
    transferRefLabel: 'Transfer / Reference Number',
    transferRefPlaceholder: 'Enter bank transfer reference number for verification',
    copyAccount: 'Copy Account Number',
    copied: 'Copied!',
    codLabel: 'Cash on Delivery (COD)',
    codUnlockedSub: 'Available for verified customers',
    codLockedSub: 'Cash on delivery unlocked after 5 successful orders',
    processing: 'Processing your order...',
    fastDeliveryGuarantee: 'Guaranteed 100% fresh & refrigerated delivery',
    securePaymentGuarantee: 'Secure payment with end-to-end banking encryption',

    // Profile & Settings
    personalInfo: 'Personal Information',
    personalInfoSub: 'Edit name, phone number, and delivery address',
    myOrders: 'My Orders',
    myOrdersSub: 'Track active orders and review receipts',
    paymentMethods: 'Payment Methods',
    paymentMethodsSub: 'Manage digital wallets and bank accounts',
    helpFaqs: 'Help & FAQs',
    helpFaqsSub: 'Customer support center and instant assistance',
    settings: 'Settings',
    settingsSub: 'Language, notifications, and app preferences',
    favorites: 'Favorites',
    favoritesSub: 'Items you saved for later purchase',
    version: 'Version:',
    privacyPolicy: 'Privacy Policy & Terms',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    emailAddress: 'Email Address',
    defaultAddress: 'Default Address',
    saveChanges: 'Save Changes',
    savedSuccessfully: 'Saved Successfully!',
    notificationsSetting: 'Notifications & Alerts',
    enablePromoNotifications: 'Receive daily offers and live order status notifications',
    languageSetting: 'App Language / لغة التطبيق',
    arabicLang: 'العربية (Arabic)',
    englishLang: 'English (الإنجليزية)',
    activeRole: 'Current Active Role',
    switchAccount: 'Switch Account',
    logoutAccount: 'Log Out',
    loginAccount: 'Log In',
    logout: 'Log Out',
    login: 'Log In',
    myAccount: 'My Account',
    helpAndFaq: 'Help & FAQs',
    noFavorites: 'No favorite products yet',
    email: 'Email Address',
    addressLabel: 'Default Address',
    noOrdersYet: 'No previous orders yet',
    reorder: 'Re-order',
    cashOnDelivery: 'Cash on Delivery',
    language: 'Language',
    honoraryDeveloper: 'Honorary Developer Team',
    viewDocs: 'View Technical Documentation',
    orderNumber: 'Order #',
    orderStatus: 'Order Status',
    orderDelivered: 'Delivered Successfully',
    reOrder: 'Re-order',
    reorderedSuccess: 'Previous order items added to cart successfully!',

    // Courier & Driver
    courierControl: 'Driver Delivery Dashboard',
    onlineStatus: 'Online & Available for Orders',
    offlineStatus: 'Currently Offline',
    availableOrders: 'Available Orders for Pickup',
    activeDeliveries: 'Active Deliveries in Progress',
    deliveryHistory: 'Completed Deliveries History',
    acceptDeliveryOrder: 'Accept & Pick Up Order',
    updateDeliveryStatus: 'Update Delivery Status',
    callCustomer: 'Call Customer',
    chatCustomer: 'Chat with Customer',
    pickupFromStore: 'Pick up from Hyper',
    deliverToCustomer: 'Deliver to Customer',
    earningsSummary: 'Delivery Earnings & Payouts',

    // Merchant Dashboard
    merchantDashboard: 'Merchant Dashboard',
    merchantStore: 'Merchant Store',
    merchantProducts: 'My Products',
    allCatalog: 'Global Hyper Catalog',
    addNewProduct: 'Add New Product',
    editProduct: 'Edit Product',
    productNameAr: 'Product Name (Arabic)',
    productNameEn: 'Product Name (English)',
    productCategory: 'Category',
    productPrice: 'Price',
    originalPriceOptional: 'Original Price (Optional)',
    productCurrency: 'Product Currency',
    currency_SAR_label: 'Saudi Riyal (SAR)',
    currency_YER_label: 'Yemeni Riyal (YER)',
    productUnit: 'Unit (Piece, 1 Kg, Box...)',
    stockCount: 'Stock Count',
    productBadge: 'Badge (e.g. Fresh, Exclusive)',
    productOrigin: 'Origin',
    productDescription: 'Description',
    saveProduct: 'Save Product',
    cancel: 'Cancel',
    deleteProduct: 'Delete Product',
    deleteConfirm: 'Are you sure you want to delete this product?',
    permissionDenied: 'Permission Alert: You cannot modify this product because it belongs to another merchant or central management.',

    // Admin & Developer Centers
    adminControlCenter: 'Hyper Admin & Operations Center',
    developerControlCenter: 'Developer, Engineering & Security Center',
    operationsKanban: 'Operations & Orders Kanban',
    catalogManager: 'Catalog & Product Manager',
    appBuilderCMS: 'App Builder & CMS',
    crmManager: 'CRM & Customer Complaints',
    financeAnalytics: 'Finance & Analytics Reports',
    systemLogs: 'System & Security Logs',
    featureFlags: 'Feature Flags',
    apiIntegrations: 'API & Integrations',
    backToStore: 'View Store',

    // Roles
    role_customer: 'Customer',
    role_driver: 'Delivery Driver',
    role_merchant: 'Partner Merchant',
    role_admin: 'General Admin',
    role_developer: 'System Developer',
    role_super_admin: 'Executive Super Admin',
  role_manager: 'Manager',
    role_operations: 'Operations Officer',
    role_finance: 'Finance Officer',
    role_support: 'Support Agent',

    // Currencies
    yer_symbol: 'YER',
    sar_symbol: 'SAR',
    currency_yer: 'Yemeni Riyal',
    currency_sar: 'Saudi Riyal',

    // Order Statuses
    status_DRAFT: 'Draft',
    status_CREATED: 'Order Created',
    status_PAID: 'Paid',
    status_STORE_PICKING: 'Store Picking',
    status_READY_FOR_PICKUP: 'Ready for Pickup',
    status_IN_TRANSIT: 'In Transit with Courier',
    status_ON_THE_WAY: 'On the way',
    status_DELIVERED: 'Delivered',
    status_CANCELLED: 'Cancelled',
  },
};

export const t = (key: string, lang: AppLanguage | string = 'ar'): string => {
  const safeLang: AppLanguage = lang === 'en' ? 'en' : 'ar';
  return TRANSLATIONS[safeLang]?.[key] || TRANSLATIONS.ar[key] || key;
};

export const formatCurrency = (currency?: ProductCurrency, lang: AppLanguage | string = 'ar'): string => {
  const safeLang: AppLanguage = lang === 'en' ? 'en' : 'ar';
  if (currency === 'YER') {
    return safeLang === 'ar' ? 'ر.ي' : 'YER';
  }
  return safeLang === 'ar' ? 'ر.س' : 'SAR';
};

export const formatPrice = (price: number, currency?: ProductCurrency, lang: AppLanguage | string = 'ar'): string => {
  const safeLang: AppLanguage = lang === 'en' ? 'en' : 'ar';
  const formattedNumber = Number(price || 0).toLocaleString(safeLang === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = formatCurrency(currency, safeLang);
  return `${formattedNumber} ${symbol}`;
};

export const getLocalizedProductName = (product: { name: string; nameEn?: string }, lang: AppLanguage | string = 'ar'): string => {
  if (lang === 'en' && product.nameEn && product.nameEn.trim()) {
    return product.nameEn;
  }
  return product.name;
};

export const getLocalizedProductUnit = (product: { unit: string; unitEn?: string }, lang: AppLanguage | string = 'ar'): string => {
  if (lang === 'en') {
    if (product.unitEn && product.unitEn.trim()) {
      return product.unitEn;
    }
    const unitMap: Record<string, string> = {
      '1 كيلو': '1 kg',
      '1 كيلو جرام': '1 kg',
      'عبوة 350 جم': '350g pack',
      'علبة 4 قطع': 'Pack of 4 pcs',
      'كيس 5 كيلو': '5 kg bag',
      '2 لتر': '2 Liters',
      '1 حبة': '1 pc',
      'حبة': 'Piece',
      'كرتون': 'Carton',
      'كيلو': 'kg',
      'لتر': 'Liter',
    };
    return unitMap[product.unit] || product.unit;
  }
  return product.unit;
};

export const getLocalizedProductBadge = (badge?: string, badgeEn?: string, lang: AppLanguage | string = 'ar'): string => {
  if (!badge) return '';
  if (lang === 'en') {
    if (badgeEn && badgeEn.trim()) return badgeEn;
    const badgeMap: Record<string, string> = {
      'طازج اليوم': 'Fresh Today',
      'الأكثر طلباً': 'Best Seller',
      'تراث حضرمي': 'Hadrami Heritage',
      'عرض خاص': 'Special Offer',
      'ذبح اليوم': 'Fresh Slaughter',
      'يومي': 'Daily Fresh',
      'مخبوز طازج': 'Freshly Baked',
      'توفير عائلي': 'Family Value',
      'العدد 2': 'Pack of 2',
      'عضوي': 'Organic',
      'بلدي': 'Local',
    };
    return badgeMap[badge] || badge;
  }
  return badge;
};

export const getLocalizedProductOrigin = (origin?: string, originEn?: string, lang: AppLanguage | string = 'ar'): string => {
  if (!origin) return '';
  if (lang === 'en') {
    if (originEn && originEn.trim()) return originEn;
    const originMap: Record<string, string> = {
      'إنتاج محلي طازج': 'Fresh Local Produce',
      'وادي دوعن - حضرموت': 'Doan Valley - Hadramout',
      'المكلا - حضرموت': 'Mukalla - Hadramout',
      'مزارع محلية': 'Local Farms',
      'مواشي محلية مفحوصة طبياً': 'Local Livestock - Vet Checked',
      'مخبز هايبر حضرموت اليومي': 'Daily Hyper Bakery',
      'الهند - معبأ لصالح حضرموت هايبر': 'India - Packed for Hadramout Hyper',
      'محلي - مزارع شبوة': 'Local - Shabwa Farms',
    };
    return originMap[origin] || origin;
  }
  return origin;
};

export const getLocalizedProductDescription = (product: { description: string; descriptionEn?: string }, lang: AppLanguage | string = 'ar'): string => {
  if (lang === 'en' && product.descriptionEn && product.descriptionEn.trim()) {
    return product.descriptionEn;
  }
  return product.description;
};

export const getLocalizedCategoryName = (categoryId: string, lang: AppLanguage | string = 'ar', fallbackName?: string): string => {
  const safeLang: AppLanguage = lang === 'en' ? 'en' : 'ar';
  const map: Record<string, string> = {
    all: 'cat_all',
    'fruits-veg': 'cat_fruits_veg',
    'fresh-meat': 'cat_fresh_meat',
    dairy: 'cat_dairy',
    bakery: 'cat_bakery',
    pantry: 'cat_pantry',
    'hadramout-specials': 'cat_hadramout_specials',
    cleaning: 'cat_cleaning',
    'personal-care': 'cat_personal_care',
  };
  const key = map[categoryId];
  if (key) {
    return t(key, safeLang);
  }
  return fallbackName || categoryId;
};

export const getLocalizedBranchName = (branch: { name: string; nameEn?: string }, lang: AppLanguage | string = 'ar'): string => {
  if (lang === 'en' && branch.nameEn && branch.nameEn.trim()) {
    return branch.nameEn;
  }
  return branch.name;
};

export const getLocalizedOrderStatus = (status: OrderStatus, lang: AppLanguage | string = 'ar'): string => {
  const key = `status_${status}`;
  return t(key, lang);
};

export const getLocalizedRoleName = (role: UserRole, lang: AppLanguage | string = 'ar'): string => {
  const key = `role_${role}`;
  return t(key, lang);
};
