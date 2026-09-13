import React, { useState } from 'react';
import { 
  Layers, 
  Kanban, 
  Package, 
  Palette, 
  Users, 
  DollarSign, 
  ArrowRight, 
  Store, 
  Code2, 
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Bike,
  UserCheck
} from 'lucide-react';
import { AppUser, Order, Product, CategoryConfig, BannerConfig, ComplaintItem } from '../../types';
import { canAccessDeveloperCenter } from '../auth/permissions';
import { OperationsKanban } from './OperationsKanban';
import { CatalogManager } from './CatalogManager';
import { AppBuilderCMS } from './AppBuilderCMS';
import { CrmManager } from './CrmManager';
import { FinanceAnalytics } from './FinanceAnalytics';
import { MerchantsManagement } from './MerchantsManagement';
import { DriversManagement } from './DriversManagement';

interface AdminControlCenterProps {
  currentUser: AppUser;
  allUsers: AppUser[];
  orders: Order[];
  products: Product[];
  categories: CategoryConfig[];
  banners: BannerConfig[];
  complaints: ComplaintItem[];
  onUpdateOrder: (order: Order) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateBanners: (banners: BannerConfig[]) => void;
  onUpdateCategories: (categories: CategoryConfig[]) => void;
  onUpdateUser: (user: AppUser) => void;
  onUpdateComplaint: (complaint: ComplaintItem) => void;
  onBackToApp: () => void;
  onOpenDeveloperCenter?: () => void;
}

export const AdminControlCenter: React.FC<AdminControlCenterProps> = ({
  currentUser,
  allUsers,
  orders,
  products,
  categories,
  banners,
  complaints,
  onUpdateOrder,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateBanners,
  onUpdateCategories,
  onUpdateUser,
  onUpdateComplaint,
  onBackToApp,
  onOpenDeveloperCenter,
}) => {
  const [activeTab, setActiveTab] = useState<'operations' | 'catalog' | 'merchants' | 'drivers' | 'cms' | 'crm' | 'finance'>('operations');

  const drivers = allUsers.filter((u) => u.role === 'driver');
  const merchants = allUsers.filter((u) => u.role === 'merchant');
  const pendingMerchantsCount = merchants.filter((m) => m.status === 'pending').length;
  const pendingDriversCount = drivers.filter((d) => d.status === 'pending').length;
  const canDev = canAccessDeveloperCenter(currentUser.role);

  return (
    <div className="flex flex-col flex-1 bg-[#07131E] text-white min-h-screen font-sans text-right">
      {/* SaaS Admin Header */}
      <header className="bg-[#0B1E2E] border-b border-emerald-900/40 sticky top-0 z-30 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
              title="العودة للمتجر الرئيسي"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h1 className="text-sm sm:text-base font-black text-white">
                  مركز إدارة وتشغيل الهايبر
                </h1>
                <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono">
                  العمليات التشغيلية
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                إدارة الطلبات، التجهيز، الكتالوج، المحتوى، علاقات العملاء، والتحليلات المالية.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {canDev && onOpenDeveloperCenter && (
              <button
                onClick={onOpenDeveloperCenter}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>لوحة المطور والأمان</span>
              </button>
            )}

            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-amber-300" />
              <span>عرض المتجر</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto flex items-center gap-1 border-t border-white/5 pt-1 pb-1">
          <button
            onClick={() => setActiveTab('operations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'operations'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Kanban className="w-4 h-4 text-emerald-400" />
            <span>لوحة العمليات والطلبات ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4 text-cyan-400" />
            <span>الكتالوج والأقسام ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('merchants')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer relative ${
              activeTab === 'merchants'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Store className="w-4 h-4 text-yellow-400" />
            <span>التجار والشركاء ({merchants.length})</span>
            {pendingMerchantsCount > 0 && (
              <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {pendingMerchantsCount} معلق
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('drivers')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer relative ${
              activeTab === 'drivers'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bike className="w-4 h-4 text-green-400" />
            <span>مناديب التوصيل ({drivers.length})</span>
            {pendingDriversCount > 0 && (
              <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {pendingDriversCount} معلق
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cms')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cms'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span>منشئ ومصمم واجهة التطبيق</span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'crm'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>علاقات العملاء والشكاوى ({complaints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'finance'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>المالية وبوابات الدفع</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1">
        {activeTab === 'operations' && (
          <OperationsKanban
            orders={orders}
            drivers={drivers}
            onUpdateOrder={onUpdateOrder}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'catalog' && (
          <CatalogManager
            products={products}
            categories={categories}
            currentUser={currentUser}
            onAddProduct={onAddProduct}
            onUpdateProduct={onUpdateProduct}
            onDeleteProduct={onDeleteProduct}
            onUpdateCategories={onUpdateCategories}
          />
        )}
        {activeTab === 'merchants' && (
          <MerchantsManagement
            currentUser={currentUser}
            allUsers={allUsers}
            products={products}
            onUpdateUser={onUpdateUser}
          />
        )}
        {activeTab === 'drivers' && (
          <DriversManagement
            currentUser={currentUser}
            allUsers={allUsers}
            orders={orders}
            onUpdateUser={onUpdateUser}
          />
        )}
        {activeTab === 'cms' && (
          <AppBuilderCMS
            banners={banners}
            categories={categories}
            currentUser={currentUser}
            onUpdateBanners={onUpdateBanners}
            onUpdateCategories={onUpdateCategories}
          />
        )}
        {activeTab === 'crm' && (
          <CrmManager
            users={allUsers}
            complaints={complaints}
            orders={orders}
            currentUser={currentUser}
            onUpdateUser={onUpdateUser}
            onUpdateComplaint={onUpdateComplaint}
          />
        )}
        {activeTab === 'finance' && (
          <FinanceAnalytics
            orders={orders}
            currentUser={currentUser}
          />
        )}
      </main>
    </div>
  );
};
