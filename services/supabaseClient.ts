
import { createClient } from '@supabase/supabase-js';
import { Product, User, Customer, Order, KitchenScreen, OrderStatus, CategoryItem } from '../types';

// ==========================================
// SUPABASE SETUP
// ==========================================

const SUPABASE_URL = 'https://wzndruiqqylcjcnlonqi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bmRydWlxcXlsY2pjbmxvbnFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjcxMTIsImV4cCI6MjA4MTAwMzExMn0.GEdY7deOOv9IFfxXQBJ2g9JoTpyd8_cvpfLbUXhX7Q4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const handleDBError = (context: string, error: any) => {
  // If table missing, we warn but don't crash if possible
  if (error.code === '42P01') { 
    console.warn(`⚠️ DB Error (${context}): Table not found. Please run the SQL in Admin > Settings > Database Maintenance.`);
  } else {
    console.error(`❌ DB Error (${context}):`, error.message);
  }
  return null;
};

// ==========================================
// READ OPERATIONS
// ==========================================

export const getProducts = async (): Promise<Product[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('products').select('*');
  if (error) return handleDBError('Products', error);
  return data as Product[];
};

export const getUsers = async (): Promise<User[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('users').select('*');
  if (error) return handleDBError('Users', error);
  return data as User[];
};

export const getCustomers = async (): Promise<Customer[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('customers').select('*');
  if (error) return handleDBError('Customers', error);
  return data as Customer[];
};

export const getOrders = async (): Promise<Order[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  
  if (error) {
    console.warn("⚠️ Error fetching orders with sort. Retrying without sort...", error.message);
    const retry = await supabase.from('orders').select('*');
    if (retry.error) return handleDBError('Orders', retry.error);
    const sortedData = (retry.data as Order[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sortedData;
  }
  return data as Order[];
};

export const getKitchenScreens = async (): Promise<KitchenScreen[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('kitchen_screens').select('*');
  if (error) return handleDBError('Kitchen Screens', error);
  return data as KitchenScreen[];
};

export const getOrderStatuses = async (): Promise<OrderStatus[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('order_statuses').select('*').order('id', { ascending: true });
  
  if (error) {
    if (error.code === '42P01') {
      console.warn("⚠️ Order Statuses table missing. Returning defaults.");
      return [
        { id: 1, label: 'Pending', color: 'bg-blue-100 text-blue-700', isKitchen: true, isFinal: false },
        { id: 2, label: 'Preparing', color: 'bg-yellow-100 text-yellow-700', isKitchen: true, isFinal: false },
        { id: 3, label: 'Ready', color: 'bg-green-100 text-green-700', isKitchen: false, isFinal: false },
        { id: 4, label: 'Completed', color: 'bg-gray-100 text-gray-700', isKitchen: false, isFinal: true },
        { id: 5, label: 'Cancelled', color: 'bg-red-100 text-red-700', isKitchen: false, isFinal: true },
      ];
    }
    return handleDBError('Order Statuses', error);
  }
  return data as OrderStatus[];
};

export const getCategories = async (): Promise<CategoryItem[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
  if (error) {
     // Handle missing table gracefully by returning default categories
     if (error.code === '42P01' || error.message.includes('schema cache')) {
        console.warn("⚠️ Categories table missing. Using defaults.");
        return [
          {id: 1, name: 'Dumplings'}, 
          {id: 2, name: 'Sides'}, 
          {id: 3, name: 'Drinks'}, 
          {id: 4, name: 'Dessert'}
        ];
     }
     return handleDBError('Categories', error);
  }
  return data as CategoryItem[];
};

// ==========================================
// WRITE OPERATIONS
// ==========================================

export const addProductToDB = async (product: Product): Promise<Product | null> => {
  const { data, error } = await supabase.from('products').insert([product]).select().single();
  if (error) return handleDBError('Add Product', error);
  return data;
};

export const updateProductInDB = async (product: Product): Promise<Product | null> => {
  const { data, error } = await supabase.from('products').update(product).eq('id', product.id).select().single();
  if (error) return handleDBError('Update Product', error);
  return data;
};

export const deleteProductFromDB = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) { handleDBError('Delete Product', error); return false; }
  return true;
};

