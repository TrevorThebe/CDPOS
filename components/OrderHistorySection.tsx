
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import { Calendar, Search, Filter, ArrowUpRight, ArrowUpDown, ArrowUp, ArrowDown, DollarSign, User, Package } from 'lucide-react';

interface OrderHistorySectionProps {
  orders: Order[];
  orderStatuses?: OrderStatus[];
  onViewDetails: (order: Order) => void;
}

type SortKey = 'id' | 'date' | 'total' | 'status' | 'type';

export const OrderHistorySection: React.FC<OrderHistorySectionProps> = ({ orders, orderStatuses, onViewDetails }) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc',
  });

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
      const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            order.orderBy.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, filterStatus, searchTerm]);

  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders];
    sorted.sort((a, b) => {
      let aVal: any = a[sortConfig.key];
      let bVal: any = b[sortConfig.key];

      // Special handling for dates strings
      if (sortConfig.key === 'date') {
         aVal = new Date(a.date).getTime();
         bVal = new Date(b.date).getTime();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredOrders, sortConfig]);

  const getStatusColor = (statusLabel: string) => {
    const status = orderStatuses?.find(s => s.label === statusLabel);
    if (status) return status.color;
    switch (statusLabel) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Preparing': return 'bg-yellow-100 text-yellow-700';
      case 'Pending': return 'bg-blue-100 text-blue-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-cosmo-red" /> 
      : <ArrowDown className="w-3 h-3 ml-1 text-cosmo-red" />;
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-hidden flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order History</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search ID or Staff..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer w-full"
            >
              <option value="All">All Status</option>
              {orderStatuses?.map(s => (
                <option key={s.id} value={s.label}>{s.label}</option>
              ))}
              {(!orderStatuses || orderStatuses.length === 0) && (
                 <>
                  <option value="Completed">Completed</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                 </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block flex-1 bg-white dark:bg-cosmo-surface rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto h-full custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs sticky top-0 z-10">
              <tr>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">Order ID <SortIcon column="id" /></div>
                </th>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">Date & Time <SortIcon column="date" /></div>
                </th>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">Type <SortIcon column="type" /></div>
                </th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center">Total <SortIcon column="total" /></div>
                </th>
                <th className="px-6 py-4 font-medium">Staff</th>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">Status <SortIcon column="status" /></div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                sortedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {order.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        {order.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {order.items.reduce((acc, i) => acc + i.quantity, 0)} items
                      <div className="text-xs text-gray-400 truncate max-w-[150px]">
                        {order.items.map(i => i.product.name).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      R {order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {order.orderBy}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold border border-transparent ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onViewDetails(order)}
                        className="text-cosmo-red hover:text-rose-700 dark:hover:text-rose-400 font-medium text-xs flex items-center justify-end gap-1 ml-auto"
                      >
                        View Details <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20">
        {sortedOrders.length === 0 ? (
           <div className="text-center py-12 text-gray-500 dark:text-gray-400">
             No orders found matching your criteria.
           </div>
        ) : (
          sortedOrders.map(order => (
            <div key={order.id} className="bg-white dark:bg-cosmo-surface rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm" onClick={() => onViewDetails(order)}>
              <div className="flex justify-between items-start mb-3">
                <div>
                   <div className="font-bold text-lg text-gray-900 dark:text-white">{order.id}</div>
                   <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                     <Calendar className="w-3 h-3" /> {order.date}
                   </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(order.status)}`}>
                   {order.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                 <div className="flex items-center gap-2">
                   <Package className="w-4 h-4" />
                   {order.items.length} Items ({order.type})
                 </div>
                 <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                   <DollarSign className="w-4 h-4" />
                   {order.total.toFixed(2)}
                 </div>
              </div>

              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-1 text-xs text-gray-500">
                   <User className="w-3 h-3" /> {order.orderBy}
                 </div>
                 <button className="text-cosmo-red font-medium text-xs flex items-center gap-1">
                   Details <ArrowUpRight className="w-3 h-3" />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
