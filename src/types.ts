export type UserRole = 
  | 'developer'
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'operations'
  | 'finance'
  | 'merchant'
  | 'driver'
  | 'support'
  | 'customer';

export interface PolicyContent {
  privacyPolicyAr: string;
  privacyPolicyEn?: string;
  returnPolicyAr: string;
  returnPolicyEn?: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  status?: 'active' | 'pending' | 'suspended';
  avatar?: string;
  createdAt?: string;
  savedAddresses?: string[];
  address?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  ordersCount?: number;
  preferredBranchId?: string;
  // Customer fields
  loyaltyPoints?: number;
  walletBalance?: number;
  totalOrdersCount?: number;
  // Driver specific fields
  vehicleType?: string;
  vehiclePlate?: string;
  nationalId?: string;
  driverRating?: number;
  completedDeliveries?: number;
  driverEarnings?: number;
  isOnline?: boolean;
  currentBranchId?: string;
  // Merchant specific fields
  storeName?: string;
  commercialId?: string;
  merchantCategory?: string;
  merchantBalance?: number;
  totalProductsCount?: number;
}

export type ProductCurrency = 'YER' | 'SAR';

export interface Product {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  currency?: ProductCurrency; // 'YER' (ريال يمني) or 'SAR' (ريال سعودي)
  unit: string;
  unitEn?: string;
  image: string;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  stockCount: number;
  badge?: string;
  badgeEn?: string;
  origin?: string;
  originEn?: string;
  calories?: string;
  caloriesEn?: string;
  barcode?: string;
  description: string;
  descriptionEn?: string;
  buyersYesterday?: number;
  socialProof?: string;
  socialProofEn?: string;
  isDailyDeal?: boolean;
  discountPercent?: number;
  merchantId?: string; // ID of merchant who added it (if null, hypermarket central)
  merchantName?: string;
  volumeDiscount?: {
    minQty: number;
    discountPercent: number;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Recipe {
  id: string;
  title: string;
  titleEn?: string;
  prepTime?: string;
  prepTimeEn?: string;
  cookTime?: string;
  cookTimeEn?: string;
  cookingTime?: string;
  cookingTimeEn?: string;
  difficulty: 'سهل' | 'متوسط' | 'صعب' | string;
  difficultyEn?: string;
  servings: string | number;
  servingsEn?: string | number;
  image: string;
  description: string;
  descriptionEn?: string;
  instructions?: string[];
  instructionsEn?: string[];
  ingredients: {
    productId?: string;
    name: string;
    nameEn?: string;
    amount?: string;
    amountEn?: string;
    quantity?: string;
    price?: number;
  }[];
}

export interface Branch {
  id: string;
  name: string;
  nameEn?: string;
  city: string;
  cityEn?: string;
  address: string;
  lat: number;
  lng: number;
  deliveryTime: string;
  isOpen: boolean;
  distanceKm: number;
  phone?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  deliveryAddress: string;
  paymentMethod: string;
  branchName: string;
  pickupBranchId?: string;
  pickupAddress?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  vehicleInfo?: string;
  driverEarnings?: number;
  deliveryFeePayout?: number;
  acceptedDriverId?: string;
  acceptedDriverName?: string;
  acceptedDriverPhone?: string;
  acceptedDriverVehicle?: string;
  customerName?: string;
  customerPhone?: string;
  customerNotes?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  estimatedDeliveryMinutes: number;
}

export type OrderStatus =
  | 'DRAFT'
  | 'CREATED'
  | 'PAID'
  | 'STORE_PICKING'
  | 'READY_FOR_PICKUP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DeveloperInfo {
  developerName: string;
  developerTitle: string;
  email: string;
  appName: string;
  appEnglishName: string;
  version: string;
  buildNumber: number;
  packageId: string;
  supportedOS: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'offer' | 'order' | 'wallet' | 'system' | 'promo';
}

export interface CategoryConfig {
  id: string;
  name: string;
  nameEn?: string;
  icon: string;
  color: string;
  order: number;
  isVisible: boolean;
}

export interface BannerConfig {
  id: string;
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  buttonText?: string;
  buttonTextEn?: string;
  bgGradient?: string;
  tag: string;
  tagEn?: string;
  isVisible?: boolean;
  isActive?: boolean;
  imageUrl?: string;
  color?: string;
  icon?: string;
  categoryTarget?: string;
  order?: number;
  buttonVariant?: 'pill-white' | 'pill-gold' | 'pill-emerald' | 'pill-dark' | 'rounded-white' | 'rounded-gold' | 'rounded-emerald' | 'outline-white';
}

export interface SubCategoryItem {
  id: string;
  name: string;
  nameEn?: string;
  icon?: string;
  image?: string;
  categoryRef?: string;
}

export interface DepartmentSection {
  id: string;
  title: string;
  titleEn?: string;
  category?: string;
  categoryRef?: string;
  emoji?: string;
  subCategories?: SubCategoryItem[];
  subcategories?: SubCategoryItem[];
}

export interface ComplaintItem {
  id: string;
  customerName: string;
  customerPhone: string;
  orderId?: string;
  type?: string;
  category?: string;
  title?: string;
  subject?: string;
  description?: string;
  details?: string;
  status: 'open' | 'pending' | 'in_progress' | 'resolved';
  priority?: 'high' | 'medium' | 'low';
  createdAt: string;
  adminResponse?: string;
  adminReply?: string;
  updatedAt?: string;
}

export type AppLanguage = 'ar' | 'en';

export interface PaymentMethodConfig {
  id: string;
  key: string;
  name: string;
  nameEn: string;
  bankOrIssuer: string;
  accountNumber: string;
  badge?: string;
  color: string;
  textColor?: string;
  isEnabled: boolean;
  isCod?: boolean;
  minOrdersForCod?: number;
  order: number;
}

