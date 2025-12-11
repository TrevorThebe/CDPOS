
import React from 'react';
import { LayoutDashboard, Users, Box, Coffee, ShoppingBag, History, Settings, Monitor, Wifi, WifiOff } from 'lucide-react';
import { Tab, User } from '../types';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isConnected?: boolean;
  kitchenOrderCount?: number;
  onRefresh?: () => void;
  currentUser: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isConnected = true, kitchenOrderCount = 0, onRefresh, currentUser }) => {
  const isAdmin = currentUser?.role === 'Admin';

  const menuItems = [
    { id: 'pos', label: 'Point of Sale', icon: ShoppingBag, allowed: true },
    { id: 'products', label: 'Products', icon: Coffee, allowed: isAdmin },
    { id: 'stock', label: 'Stock', icon: Box, allowed: true }, // Staff can view stock
    { id: 'history', label: 'Order History', icon: History, allowed: true },
    { id: 'customers', label: 'Customers', icon: Users, allowed: true },
    { id: 'users', label: 'Staff', icon: LayoutDashboard, allowed: isAdmin },
    { id: 'kitchen', label: 'Kitchen Display', icon: Monitor, allowed: true },
    { id: 'settings', label: 'Settings', icon: Settings, allowed: isAdmin },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId as Tab);
    if (tabId === 'kitchen' && onRefresh) {
       onRefresh();
    }
  };

  return (
    <aside className="w-20 md:w-64 bg-white dark:bg-cosmo-surface border-r border-gray-200 dark:border-gray-800 flex flex-col items-center md:items-stretch py-6 z-30 shadow-xl transition-colors duration-300 shrink-0">
      <div className="px-4 mb-10 flex flex-col items-center md:items-start">
        <div className="h-10 w-10 bg-cosmo-red rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cosmo-red/40 mb-2 shrink-0">
          CD
        </div>
        <h1 className="hidden md:block text-lg font-bold tracking-tight text-gray-900 dark:text-white whitespace-nowrap">
          COSMO <span className="text-cosmo-red">POS</span>
        </h1>
        <p className="hidden md:block text-xs text-gray-500 whitespace-nowrap">Dumplings & Co.</p>
      </div>

      <nav className="flex-1 w-full space-y-2 px-2">
        {menuItems.filter(item => item.allowed).map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${isActive 
                  ? 'bg-cosmo-red text-white shadow-lg shadow-cosmo-red/25' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              title={item.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                {item.id === 'kitchen' && kitchenOrderCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-cosmo-surface">
                    {kitchenOrderCount}
                  </span>
                )}
              </div>
              <span className="hidden md:block font-medium truncate">{item.label}</span>
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full hidden md:block"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-4 w-full">
        <div className={`rounded-xl p-4 border hidden md:block transition-colors duration-300 ${isConnected ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'}`}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">System Status</p>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Database Connected</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-xs font-medium text-red-700 dark:text-red-400">Offline Mode</span>
              </>
            )}
          </div>
        </div>
        
        <div className="md:hidden flex justify-center mt-4">
           {isConnected ? (
             <Wifi className="w-4 h-4 text-green-500" />
           ) : (
             <WifiOff className="w-4 h-4 text-red-500" />
           )}
        </div>
      </div>
    </aside>
  );
};
