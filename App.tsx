
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { POSSection } from './components/POSSection';
import { AdminSection } from './components/AdminSection';
import { CustomerSection } from './components/CustomerSection';
import { OrderHistorySection } from './components/OrderHistorySection';
import { KitchenDisplaySection } from './components/KitchenDisplaySection';
import { AIAssistant } from './components/AIAssistant';
import { PinModal } from './components/PinModal';
import { OrderModal } from './components/OrderModal';
import { ToastNotification } from './components/ToastNotification';
import { Product, CartItem, Customer, User, Tab, Order, PrinterSettings, KitchenScreen, OrderStatus, CategoryItem, ToastMessage, StoreSettings } from './types';
import { Bell, Search, Sun, Moon, LogOut, Loader, Wifi, WifiOff, ShoppingCart } from 'lucide-react';
import { 
  getProducts, getUsers, getCustomers, getOrders, getKitchenScreens, getOrderStatuses, getCategories, supabase, 
  addProductToDB, updateProductInDB, deleteProductFromDB,
  addOrderToDB, addUserToDB, deleteUserFromDB,
  addKitchenScreenToDB, deleteKitchenScreenFromDB,
  addOrderStatusToDB, deleteOrderStatusFromDB,
  updateOrderStatusInDB,
  addCategoryToDB, deleteCategoryFromDB
} from './services/supabaseClient';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_USERS, INITIAL_ORDERS, CATEGORIES } from './constants';

