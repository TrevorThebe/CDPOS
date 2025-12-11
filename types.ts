
export type Category = string; // Changed from union type to string for dynamic DB categories

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  stock: number;
  image: string;
  expiryDate?: string; // New field
  options?: string[]; // Side options / variations
}

export interface CategoryItem {
  id: number;
  name: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  selectedOption?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  lastOrderDate: string;
}

export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Staff';
  pin: string;
}

export interface OrderStatus {
  id: number;
  label: string;
  color: string;
  isKitchen: boolean;
  isFinal: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'Cash' | 'Card';
  type: 'Dine-In' | 'Takeaway' | 'Delivery';
  customer?: Customer;
  tableNumber?: number;
  date: string;
  status: string;
  orderBy: string;
  openDrawer?: boolean;
  tendered?: number;
  change?: number;
}

export type Tab = 'pos' | 'products' | 'users' | 'customers' | 'stock' | 'history' | 'settings' | 'kitchen';

export interface PrinterSettings {
  printerName: string;
  ipAddress: string;
  paperSize: '58mm' | '80mm';
  autoCut: boolean;
}

export interface StoreSettings {
  name: string;
  address: string;
  contact: string;
  email: string;
  footerMessage: string;
  taxRate: number;
}

export interface KitchenScreen {
  id: number;
  name: string;
  ip: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