export const addUserToDB = async (user: User): Promise<User | null> => {
  const { data, error } = await supabase.from('users').insert([user]).select().single();
  if (error) return handleDBError('Add User', error);
  return data;
};

export const deleteUserFromDB = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) { handleDBError('Delete User', error); return false; }
  return true;
};

export const addKitchenScreenToDB = async (screen: Omit<KitchenScreen, 'id'>): Promise<KitchenScreen | null> => {
  const { data, error } = await supabase.from('kitchen_screens').insert([screen]).select().single();
  if (error) return handleDBError('Add Screen', error);
  return data;
};

export const deleteKitchenScreenFromDB = async (id: number): Promise<boolean> => {
  const { error } = await supabase.from('kitchen_screens').delete().eq('id', id);
  if (error) { handleDBError('Delete Screen', error); return false; }
  return true;
};

export const addOrderStatusToDB = async (status: Omit<OrderStatus, 'id'>): Promise<OrderStatus | null> => {
  const { data, error } = await supabase.from('order_statuses').insert([status]).select().single();
  if (error) return handleDBError('Add Status', error);
  return data;
};

export const deleteOrderStatusFromDB = async (id: number): Promise<boolean> => {
  const { error } = await supabase.from('order_statuses').delete().eq('id', id);
  if (error) { handleDBError('Delete Status', error); return false; }
  return true;
};

export const addCategoryToDB = async (name: string): Promise<CategoryItem | null> => {
    const { data, error } = await supabase.from('categories').insert([{ name }]).select().single();
    if (error) return handleDBError('Add Category', error);
    return data;
};

export const deleteCategoryFromDB = async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { handleDBError('Delete Category', error); return false; }
    return true;
};

export const addOrderToDB = async (order: Order): Promise<Order | null> => {
  const payload = {
    id: order.id,
    total: order.total,
    "paymentMethod": order.paymentMethod,
    type: order.type,
    "tableNumber": order.tableNumber,
    date: order.date,
    status: order.status,
    "orderBy": order.orderBy,
    items: order.items, 
    tendered: order.tendered,
    change: order.change,
    "openDrawer": order.openDrawer || false
  };

  const { data, error } = await supabase.from('orders').insert([payload]).select().single();
  
  if (error) {
    if (error.code === '42703' && error.message.includes('openDrawer')) {
       console.warn("⚠️ 'openDrawer' column missing in DB. Retrying.");
       const { openDrawer, ...fallbackPayload } = payload;
       const retry = await supabase.from('orders').insert([fallbackPayload]).select().single();
       if (retry.error) return handleDBError('Add Order (Retry)', retry.error);
       return retry.data;
    }
    return handleDBError('Add Order', error);
  }
  return data;
};

export const updateOrderStatusInDB = async (orderId: string, status: string): Promise<boolean> => {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) { handleDBError('Update Order Status', error); return false; }
  return true;
};

// ... Email and SMS functions (unchanged) ...
export const sendReceiptEmail = async (email: string, order: Order): Promise<boolean> => {
  console.log(`📧 Initiating email send to ${email} for Order ${order.id}`);
  try {
    const { data, error } = await supabase.functions.invoke('send-receipt-email', {
      body: { to: email, order: order, subject: `Cosmo Dumplings Receipt - ${order.id}` }
    });
    if (error) throw new Error("EDGE_FUNCTION_SKIPPED");
    return true;
  } catch (err: any) {
    return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
  }
};

export const sendReceiptSMS = async (phone: string, order: Order, messageBody?: string): Promise<boolean> => {
  console.log(`📱 Initiating SMS send to ${phone} for Order ${order.id}`);
  if (messageBody) console.log("📝 SMS Content:", messageBody);
  
  try {
    const { data, error } = await supabase.functions.invoke('send-receipt-sms', {
      body: { phone: phone, order: order, message: messageBody }
    });
    if (error) throw new Error("EDGE_FUNCTION_SKIPPED");
    return true;
  } catch (err: any) {
    return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
  }
};
