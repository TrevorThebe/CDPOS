
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { X, Plus, Minus, ShoppingCart, Utensils, AlertCircle, CheckSquare, Square } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, notes: string, selectedOption?: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setNotes('');
      // Reset options
      setSelectedOptions([]);
      setError(null);
    }
  }, [isOpen, product]);

  // Clear error when options change
  useEffect(() => {
    if (selectedOptions.length > 0) setError(null);
  }, [selectedOptions]);

  if (!isOpen || !product) return null;

  const handleConfirm = () => {
    // Validation: Require at least one option if options exist
    if (product.options && product.options.length > 0 && selectedOptions.length === 0) {
      setError('Required');
      return;
    }
    // Join options into a single string for compatibility
    const finalOptionString = selectedOptions.join(', ');
    onAddToCart(product, quantity, notes, finalOptionString);
    onClose();
  };

  const toggleOption = (option: string) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(prev => prev.filter(o => o !== option));
    } else {
      if (selectedOptions.length < 3) {
        setSelectedOptions(prev => [...prev, option]);
      }
    }
  };

  const getTotalModifier = () => {
    let total = 0;
    const regex = /\(\+R([\d.]+)\)/;
    selectedOptions.forEach(opt => {
      const match = opt.match(regex);
      if (match) {
        total += parseFloat(match[1]);
      }
    });
    return total;
  };

  const currentPrice = product.price + getTotalModifier();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-cosmo-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-700">
        
        {/* Image Header */}
        <div className="relative h-48 sm:h-64 w-full bg-gray-100 dark:bg-gray-800">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {product.stock < 10 && (
             <div className="absolute bottom-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
               Low Stock: {product.stock} left
             </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Header Row */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{product.name}</h2>
            <span className="text-xl font-bold text-cosmo-red whitespace-nowrap">R {product.price}</span>
          </div>

          <div className="space-y-6">
            
            {/* Side Options / Variations - Moved between Header and Quantity */}
            {product.options && product.options.length > 0 && (
              <div className={`p-4 rounded-xl border transition-colors ${error ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex justify-between items-center mb-3">
                  <label className={`block text-sm font-bold flex items-center gap-2 ${error ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
                    <Utensils className="w-4 h-4 text-cosmo-red" />
                    Choose Sides (Max 3) <span className="text-cosmo-red">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {error && (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 animate-pulse">
                        <AlertCircle className="w-3 h-3" /> Required
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                      {selectedOptions.length}/3
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {product.options.map(option => {
                    const isSelected = selectedOptions.includes(option);
                    const isDisabled = !isSelected && selectedOptions.length >= 3;
                    
                    return (
                      <label key={option} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group ${
                        isSelected 
                          ? 'bg-red-50 dark:bg-red-900/20 border-cosmo-red shadow-sm' 
                          : isDisabled
                            ? 'bg-gray-100 dark:bg-gray-800 border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}>
                        <div className="relative flex items-center justify-center shrink-0 text-gray-400">
                           <input 
                             type="checkbox" 
                             name="product_option"
                             value={option}
                             checked={isSelected}
                             disabled={isDisabled}
                             onChange={() => toggleOption(option)}
                             className="hidden"
                           />
                           {isSelected ? (
                             <CheckSquare className="w-5 h-5 text-cosmo-red" />
                           ) : (
                             <Square className="w-5 h-5 group-hover:text-gray-500 transition-colors" />
                           )}
                        </div>
                        <span className={`text-sm font-medium ${isSelected ? 'text-cosmo-red' : 'text-gray-700 dark:text-gray-300'}`}>
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description - Moved here */}
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {product.description || "No description available."}
            </p>

            {/* Quantity Selector & Total Row */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-gray-900 dark:text-white">Quantity</label>
                <div className="text-sm text-gray-500">
                  Item Total: <span className="font-bold text-lg text-cosmo-red ml-1">R {(currentPrice * quantity).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white min-w-[2ch] text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Special Instructions</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. No spicy, extra sauce, allergy info..."
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red h-24 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button 
            onClick={handleConfirm}
            disabled={product.options && product.options.length > 0 && selectedOptions.length === 0}
            className={`w-full text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${
              product.options && product.options.length > 0 && selectedOptions.length === 0
                ? 'bg-gray-400'
                : 'bg-cosmo-red hover:bg-rose-700 shadow-cosmo-red/20'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {product.options && product.options.length > 0 && selectedOptions.length === 0 ? 'Select a Side' : 'Add to Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
