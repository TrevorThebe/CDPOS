
import React, { useState } from 'react';
import { Product, CartItem, Customer, CategoryItem } from '../types';
import { Plus, Minus, Trash2, CreditCard, Banknote, ChefHat, Truck, Edit3, ShoppingCart, X, Utensils } from 'lucide-react';
import { CashPaymentModal } from './CashPaymentModal';
import { ProductModal } from './ProductModal';

interface POSSectionProps {
  products: Product[];
  cart: CartItem[];
  customers: Customer[];
  searchQuery: string;
  categoryFilter: string;
  categories: CategoryItem[];
  onSetCategoryFilter: (cat: string) => void;
  onAddToCart: (product: Product, quantity?: number, notes?: string, selectedOption?: string) => void;
  onRemoveFromCart: (index: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onUpdateNote: (index: number, note: string) => void;
  onClearCart: () => void;
  onCheckout: (method: 'Cash' | 'Card', type: 'Dine-In' | 'Takeaway', table: number, tendered?: number, change?: number) => void;
}

export const POSSection: React.FC<POSSectionProps> = ({
  products,
  cart,
  customers,
  searchQuery,
  categoryFilter,
  categories,
  onSetCategoryFilter,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onUpdateNote,
  onClearCart,
  onCheckout
}) => {
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [orderType, setOrderType] = useState<'Dine-In' | 'Takeaway'>('Dine-In');
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  // Modal States
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getPriceModifier = (option?: string) => {
    if (!option) return 0;
    let total = 0;
    const regex = /\(\+R([\d.]+)\)/g;
    let match;
    while ((match = regex.exec(option)) !== null) {
      total += parseFloat(match[1]);
    }
    return total;
  };

  const cartTotal = cart.reduce((acc, item) => {
    const modifier = getPriceModifier(item.selectedOption);
    return acc + ((item.product.price + modifier) * item.quantity);
  }, 0);

  const tax = cartTotal * 0.15; // 15% VAT
  const finalTotal = cartTotal + tax;
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCashClick = () => {
    setIsCashModalOpen(true);
  };

  const confirmCashPayment = (tendered: number, change: number) => {
    onCheckout('Cash', orderType, selectedTable, tendered, change);
    setIsCashModalOpen(false);
    setIsMobileCartOpen(false);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToCartFromModal = (product: Product, quantity: number, notes: string, selectedOption?: string) => {
    onAddToCart(product, quantity, notes, selectedOption);
    setSelectedProduct(null);
  };

  return (
    <div className="flex h-full w-full relative">
      
      <ProductModal 
        isOpen={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCartFromModal}
      />

      <CashPaymentModal 
        isOpen={isCashModalOpen} 
        onClose={() => setIsCashModalOpen(false)} 
        totalAmount={finalTotal} 
        onConfirm={confirmCashPayment} 
      />

      {/* Product Grid Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Categories */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide no-scrollbar shrink-0">
          <button
            onClick={() => onSetCategoryFilter('All')}
            className={`px-4 py-2 md:px-5 md:py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border shadow-sm ${
              categoryFilter === 'All'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-cosmo-dark border-transparent'
                : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSetCategoryFilter(cat.name)}
              className={`px-4 py-2 md:px-5 md:py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border shadow-sm ${
                categoryFilter === cat.name
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-cosmo-dark border-transparent'
                  : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid - Added flex-1 and min-h-0 to ensure it takes remaining space and scrolls */}
        <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-24 md:pb-20 custom-scrollbar">
          {filteredProducts.map(product => (
            <div 
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="group bg-white dark:bg-cosmo-surface border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:border-cosmo-red/50 hover:shadow-lg hover:shadow-cosmo-red/10 transition-all duration-300 active:scale-95 flex flex-row sm:flex-col h-24 sm:h-auto sm:min-h-[250px]"
            >
              <div className="h-full sm:h-32 w-24 sm:w-full overflow-hidden relative bg-gray-100 dark:bg-gray-800 shrink-0">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                {product.stock < 10 && (
                  <span className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-600 text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Low
                  </span>
                )}
              </div>
              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white leading-tight text-sm sm:text-base pr-2 line-clamp-1 sm:line-clamp-2">{product.name}</h3>
                  </div>
                  <p className="hidden sm:block text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mb-3 h-8">{product.description}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-cosmo-red font-bold text-sm sm:text-base">R {product.price}</span>
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:bg-cosmo-red group-hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => setIsMobileCartOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-xl flex items-center justify-center z-40"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-cosmo-red text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
              {cartItemCount}
            </span>
          )}
        </div>
      </button>

      {/* Cart Sidebar / Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl z-50 transition-transform duration-300 transform 
        ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:translate-x-0 lg:z-20`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Current Order</h2>
            <div className="flex items-center gap-4">
               <button onClick={onClearCart} className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400">Clear</button>
               <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden text-gray-500 dark:text-gray-400">
                 <X className="w-6 h-6" />
               </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-4">
             <button 
               onClick={() => setOrderType('Dine-In')}
               className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${orderType === 'Dine-In' ? 'bg-white dark:bg-cosmo-surface text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
             >
               <ChefHat className="w-4 h-4" /> Dine-In
             </button>
             <button 
               onClick={() => setOrderType('Takeaway')}
               className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${orderType === 'Takeaway' ? 'bg-white dark:bg-cosmo-surface text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
             >
               <Truck className="w-4 h-4" /> Takeaway
             </button>
          </div>

          {orderType === 'Dine-In' && (
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-transparent">
              <span className="text-sm text-gray-600 dark:text-gray-400">Table Number</span>
              <div className="flex items-center gap-3">
                 <button onClick={() => setSelectedTable(Math.max(1, selectedTable - 1))} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600">-</button>
                 <span className="font-bold w-4 text-center text-gray-900 dark:text-white">{selectedTable}</span>
                 <button onClick={() => setSelectedTable(selectedTable + 1)} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600">+</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 opacity-60">
              <ChefHat className="w-16 h-16 mb-4 stroke-1" />
              <p>No items added yet</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.product.id}-${index}`} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-transparent rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="flex gap-3 mb-2">
                   <img src={item.product.image} className="w-14 h-14 rounded-lg object-cover" alt="" />
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.product.name}</h4>
                          {item.selectedOption && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex flex-wrap items-center gap-1 mt-0.5">
                              <Utensils className="w-3 h-3" />
                              {item.selectedOption}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">R {((item.product.price + getPriceModifier(item.selectedOption)) * item.quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-gray-200 dark:bg-gray-900 rounded-lg">
                          <button onClick={() => onUpdateQuantity(index, -1)} className="p-1 px-2 text-gray-600 dark:text-gray-400 hover:text-cosmo-red"><Minus className="w-3 h-3" /></button>
                          <span className="text-xs font-bold w-4 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(index, 1)} className="p-1 px-2 text-gray-600 dark:text-gray-400 hover:text-green-500"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => onRemoveFromCart(index)} className="ml-auto text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                 </div>
                 
                 <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    {editingNoteIndex === index ? (
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          type="text" 
                          value={item.notes || ''}
                          onChange={(e) => onUpdateNote(index, e.target.value)}
                          onBlur={() => setEditingNoteIndex(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingNoteIndex(null)}
                          placeholder="Add special instructions..."
                          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-gray-900 dark:text-white focus:border-cosmo-red outline-none"
                        />
                      </div>
                    ) : (
                      <div 
                        onClick={() => setEditingNoteIndex(index)}
                        className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-cosmo-red dark:text-gray-400 dark:hover:text-white"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span className={item.notes ? "text-gray-700 dark:text-gray-300 italic" : "text-gray-400"}>
                          {item.notes || "Add note..."}
                        </span>
                      </div>
                    )}
                 </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-bottom">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Subtotal</span>
              <span>R {cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>VAT (15%)</span>
              <span>R {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Total</span>
              <span className="text-cosmo-red">R {finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={handleCashClick}
               disabled={cart.length === 0}
               className="flex flex-col items-center justify-center gap-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Banknote className="w-5 h-5" />
               <span className="text-xs font-medium">Cash</span>
             </button>
             <button 
               onClick={() => {
                 onCheckout('Card', orderType, selectedTable);
                 setIsMobileCartOpen(false);
               }}
               disabled={cart.length === 0}
               className="flex flex-col items-center justify-center gap-1 bg-cosmo-red hover:bg-rose-700 text-white py-3 rounded-xl transition-colors shadow-lg shadow-cosmo-red/25 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <CreditCard className="w-5 h-5" />
               <span className="text-xs font-medium">Card Pay</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
