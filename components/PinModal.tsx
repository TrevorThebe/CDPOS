import React, { useState } from 'react';
import { User } from '../types';
import { Lock, Delete, AlertCircle } from 'lucide-react';

interface PinModalProps {
  users: User[];
  onSuccess: (user: User) => void;
}

export const PinModal: React.FC<PinModalProps> = ({ users, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleEnter = () => {
    const user = users.find(u => u.pin === pin);
    if (user) {
      onSuccess(user);
    } else {
      setError('Access Denied: Invalid PIN');
      setPin('');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-100/90 dark:bg-gray-900/95 backdrop-blur-md p-4 transition-colors duration-300">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-transform ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        
        {/* Header */}
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg transition-colors duration-300 ${error ? 'bg-red-500 shadow-red-500/30' : 'bg-cosmo-red shadow-cosmo-red/30'}`}>
            {error ? <AlertCircle className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Access</h2>
          <p className="text-gray-500 text-sm mt-1">{error || "Enter your 4-digit PIN"}</p>
        </div>

        {/* PIN Dots */}
        <div className="p-6">
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  pin.length > i 
                    ? error ? 'bg-red-500' : 'bg-cosmo-red scale-110' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Validation Message Notification */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-center text-xs font-bold py-2 px-4 rounded-lg mb-4 animate-pulse">
              {error}
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumClick(num.toString())}
                className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 border border-transparent hover:border-cosmo-red text-xl font-semibold text-gray-900 dark:text-white transition-all active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <Delete className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleNumClick('0')}
              className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 border border-transparent hover:border-cosmo-red text-xl font-semibold text-gray-900 dark:text-white transition-all active:scale-95 shadow-sm"
            >
              0
            </button>
            <button
              onClick={handleEnter}
              className="h-14 rounded-xl bg-cosmo-red hover:bg-rose-700 text-white font-bold flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-cosmo-red/20"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
      
      {/* Shake Keyframe Style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};
