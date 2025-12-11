
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage, onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000); // Auto dismiss after 3 seconds
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgColors = {
    success: 'bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800',
    error: 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800',
    info: 'bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800'
  };

  const textColors = {
    success: 'text-green-800 dark:text-green-300',
    error: 'text-red-800 dark:text-red-300',
    info: 'text-blue-800 dark:text-blue-300'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-right fade-in ${bgColors[toast.type]}`}>
      {icons[toast.type]}
      <p className={`text-sm font-medium ${textColors[toast.type]}`}>{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className={`p-1 rounded-full hover:bg-black/5 ${textColors[toast.type]}`}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
