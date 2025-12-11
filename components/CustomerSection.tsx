import React, { useState } from 'react';
import { Customer } from '../types';
import { MapPin, Phone, Calendar, Search } from 'lucide-react';

interface CustomerSectionProps {
  customers: Customer[];
}

export const CustomerSection: React.FC<CustomerSectionProps> = ({ customers }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Customers</h2>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, phone or address..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10 custom-scrollbar">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">
            No customers found matching "{searchTerm}"
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-white dark:bg-cosmo-surface border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-cosmo-red/30 transition-all shadow-md dark:shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center font-bold text-lg text-gray-700 dark:text-white">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{customer.name}</h3>
                  <p className="text-xs text-cosmo-red">VIP Customer</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mt-1 text-gray-400 dark:text-gray-500" />
                  <span>{customer.address}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>Last Order: {customer.lastOrderDate}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div className="text-xs text-gray-500">Total Orders</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{customer.totalOrders}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};