import React, { useState, useEffect } from 'react';
import { X, Banknote, ArrowRight, Calculator } from 'lucide-react';

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (tendered: number, change: number) => void;
}

export const CashPaymentModal: React.FC<CashPaymentModalProps> = ({ isOpen, onClose, totalAmount, onConfirm }) => {
  const [tenderedInput, setTenderedInput] = useState('');
  const [change, setChange] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setTenderedInput('');
      setChange(0);
    }
  }, [isOpen]);

  const tendered = parseFloat(tenderedInput) || 0;
  const remaining = totalAmount - tendered;
  const isValid = tendered >= totalAmount;

  useEffect(() => {
    setChange(isValid ? tendered - totalAmount : 0);
  }, [tendered, totalAmount, isValid]);

  if (!isOpen) return null;

  const handleQuickAmount = (amount: number) => {
    setTenderedInput(amount.toString());
  };

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(tendered, change);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-cosmo-red" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Cash Payment</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Due</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">R {totalAmount.toFixed(2)}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount Tendered</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">R</span>
                <input 
                  type="number" 
                  value={tenderedInput}
                  onChange={(e) => setTenderedInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red transition-colors"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 50, 100, 200].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className="py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors"
                >
                  R{amt}
                </button>
              ))}
              <button
                onClick={() => handleQuickAmount(Math.ceil(totalAmount))}
                className="col-span-3 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-lg text-sm font-semibold text-purple-700 dark:text-purple-300 transition-colors"
              >
                Exact (R{Math.ceil(totalAmount)})
              </button>
            </div>
          </div>

          <div className={`p-4 rounded-xl transition-colors ${isValid ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50'}`}>
            <div className="flex justify-between items-end">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isValid ? 'Change Due' : 'Remaining'}
                </p>
                <div className="flex items-center gap-2">
                   {isValid ? <Calculator className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                   <span className={`text-2xl font-bold ${isValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                     R {(isValid ? change : remaining).toFixed(2)}
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={handleConfirm}
            disabled={!isValid}
            className="w-full flex items-center justify-center gap-2 bg-cosmo-red disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed hover:bg-rose-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg disabled:shadow-none shadow-cosmo-red/25"
          >
            <span>Complete Payment</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper icon
function AlertCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  );
}