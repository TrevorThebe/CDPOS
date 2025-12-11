import React, { useState } from 'react';
import { Product, User, Tab, PrinterSettings, KitchenScreen, OrderStatus, CategoryItem, StoreSettings } from '../types';
import { Plus, Edit2, Trash, Save, X, Bot, Upload, Printer, Wifi, Shield, Monitor, Tv, Search, ExternalLink, UserPlus, List, Flag, Database, Copy, Check, Calendar, AlertTriangle, Building, RotateCw, Link } from 'lucide-react';
import { generateProductDescription } from '../services/geminiService';

interface AdminSectionProps {
  activeSubTab: Tab;
  products: Product[];
  users: User[];
  currentUser?: User | null;
  categories: CategoryItem[];
  onUpdateProduct: (p: Product) => void;
  onAddProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddUser?: (u: User) => void;
  onDeleteUser?: (id: string) => void;
  // Settings Props
  printerSettings?: PrinterSettings;
  onUpdatePrinterSettings?: (settings: PrinterSettings) => void;
  storeSettings?: StoreSettings;
  onUpdateStoreSettings?: (settings: StoreSettings) => void;
  kitchenScreens?: KitchenScreen[];
  onAddKitchenScreen?: (screen: KitchenScreen) => void;
  onRemoveKitchenScreen?: (id: number) => void;
  // Status & Category Props
  orderStatuses?: OrderStatus[];
  onAddOrderStatus?: (status: OrderStatus) => void;
  onRemoveOrderStatus?: (id: number) => void;
  onAddCategory?: (name: string) => void;
  onDeleteCategory?: (id: number) => void;
}

const DB_SETUP_SCRIPT = `-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Products Table
create table if not exists products (
  id text primary key,
  name text not null,
  price numeric not null,
  category text not null,
  description text,
  stock integer default 0,
  image text,
  "expiryDate" text,
  options text[]
);

-- Add expiryDate column if it doesn't exist (Migration)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='expiryDate') then 
    alter table products add column "expiryDate" text; 
  end if; 
end $$;

-- Add options column if it doesn't exist (Migration)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='options') then 
    alter table products add column options text[]; 
  end if; 
end $$;

-- Create Users Table
create table if not exists users (
  id text primary key,
  name text not null,
  role text check (role in ('Admin', 'Staff')),
  pin text not null
);

-- Create Customers Table
create table if not exists customers (
  id text primary key,
  name text not null,
  phone text,
  address text,
  "totalOrders" integer default 0,
  "lastOrderDate" text
);

-- Create Order Statuses Table
create table if not exists order_statuses (
  id bigint primary key,
  label text not null,
  color text not null,
  "isKitchen" boolean default false,
  "isFinal" boolean default false
);

-- Seed Order Statuses
insert into order_statuses (id, label, color, "isKitchen", "isFinal")
values 
  (1, 'Pending', 'bg-blue-100 text-blue-700', true, false),
  (2, 'Preparing', 'bg-yellow-100 text-yellow-700', true, false),
  (3, 'Ready', 'bg-green-100 text-green-700', false, false),
  (4, 'Completed', 'bg-gray-100 text-gray-700', false, true),
  (5, 'Cancelled', 'bg-red-100 text-red-700', false, true)
on conflict (id) do nothing;

-- Create Orders Table
create table if not exists orders (
  id text primary key,
  total numeric not null,
  "paymentMethod" text,
  type text,
  "tableNumber" integer,
  date text,
  status text,
  "orderBy" text,
  items jsonb,
  tendered numeric,
  change numeric,
  "openDrawer" boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add openDrawer column if it doesn't exist (Migration)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='openDrawer') then 
    alter table orders add column "openDrawer" boolean default false; 
  end if; 
end $$;

-- Create Kitchen Screens Table
create table if not exists kitchen_screens (
  id bigint primary key,
  name text not null,
  ip text not null
);

-- Create Categories Table
create table if not exists categories (
  id bigint primary key generated always as identity,
  name text not null unique
);

-- Seed Categories
insert into categories (name)
values ('Dumplings'), ('Sides'), ('Drinks'), ('Dessert')
on conflict (name) do nothing;
`;

