
import React from 'react';
import { Order, OrderStatus } from '../types';
import { Clock, Check, ChefHat, ArrowRight, Activity } from 'lucide-react';

interface KitchenDisplaySectionProps {
  orders: Order[];
  orderStatuses?: OrderStatus[];
  onCompleteOrder: (orderId: string, nextStatus?: string) => void;
}

export const KitchenDisplaySection: React.FC<KitchenDisplaySectionProps> = ({ orders, orderStatuses, onCompleteOrder }) => {
  // Determine which orders to show in the Kitchen View
  // We include anything that is marked isKitchen=true OR is 'Ready' (so they can be handed off)
  const kitchenStatusLabels = orderStatuses?.filter(s => s.isKitchen).map(s => s.label) || ['Pending', 'Preparing'];
  const readyStatus = orderStatuses?.find(s => s.label === 'Ready')?.label || 'Ready';
  
  // Filter active orders
  const activeOrders = orders.filter(
    order => kitchenStatusLabels.includes(order.status) || order.status === readyStatus
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Helper to determine the "Next" logical status for the button
  const getNextAction = (currentStatus: string) => {
    if (currentStatus === 'Pending') return 'Preparing';
    if (currentStatus === 'Preparing') return readyStatus;
    if (currentStatus === readyStatus) return 'Completed';
    return 'Completed';
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-hidden flex flex-col bg-gray-50 dark:bg-cosmo-dark">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-cosmo-red" />
          Kitchen Display System
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
             <div className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
             </div>
             <span className="text-xs font-bold uppercase tracking-wider">Live Feed</span>
          </div>
          
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-cosmo-red" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active: </span>
            <span className="text-xl font-bold text-cosmo-red">{activeOrders.length}</span>
          </div>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-60">
          <ChefHat className="w-32 h-32 mb-6 stroke-1" />
          <h3 className="text-2xl font-bold">All caught up!</h3>
          <p>No active orders in the queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 overflow-y-auto pb-20 custom-scrollbar">
          {activeOrders.map((order) => {
            const isLongWait = (Date.now() - new Date(order.date).getTime()) > 1000 * 60 * 15; // 15 mins
            const nextStatus = getNextAction(order.status);
            
            return (
              <div 
                key={order.id} 
                className={`bg-white dark:bg-cosmo-surface rounded-xl border-2 shadow-md hover:shadow-xl transition-all flex flex-col overflow-hidden h-auto min-h-[400px] relative group animate-in fade-in zoom-in-95 duration-300 ${isLongWait ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
              >
                {/* Card Header */}
                <div className={`p-4 text-white flex justify-between items-start ${isLongWait ? 'bg-red-500' : 'bg-gray-900 dark:bg-gray-800'}`}>
                  <div>
                    <h3 className="text-xl font-bold">#{order.id.slice(-4)}</h3>
                    <p className="text-xs opacity-80">{order.type} {order.tableNumber ? `- T${order.tableNumber}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold flex items-center justify-end gap-1">
                      <Clock className="w-4 h-4" />
                      {order.date.split(' ')[1]}
                    </p>
                    <span className="inline-block px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-widest">{order.status}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-cosmo-surface">
                   <ul className="space-y-4">
                     {order.items.map((item, idx) => (
                       <li key={idx} className="border-b border-dashed border-gray-200 dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                         <div className="flex gap-3">
                           <span className="font-bold text-xl text-cosmo-red min-w-[30px]">{item.quantity}x</span>
                           <div>
                             <p className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{item.product.name}</p>
                             {item.selectedOption && (
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {item.selectedOption}
                                </p>
                             )}
                             {item.notes && (
                               <p className="text-sm text-amber-600 dark:text-amber-400 font-medium italic mt-1 bg-amber-50 dark:bg-amber-900/30 p-1 rounded inline-block">
                                 {item.notes}
                               </p>
                             )}
                           </div>
                         </div>
                       </li>
                     ))}
                   </ul>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 mt-auto flex flex-col gap-3">
                   
                   {/* Primary Action Button */}
                   <button 
                     onClick={() => onCompleteOrder(order.id, nextStatus)}
                     className={`w-full font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95 ${
                       order.status === readyStatus 
                       ? 'bg-green-600 hover:bg-green-700 text-white' 
                       : 'bg-cosmo-red hover:bg-rose-700 text-white'
                     }`}
                   >
                     {order.status === readyStatus ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                     <span>Mark {nextStatus}</span>
                   </button>

                   {/* Status Select Dropdown */}
                   <div className="relative">
                     <select
                       value={order.status}
                       onChange={(e) => onCompleteOrder(order.id, e.target.value)}
                       className="appearance-none w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 pr-8 rounded-lg text-xs font-medium focus:outline-none focus:border-cosmo-red focus:ring-1 focus:ring-cosmo-red cursor-pointer"
                     >
                       {orderStatuses?.map(status => (
                         <option key={status.id} value={status.label}>{status.label}</option>
                       ))}
                     </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                       <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                     </div>
                   </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