const App: React.FC = () => {
  // Global App State
  const [activeTab, setActiveTab] = useState<Tab>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Theme & Auth State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalTitle, setOrderModalTitle] = useState("Order Details");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Settings State 
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    printerName: 'Epson TM-T20III',
    ipAddress: '192.168.1.200',
    paperSize: '80mm',
    autoCut: true
  });
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: 'Cosmo Dumplings',
    address: '123 Flavor Street, Cape Town',
    contact: '021 555 0199',
    email: 'hello@cosmodumplings.co.za',
    footerMessage: 'Thank you for dining with us!',
    taxRate: 0.15
  });

  const [kitchenScreens, setKitchenScreens] = useState<KitchenScreen[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);

  // Derived State
  const lowStockItems = products.filter(p => p.stock < 10);
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  // Kitchen Count Calculation
  const kitchenStatusLabels = orderStatuses.length > 0 
    ? orderStatuses.filter(s => s.isKitchen).map(s => s.label) 
    : ['Pending', 'Preparing'];
  const activeKitchenOrdersCount = orders.filter(o => kitchenStatusLabels.includes(o.status)).length;

  // Initialization & Effects
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load Settings from LocalStorage
  useEffect(() => {
    const savedPrinter = localStorage.getItem('cosmo_printer_settings');
    if (savedPrinter) setPrinterSettings(JSON.parse(savedPrinter));

    const savedStore = localStorage.getItem('cosmo_store_settings');
    if (savedStore) setStoreSettings(JSON.parse(savedStore));
  }, []);

  // Save Settings to LocalStorage
  useEffect(() => {
    localStorage.setItem('cosmo_printer_settings', JSON.stringify(printerSettings));
  }, [printerSettings]);

  useEffect(() => {
    localStorage.setItem('cosmo_store_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Real-time Subscriptions
  useEffect(() => {
    if (!supabase) return;

    console.log("📡 Initializing Realtime Subscriptions...");

    // 1. Orders Channel
    const ordersChannel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Order;
          setOrders((prev) => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedOrder = payload.new as Order;
          setOrders((prev) => prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
        } else if (payload.eventType === 'DELETE') {
          setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
        }
      })
      .subscribe();

    // 2. Products Channel (Stock Updates)
    const productsChannel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
           const updatedProduct = payload.new as Product;
           setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        } else if (payload.eventType === 'INSERT') {
           setProducts(prev => [...prev, payload.new as Product]);
        } else if (payload.eventType === 'DELETE') {
           setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    // 3. Kitchen Screens & Statuses
    const screensChannel = supabase
      .channel('public:kitchen_screens')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_screens' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setKitchenScreens((prev) => [...prev, payload.new as KitchenScreen]);
        } else if (payload.eventType === 'DELETE') {
          setKitchenScreens((prev) => prev.filter((s) => s.id !== payload.old.id));
        }
      })
      .subscribe();

    const statusesChannel = supabase
      .channel('public:order_statuses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_statuses' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrderStatuses((prev) => [...prev, payload.new as OrderStatus]);
        } else if (payload.eventType === 'DELETE') {
          setOrderStatuses((prev) => prev.filter((s) => s.id !== payload.old.id));
        }
      })
      .subscribe();

    // 4. Categories Channel
    const categoriesChannel = supabase
      .channel('public:categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
         if (payload.eventType === 'INSERT') {
            setCategories(prev => [...prev, payload.new as CategoryItem].sort((a,b) => a.name.localeCompare(b.name)));
         } else if (payload.eventType === 'DELETE') {
            setCategories(prev => prev.filter(c => c.id !== payload.old.id));
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(screensChannel);
      supabase.removeChannel(statusesChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, []);

  // Data Loading
  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    if (supabase) {
      try {
        const [dbProducts, dbUsers, dbCustomers, dbOrders, dbScreens, dbStatuses, dbCategories] = await Promise.all([
          getProducts(),
          getUsers(),
          getCustomers(),
          getOrders(),
          getKitchenScreens(),
          getOrderStatuses(),
          getCategories()
        ]);

        let connectionActive = false;

        // Load Products
        if (dbProducts !== null && dbProducts.length > 0) { 
          setProducts(dbProducts); 
          connectionActive = true; 
        } else {
          // Fallback if DB is empty or disconnected
          setProducts(INITIAL_PRODUCTS);
        }

        // Load Users
        if (dbUsers !== null && dbUsers.length > 0) {
           setUsers(dbUsers);
        } else {
           setUsers(INITIAL_USERS);
        }

        // Load Customers
        if (dbCustomers !== null && dbCustomers.length > 0) {
           setCustomers(dbCustomers);
        } else {
           setCustomers(INITIAL_CUSTOMERS);
        }

        // Load Orders
        if (dbOrders !== null && dbOrders.length > 0) {
           setOrders(dbOrders);
        } else {
           // Only use initial orders if truly offline/empty to show history
           if (!connectionActive) setOrders(INITIAL_ORDERS);
        }

        if (dbScreens !== null) setKitchenScreens(dbScreens);
        if (dbStatuses !== null) setOrderStatuses(dbStatuses);
        
        // Load Categories
        if (dbCategories !== null && dbCategories.length > 0) {
           setCategories(dbCategories);
        } else {
           // Map string array to CategoryItem format
           setCategories(CATEGORIES.map((c, i) => ({ id: i + 1, name: c })));
        }

        setIsConnected(connectionActive);
      } catch (error) {
        console.error("❌ Failed to load data from Supabase.", error);
        setIsConnected(false);
        // Emergency Fallback
        setProducts(INITIAL_PRODUCTS);
        setUsers(INITIAL_USERS);
        setCustomers(INITIAL_CUSTOMERS);
        setOrders(INITIAL_ORDERS);
        setCategories(CATEGORIES.map((c, i) => ({ id: i + 1, name: c })));
      }
    }
    if (showLoading) setIsLoading(false);
  };

  const handleRefresh = async () => {
    await loadData(false);
    showToast('Data refreshed', 'info');
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('pos');
  };

  const addToCart = (product: Product, quantity: number = 1, notes: string = '', selectedOption: string = '') => {
    setCart(prev => {
      // Find item with same product ID AND same selected option
      const existingIndex = prev.findIndex(item => item.product.id === product.id && item.selectedOption === selectedOption);
      
      if (existingIndex >= 0) {
        const newCart = [...prev];
        const existingItem = newCart[existingIndex];
        newCart[existingIndex] = {
           ...existingItem,
           quantity: existingItem.quantity + quantity,
           notes: notes || existingItem.notes
        };
        return newCart;
      }
      
      return [...prev, { product, quantity, notes, selectedOption }];
    });
    
    showToast(`${quantity}x ${product.name} added`, 'success');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateCartNote = (index: number, note: string) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, notes: note };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  // Product Management
  const handleProductUpdate = async (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    if (isConnected) {
       await updateProductInDB(updatedProduct);
       showToast('Product updated successfully', 'success');
    }
  };

  const handleProductAdd = async (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
    if (isConnected) {
      const savedProduct = await addProductToDB(newProduct);
      if (savedProduct) {
         setProducts(prev => prev.map(p => p.id === newProduct.id ? savedProduct : p));
         showToast('Product added successfully', 'success');
      }
    }
  };

  const handleProductDelete = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    if (isConnected) {
       await deleteProductFromDB(id);
       showToast('Product deleted', 'info');
    }
  };

  // User Management
  const handleUserAdd = async (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    if (isConnected) {
       await addUserToDB(newUser);
       showToast('User added', 'success');
    }
  };

  const handleUserDelete = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (isConnected) {
       await deleteUserFromDB(id);
       showToast('User removed', 'info');
    }
  };

  // Settings & Categories
  const handleAddKitchenScreen = async (screen: KitchenScreen) => {
    if (isConnected) {
      const { id, ...screenData } = screen;
      await addKitchenScreenToDB(screenData);
      showToast('Screen added', 'success');
    }
  };

  const handleRemoveKitchenScreen = async (id: number) => {
    if (isConnected) await deleteKitchenScreenFromDB(id);
  };

  const handleAddOrderStatus = async (status: OrderStatus) => {
     if (isConnected) {
      const { id, ...statusData } = status;
      await addOrderStatusToDB(statusData);
      showToast('Status added', 'success');
    }
  };

  const handleRemoveOrderStatus = async (id: number) => {
    if (isConnected) await deleteOrderStatusFromDB(id);
  };

  const handleAddCategory = async (name: string) => {
    if (isConnected) {
       await addCategoryToDB(name);
       showToast('Category added', 'success');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (isConnected) {
       await deleteCategoryFromDB(id);
       showToast('Category deleted', 'info');
    }
  };

  const handleCheckout = async (
    method: 'Cash' | 'Card', 
    type: 'Dine-In' | 'Takeaway', 
    table: number,
    tendered?: number,
    change?: number
  ) => {
    const getPriceModifier = (option?: string) => {
      if (!option) return 0;
      let total = 0;
      // Loop through all matches of price modifiers in the string
      const regex = /\(\+R([\d.]+)\)/g;
      let match;
      while ((match = regex.exec(option)) !== null) {
        total += parseFloat(match[1]);
      }
      return total;
    };

    const total = cart.reduce((acc, item) => {
      const modifier = getPriceModifier(item.selectedOption);
      return acc + ((item.product.price + modifier) * item.quantity);
    }, 0);

    // Use store tax rate settings
    const tax = total * storeSettings.taxRate;
    const totalWithTax = total + tax;
    
    const startStatus = orderStatuses.find(s => s.label === 'Pending') ? 'Pending' : 'Preparing';

    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      items: [...cart],
      total: totalWithTax,
      paymentMethod: method,
      type: type,
      tableNumber: type === 'Dine-In' ? table : undefined,
      date: new Date().toLocaleString(),
      status: startStatus,
      orderBy: currentUser?.name || 'Staff',
      openDrawer: method === 'Cash',
      tendered: tendered,
      change: change
    };

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    
    // Update Stock Optimistically
    const newProducts = products.map(p => {
      // Find all cart items that reference this product
      const productInCartQty = cart
        .filter(c => c.product.id === p.id)
        .reduce((sum, c) => sum + c.quantity, 0);
      
      if (productInCartQty > 0) {
        const newStock = Math.max(0, p.stock - productInCartQty);
        if (isConnected) updateProductInDB({ ...p, stock: newStock });
        return { ...p, stock: newStock };
      }
      return p;
    });
    setProducts(newProducts);

    if (isConnected) await addOrderToDB(newOrder);

    setSelectedOrder(newOrder);
    setOrderModalTitle("Payment Successful!");
    setIsOrderModalOpen(true);
    showToast('Order placed successfully!', 'success');
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setOrderModalTitle("Order Details");
    setIsOrderModalOpen(true);
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus?: string) => {
    const nextStatus = newStatus || 'Completed';
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: nextStatus } : order));
    
    if (isConnected) {
        await updateOrderStatusInDB(orderId, nextStatus);
        showToast(`Order marked as ${nextStatus}`, 'info');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
           <Loader className="w-12 h-12 animate-spin mb-4 text-cosmo-red" />
           <p>Connecting to Database...</p>
        </div>
      );
    }

    if (!isConnected && products.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
            <h2 className="text-2xl font-bold mb-2">No Connection & No Data</h2>
            <p className="mb-4">Could not load data from Supabase and no local data is available.</p>
            <p className="text-sm">Please ensure you have run the setup SQL script in your Supabase dashboard.</p>
         </div>
      );
    }

    switch (activeTab) {
      case 'pos':
        return (
          <POSSection 
            products={products}
            cart={cart}
            categories={categories}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            onUpdateQuantity={updateCartQuantity}
            onUpdateNote={updateCartNote}
            onClearCart={clearCart}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            onSetCategoryFilter={setCategoryFilter}
            customers={customers}
            onCheckout={handleCheckout}
          />
        );
      case 'products':
      case 'users':
      case 'stock':
      case 'settings':
        return (
          <AdminSection 
            activeSubTab={activeTab}
            products={products}
            users={users}
            currentUser={currentUser}
            categories={categories}
            onUpdateProduct={handleProductUpdate}
            onAddProduct={handleProductAdd}
            onDeleteProduct={handleProductDelete}
            onAddUser={handleUserAdd}
            onDeleteUser={handleUserDelete}
            printerSettings={printerSettings}
            onUpdatePrinterSettings={setPrinterSettings}
            storeSettings={storeSettings}
            onUpdateStoreSettings={setStoreSettings}
            kitchenScreens={kitchenScreens}
            onAddKitchenScreen={handleAddKitchenScreen}
            onRemoveKitchenScreen={handleRemoveKitchenScreen}
            orderStatuses={orderStatuses}
            onAddOrderStatus={handleAddOrderStatus}
            onRemoveOrderStatus={handleRemoveOrderStatus}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
      case 'customers':
        return <CustomerSection customers={customers} />;
      case 'history':
        return <OrderHistorySection orders={orders} orderStatuses={orderStatuses} onViewDetails={handleViewOrder} />;
      case 'kitchen':
        return <KitchenDisplaySection orders={orders} orderStatuses={orderStatuses} onCompleteOrder={handleOrderStatusUpdate} />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex h-screen w-full bg-gray-50 dark:bg-cosmo-dark text-gray-900 dark:text-white overflow-hidden selection:bg-cosmo-red selection:text-white font-sans transition-colors duration-300 ${theme}`}>
      
      {!currentUser && !isLoading && users.length > 0 && (
        <PinModal users={users} onSuccess={handleLogin} />
      )}

      <ToastNotification toasts={toasts} onDismiss={dismissToast} />

      <OrderModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        order={selectedOrder} 
        title={orderModalTitle}
        storeSettings={storeSettings}
      />

      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isConnected={isConnected} 
        kitchenOrderCount={activeKitchenOrdersCount}
        onRefresh={handleRefresh}
        currentUser={currentUser}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-auto min-h-16 md:h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-cosmo-surface/50 backdrop-blur-md flex flex-wrap md:flex-nowrap items-center justify-between px-4 md:px-6 py-2 shrink-0 z-20 transition-colors duration-300 gap-2">
          
          <div className="flex items-center gap-4 w-full md:w-1/2 lg:w-1/3 order-2 md:order-1">
            {activeTab === 'pos' && (
              <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search dumplings..." 
                    className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cosmo-red transition-colors text-gray-900 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-cosmo-red cursor-pointer hidden sm:block"
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            )}
            {activeTab !== 'pos' && (
              <h1 className="text-xl font-bold capitalize text-gray-900 dark:text-white">{activeTab === 'history' ? 'Order History' : activeTab === 'kitchen' ? 'Kitchen Display' : `${activeTab} Management`}</h1>
            )}
          </div>

          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-end order-1 md:order-2">
            
            <div className="flex items-center gap-2 md:gap-4">
              {/* Cart Badge - Visible globally */}
              <div className="relative cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors" onClick={() => activeTab !== 'pos' && setActiveTab('pos')}>
                 <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                 {totalCartItems > 0 && (
                   <span className="absolute top-0 right-0 bg-cosmo-red text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-cosmo-dark">
                     {totalCartItems}
                   </span>
                 )}
              </div>

              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>

              <div className="relative group cursor-pointer">
                <Bell className={`w-5 h-5 ${lowStockItems.length > 0 ? 'text-cosmo-red animate-pulse' : 'text-gray-400'}`} />
                {lowStockItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-cosmo-red rounded-full"></span>
                )}
                <div className="absolute right-0 top-8 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Low Stock Alerts</h4>
                  {lowStockItems.length === 0 ? (
                    <p className="text-xs text-gray-500">All stock levels good.</p>
                  ) : (
                    <ul className="space-y-1">
                      {lowStockItems.map(p => (
                        <li key={p.id} className="text-xs text-cosmo-accent flex justify-between">
                          <span>{p.name}</span>
                          <span>{p.stock} left</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser?.name || 'Guest'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.role || 'Locked'}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-cosmo-red to-purple-600 flex items-center justify-center font-bold text-white shadow-md cursor-pointer hover:ring-2 ring-cosmo-red ring-offset-2 ring-offset-white dark:ring-offset-cosmo-dark transition-all" onClick={handleLogout} title="Click to Logout">
                {currentUser ? currentUser.name.charAt(0) : <LogOut className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-cosmo-dark transition-colors duration-300">
          {renderContent()}
        </div>
      </main>
      
      <AIAssistant isOpen={isAIOpen} toggleOpen={() => setIsAIOpen(!isAIOpen)} />
    </div>
  );
};

export default App;