export const AdminSection: React.FC<AdminSectionProps> = ({ 
  activeSubTab, 
  products, 
  users, 
  currentUser,
  categories,
  onUpdateProduct, 
  onAddProduct,
  onDeleteProduct, 
  onAddUser,
  onDeleteUser,
  printerSettings,
  onUpdatePrinterSettings,
  storeSettings,
  onUpdateStoreSettings,
  kitchenScreens,
  onAddKitchenScreen,
  onRemoveKitchenScreen,
  orderStatuses,
  onAddOrderStatus,
  onRemoveOrderStatus,
  onAddCategory,
  onDeleteCategory
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProductMode, setNewProductMode] = useState(false);
  const [tempProduct, setTempProduct] = useState<Partial<Product>>({});
  const [tempOptionsStr, setTempOptionsStr] = useState(''); // Local state for comma separated options
  const [aiLoading, setAiLoading] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  
  // Local state for settings
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenIP, setNewScreenIP] = useState('');
  const [screenSearch, setScreenSearch] = useState('');
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('bg-gray-100 text-gray-700');
  const [newStatusIsKitchen, setNewStatusIsKitchen] = useState(false);
  const [newStatusIsFinal, setNewStatusIsFinal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isScanningPrinters, setIsScanningPrinters] = useState(false);
  const [savingStore, setSavingStore] = useState(false);

  // Local state for users
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [tempUser, setTempUser] = useState<Partial<User>>({ role: 'Staff' });

  // SQL Copy state
  const [copied, setCopied] = useState(false);

  // Expiring items calculation
  const getExpiringItems = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return products.filter(p => {
      if (!p.expiryDate) return false;
      const expDate = new Date(p.expiryDate);
      return expDate <= nextWeek;
    }).sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setTempProduct({ ...product });
    setTempOptionsStr(product.options ? product.options.join(', ') : '');
    setNewProductMode(false);
    setShowImageUrlInput(false);
  };

  const startNew = () => {
    setNewProductMode(true);
    setEditingId('new');
    setTempProduct({
      name: '',
      price: 0,
      category: categories[0]?.name || 'Dumplings',
      description: '',
      stock: 0,
      image: 'https://images.unsplash.com/photo-1541696490865-9810f788fb3c?auto=format&fit=crop&q=80&w=200&h=200',
      expiryDate: '',
      options: []
    });
    setTempOptionsStr('');
    setShowImageUrlInput(false);
  };

  const saveProduct = () => {
    // Process options string into array
    const optionsArray = tempOptionsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const finalProduct = { ...tempProduct, options: optionsArray };

    if (newProductMode) {
      const p = { ...finalProduct, id: Math.random().toString(36).substr(2, 9) } as Product;
      onAddProduct(p);
    } else {
      onUpdateProduct(finalProduct as Product);
    }
    setEditingId(null);
    setNewProductMode(false);
    setShowImageUrlInput(false);
  };

  const handleSaveUser = () => {
    if (tempUser.name && tempUser.pin && onAddUser) {
      onAddUser({
        id: `u-${Date.now()}`,
        name: tempUser.name,
        role: tempUser.role || 'Staff',
        pin: tempUser.pin
      });
      setTempUser({ role: 'Staff' });
      setNewUserOpen(false);
    }
  };

  const handleAiDescription = async () => {
    if (!tempProduct.name || !tempProduct.category) return;
    setAiLoading(true);
    const desc = await generateProductDescription(tempProduct.name, tempProduct.category);
    setTempProduct(prev => ({ ...prev, description: desc }));
    setAiLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempProduct(prev => ({ ...prev, image: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAddScreen = () => {
    if (newScreenName && newScreenIP && onAddKitchenScreen) {
      onAddKitchenScreen({ id: Date.now(), name: newScreenName, ip: newScreenIP });
      setNewScreenName('');
      setNewScreenIP('');
    }
  };

  const handleAddStatus = () => {
    if (newStatusLabel && onAddOrderStatus) {
      onAddOrderStatus({
        id: Date.now(),
        label: newStatusLabel,
        color: newStatusColor,
        isKitchen: newStatusIsKitchen,
        isFinal: newStatusIsFinal
      });
      setNewStatusLabel('');
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName && onAddCategory) {
      onAddCategory(newCategoryName);
      setNewCategoryName('');
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(DB_SETUP_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scanPrinters = () => {
    setIsScanningPrinters(true);
    // Simulate network scan
    setTimeout(() => {
      setIsScanningPrinters(false);
      if(onUpdatePrinterSettings && printerSettings) {
        // Just mock updating to a found printer or show alert
        alert("Found printer: Epson TM-T88V at 192.168.1.150");
        onUpdatePrinterSettings({...printerSettings, ipAddress: "192.168.1.150", printerName: "Epson TM-T88V"});
      }
    }, 2000);
  };

  const handleSaveStoreSettings = () => {
    setSavingStore(true);
    // Simulate save delay for feedback
    setTimeout(() => {
      setSavingStore(false);
    }, 1500);
  };

  const filteredScreens = kitchenScreens?.filter(s => 
    s.name.toLowerCase().includes(screenSearch.toLowerCase()) || 
    s.ip.includes(screenSearch)
  ) || [];

  const launchProjectorMode = () => {
    alert("Launching Kitchen Display System in Projector Mode...");
    window.open(window.location.href, '_blank', 'popup=yes,width=1920,height=1080');
  };

  if (activeSubTab === 'users') {
    return (
      <div className="p-4 md:p-10 flex flex-col items-center justify-start h-full text-gray-500 overflow-y-auto w-full">
         <div className="w-full max-w-4xl flex justify-between items-center mb-6">
           <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Registration</h2>
             <p className="text-gray-600 dark:text-gray-400">Manage staff access and register new users.</p>
           </div>
           <button 
             onClick={() => setNewUserOpen(!newUserOpen)}
             className="bg-cosmo-red hover:bg-rose-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all"
           >
             <UserPlus className="w-4 h-4" />
             {newUserOpen ? 'Close Form' : 'Register New User'}
           </button>
         </div>

         {newUserOpen && (
           <div className="w-full max-w-4xl bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4">
             <h3 className="font-bold text-gray-900 dark:text-white mb-4">New User Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <input 
                 type="text" 
                 placeholder="Staff Name" 
                 value={tempUser.name || ''}
                 onChange={e => setTempUser({...tempUser, name: e.target.value})}
                 className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-cosmo-red outline-none"
               />
               <select
                 value={tempUser.role}
                 onChange={e => setTempUser({...tempUser, role: e.target.value as 'Admin' | 'Staff'})}
                 className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-cosmo-red outline-none"
               >
                 <option value="Staff">Staff</option>
                 <option value="Admin">Admin</option>
               </select>
               <input 
                 type="text" 
                 placeholder="4-Digit PIN" 
                 maxLength={4}
                 value={tempUser.pin || ''}
                 onChange={e => setTempUser({...tempUser, pin: e.target.value})}
                 className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-cosmo-red outline-none font-mono tracking-widest"
               />
             </div>
             <div className="flex justify-end mt-4">
               <button 
                 onClick={handleSaveUser}
                 disabled={!tempUser.name || !tempUser.pin || tempUser.pin.length !== 4}
                 className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
               >
                 Save User
               </button>
             </div>
           </div>
         )}

         <div className="w-full max-w-4xl bg-white dark:bg-cosmo-surface rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">PIN</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{u.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs border ${u.role === 'Admin' ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">••••</td>
                    <td className="px-6 py-4 text-right">
                      {currentUser?.id !== u.id && (
                        <button 
                          onClick={() => onDeleteUser?.(u.id)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete User"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
    );
  }

  if (activeSubTab === 'settings') {
    if (currentUser?.role !== 'Admin') {
      return (
        <div className="p-10 flex flex-col items-center justify-center h-full text-gray-500">
          <Shield className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Settings are restricted to Admin users only.</p>
        </div>
      );
    }
    return (
      <div className="p-4 md:p-8 h-full overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">System Settings</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl pb-12">
          
          {/* Store Information Settings */}
          <div className="bg-white dark:bg-cosmo-surface rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm col-span-1 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
               <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                 <Building className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Store Information</h3>
                 <p className="text-xs text-gray-500">Receipt details, contact info and discounts.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name</label>
                 <input 
                   type="text" 
                   value={storeSettings?.name || ''}
                   onChange={(e) => onUpdateStoreSettings?.({...storeSettings!, name: e.target.value})}
                   className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
                 <input 
                   type="text" 
                   value={storeSettings?.contact || ''}
                   onChange={(e) => onUpdateStoreSettings?.({...storeSettings!, contact: e.target.value})}
                   className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                 <input 
                   type="text" 
                   value={storeSettings?.address || ''}
                   onChange={(e) => onUpdateStoreSettings?.({...storeSettings!, address: e.target.value})}
                   className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email / Website</label>
                 <input 
                   type="text" 
                   value={storeSettings?.email || ''}
                   onChange={(e) => onUpdateStoreSettings?.({...storeSettings!, email: e.target.value})}
                   className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red"
                 />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt Footer / Discount Message</label>
                 <textarea 
                   value={storeSettings?.footerMessage || ''}
                   onChange={(e) => onUpdateStoreSettings?.({...storeSettings!, footerMessage: e.target.value})}
                   rows={2}
                   className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red resize-none"
                 />
               </div>
               <div className="md:col-span-2 flex justify-end mt-2">
                 <button 
                   onClick={handleSaveStoreSettings}
                   className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition-all ${savingStore ? 'bg-green-600' : 'bg-cosmo-red hover:bg-rose-700'}`}
                 >
                   {savingStore ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                   {savingStore ? 'Saved!' : 'Save Changes'}
                 </button>
               </div>
            </div>
          </div>

          {/* Categories Management */}
          <div className="bg-white dark:bg-cosmo-surface rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
               <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
                 <List className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Menu Categories</h3>
                 <p className="text-xs text-gray-500">Manage food and drink categories.</p>
               </div>
             </div>
             
             <div className="space-y-4">
               <div className="flex gap-2">
                 <input 
                   type="text"
                   value={newCategoryName}
                   onChange={(e) => setNewCategoryName(e.target.value)}
                   placeholder="New Category Name"
                   className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cosmo-red text-gray-900 dark:text-white"
                 />
                 <button onClick={handleAddCategory} className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded-lg text-sm font-bold">Add</button>
               </div>

               <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                 {categories.map(cat => (
                   <div key={cat.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</span>
                      <button onClick={() => onDeleteCategory?.(cat.id)} className="text-red-500 hover:text-red-700 p-1"><Trash className="w-4 h-4" /></button>
                   </div>
                 ))}
               </div>
             </div>
          </div>

          {/* Printer Config */}
          <div className="bg-white dark:bg-cosmo-surface rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
               <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                 <Printer className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Printer Setup</h3>
                 <p className="text-xs text-gray-500">Configure receipt printer hardware.</p>
               </div>
             </div>

             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Printer Name</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={printerSettings?.printerName || ''}
                      onChange={(e) => onUpdatePrinterSettings?.({...printerSettings!, printerName: e.target.value})}
                      placeholder="e.g. Epson TM-T20"
                      className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red transition-all"
                    />
                    <button 
                      onClick={scanPrinters}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 rounded-lg border border-gray-200 dark:border-gray-600"
                      title="Search for network printers"
                    >
                      {isScanningPrinters ? <RotateCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
                  <input 
                    type="text" 
                    value={printerSettings?.ipAddress || ''}
                    onChange={(e) => onUpdatePrinterSettings?.({...printerSettings!, ipAddress: e.target.value})}
                    placeholder="192.168.1.200"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red transition-all font-mono"
                  />
                </div>
             </div>
          </div>

          {/* Kitchen Display Settings */}
          <div className="bg-white dark:bg-cosmo-surface rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                   <Monitor className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kitchen Displays</h3>
                   <p className="text-xs text-gray-500">Manage KDS screens.</p>
                 </div>
               </div>
               <button 
                 onClick={launchProjectorMode}
                 className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-md shadow-blue-500/20"
                 title="Open in new window for projector/TV"
               >
                 <ExternalLink className="w-3 h-3" />
                 Launch KDS
               </button>
             </div>

             <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                   <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Add New Screen</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input 
                        type="text" 
                        placeholder="Screen Name" 
                        value={newScreenName}
                        onChange={(e) => setNewScreenName(e.target.value)}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                      <input 
                        type="text" 
                        placeholder="IP Address" 
                        value={newScreenIP}
                        onChange={(e) => setNewScreenIP(e.target.value)}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                   </div>
                   <button 
                     onClick={handleAddScreen}
                     disabled={!newScreenName || !newScreenIP}
                     className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 rounded-lg text-xs font-bold transition-colors"
                   >
                     Add Screen
                   </button>
                </div>

                {/* List of Screens */}
                <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                   {filteredScreens.map(screen => (
                      <div key={screen.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500"><Tv className="w-4 h-4" /></div>
                           <div>
                             <p className="text-sm font-medium text-gray-900 dark:text-white">{screen.name}</p>
                             <p className="text-xs text-gray-500 font-mono">{screen.ip}</p>
                           </div>
                         </div>
                         <button onClick={() => onRemoveKitchenScreen?.(screen.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash className="w-4 h-4" /></button>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Custom Status Settings */}
          <div className="bg-white dark:bg-cosmo-surface rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm col-span-1 lg:col-span-2">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
               <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                 <List className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Statuses</h3>
                 <p className="text-xs text-gray-500">Define custom order flows.</p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                   <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Create Status</h4>
                   <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Status Label (e.g. Ready)" 
                        value={newStatusLabel}
                        onChange={(e) => setNewStatusLabel(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                      />
                      <button 
                        onClick={handleAddStatus}
                        disabled={!newStatusLabel}
                        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white py-2 rounded-lg text-sm font-bold transition-colors mt-2"
                      >
                        Add Status
                      </button>
                   </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {orderStatuses?.map(status => (
                    <div key={status.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
                       <div className="flex items-center gap-3">
                         <span className={`px-2 py-1 rounded text-xs font-bold ${status.color}`}>
                           {status.label}
                         </span>
                       </div>
                       <button 
                         onClick={() => onRemoveOrderStatus?.(status.id)} 
                         className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                         disabled={['Pending', 'Completed'].includes(status.label)} 
                       >
                         <Trash className="w-4 h-4" />
                       </button>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* Database Maintenance Section */}
          <div className="bg-white dark:bg-cosmo-surface rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                   <Database className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Database Maintenance</h3>
                   <p className="text-xs text-gray-500">Run this script in Supabase to fix table errors.</p>
                 </div>
               </div>
               <button 
                 onClick={handleCopySQL}
                 className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
               >
                 {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                 {copied ? "Copied!" : "Copy SQL Script"}
               </button>
            </div>
            
            <div className="relative">
              <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap select-all">
                {DB_SETUP_SCRIPT}
              </pre>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Stock Management view with Expiring Items
  if (activeSubTab === 'stock') {
    const expiringItems = getExpiringItems();
    return (
      <div className="p-4 md:p-8 h-full overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Inventory Control</h2>
        
        {expiringItems.length > 0 && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
            <h3 className="flex items-center gap-2 font-bold text-red-700 dark:text-red-400 mb-3">
              <AlertTriangle className="w-5 h-5" /> Expiring Soon (Next 7 Days)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {expiringItems.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-red-100 dark:border-red-900/30 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.stock} units in stock</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">Expires</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{p.expiryDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-cosmo-surface rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
             <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs">
                <tr>
                   <th className="px-6 py-4">Product</th>
                   <th className="px-6 py-4">Current Stock</th>
                   <th className="px-6 py-4">Expiry Date</th>
                   <th className="px-6 py-4 text-right">Update</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
               {products.map(p => (
                 <tr key={p.id}>
                   <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
                   <td className="px-6 py-4">
                     <span className={`font-bold ${p.stock < 10 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                       {p.stock} units
                     </span>
                   </td>
                   <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{p.expiryDate || '-'}</td>
                   <td className="px-6 py-4 text-right">
                      {/* Simple direct stock edit could go here */}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Render Product & Stock Management (Default)
  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product Catalog</h2>
        {activeSubTab === 'products' && (
          <button 
            onClick={startNew}
            className="bg-cosmo-red hover:bg-rose-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-cosmo-surface rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Stock & Details</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {(newProductMode ? [tempProduct as Product, ...products] : products).map((product) => {
              const isEditing = editingId === product.id || (newProductMode && product === tempProduct);
              
              if (isEditing) {
                return (
                  <tr key="editing" className="bg-gray-50 dark:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="space-y-3">
                         {/* Image Upload Area */}
                         <div className="flex gap-4 items-center">
                           <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 group bg-gray-100 dark:bg-gray-800 shrink-0">
                             <img src={tempProduct.image} alt="Preview" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                               <label className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 cursor-pointer text-white transition-colors" title="Upload Image">
                                 <Upload className="w-3 h-3" />
                                 <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                               </label>
                               <button 
                                 type="button"
                                 onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                                 className={`p-1.5 rounded-full cursor-pointer transition-colors ${showImageUrlInput ? 'bg-cosmo-red text-white' : 'bg-white/20 hover:bg-white/40 text-white'}`}
                                 title="Paste Image URL"
                               >
                                 <Link className="w-3 h-3" />
                               </button>
                             </div>
                           </div>
                           <div className="flex-1 space-y-2">
                              {showImageUrlInput ? (
                                <div className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                                  <input 
                                    type="text" 
                                    value={tempProduct.image} 
                                    onChange={(e) => setTempProduct({...tempProduct, image: e.target.value})}
                                    placeholder="Paste Image URL..."
                                    autoFocus
                                    className="w-full bg-white dark:bg-gray-900 border border-cosmo-red rounded px-2 py-1 text-gray-900 dark:text-white outline-none"
                                  />
                                  <button 
                                    onClick={() => setShowImageUrlInput(false)} 
                                    className="px-2 bg-green-100 text-green-700 rounded text-xs font-bold hover:bg-green-200"
                                    title="Confirm"
                                  >
                                    OK
                                  </button>
                                </div>
                              ) : (
                                <input 
                                  type="text" 
                                  value={tempProduct.name} 
                                  onChange={(e) => setTempProduct({...tempProduct, name: e.target.value})}
                                  placeholder="Product Name"
                                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-gray-900 dark:text-white focus:border-cosmo-red outline-none"
                                />
                              )}
                           </div>
                         </div>
                         
                         <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={tempProduct.description} 
                              onChange={(e) => setTempProduct({...tempProduct, description: e.target.value})}
                              placeholder="Description"
                              className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs text-gray-600 dark:text-gray-300"
                            />
                            <button 
                              onClick={handleAiDescription} 
                              disabled={aiLoading}
                              className="bg-purple-100 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-600/40 px-2 rounded flex items-center justify-center transition-colors shrink-0"
                              title="Generate with AI"
                            >
                               <Bot className={`w-3 h-3 ${aiLoading ? 'animate-spin' : ''}`} />
                            </button>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                       <select 
                         value={tempProduct.category}
                         onChange={(e) => setTempProduct({...tempProduct, category: e.target.value})}
                         className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-gray-900 dark:text-white w-full"
                       >
                         {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                       </select>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-2">
                        <input 
                          type="number" 
                          value={tempProduct.stock} 
                          onChange={(e) => setTempProduct({...tempProduct, stock: parseInt(e.target.value)})}
                          className="w-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-gray-900 dark:text-white"
                          placeholder="Stock"
                        />
                        <input 
                          type="date" 
                          value={tempProduct.expiryDate || ''}
                          onChange={(e) => setTempProduct({...tempProduct, expiryDate: e.target.value})}
                          className="w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-white"
                        />
                        <input 
                          type="text" 
                          value={tempOptionsStr} 
                          onChange={(e) => setTempOptionsStr(e.target.value)}
                          placeholder="Sides/Options (e.g. Steamed, Fried (+R5))"
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-white"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <input 
                        type="number" 
                        value={tempProduct.price} 
                        onChange={(e) => setTempProduct({...tempProduct, price: parseFloat(e.target.value)})}
                        className="w-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={saveProduct} className="p-2 bg-green-100 dark:bg-green-600/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-600/40 rounded"><Save className="w-4 h-4" /></button>
                          <button onClick={() => { setEditingId(null); setNewProductMode(false); }} className="p-2 bg-red-100 dark:bg-red-600/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-600/40 rounded"><X className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-800" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                        <div className="text-xs text-gray-500 max-w-[200px] truncate">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`font-medium ${product.stock < 10 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                      {product.stock} units
                    </div>
                    {product.expiryDate && <div className="text-[10px] text-gray-400">Exp: {product.expiryDate}</div>}
                    {product.options && product.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.options.map(opt => (
                          <span key={opt} className="text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1 rounded border border-blue-100 dark:border-blue-800">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">R {product.price}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(product)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => onDeleteProduct(product.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-500 transition-colors"><Trash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};