
import { Product, Customer, User, Order } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Prawn & Chive Dumplings',
    price: 85,
    category: 'Dumplings',
    description: 'Steamed prawn dumplings with fresh chives.',
    stock: 45,
    image: 'https://images.unsplash.com/photo-1541696490865-9810f788fb3c?auto=format&fit=crop&q=80&w=200&h=200',
    options: ['Steamed', 'Fried', 'Chilli Oil (+R5)']
  },
  {
    id: '2',
    name: 'Spicy Beef Dumplings',
    price: 75,
    category: 'Dumplings',
    description: 'Juicy beef with szechuan pepper kick.',
    stock: 8, // Low stock example
    image: 'https://images.unsplash.com/photo-1496116218417-7a17478ee173?auto=format&fit=crop&q=80&w=200&h=200',
    options: ['Steamed', 'Fried']
  },
  {
    id: '3',
    name: 'Chicken & Corn Potstickers',
    price: 70,
    category: 'Dumplings',
    description: 'Pan-fried dumplings with golden crust.',
    stock: 120,
    image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=200&h=200',
    options: ['Standard', 'Extra Crispy']
  },
  {
    id: '4',
    name: 'Vegetable Bun',
    price: 45,
    category: 'Sides',
    description: 'Fluffy steamed bun with mixed veg filling.',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=200&h=200',
    options: ['1 Piece', '2 Pieces']
  },
  {
    id: '5',
    name: 'Cosmo Special Noodles',
    price: 95,
    category: 'Sides',
    description: 'Hand-pulled noodles with secret sauce.',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=200&h=200',
    options: ['Chicken', 'Beef', 'Vegetable', 'Prawn (+R15)']
  },
  {
    id: '6',
    name: 'Jasmine Tea',
    price: 25,
    category: 'Drinks',
    description: 'Fragrant hot tea.',
    stock: 200,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=200&h=200',
    options: ['Hot', 'Iced', 'No Sugar']
  },
  {
    id: '7',
    name: 'Tsingtao Beer',
    price: 40,
    category: 'Drinks',
    description: 'Imported Chinese lager.',
    stock: 4, // Critical stock
    image: 'https://images.unsplash.com/photo-1598155523122-38423bb4d6c1?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: '8',
    name: 'Mango Mochi',
    price: 55,
    category: 'Dessert',
    description: 'Soft rice cake with fresh mango filling.',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1623592534882-62b8a7f45758?auto=format&fit=crop&q=80&w=200&h=200',
    options: ['Strawberry', 'Mango', 'Matcha']
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'John Doe',
    phone: '082 555 1234',
    address: '12 Cosmo Street, Cape Town',
    totalOrders: 15,
    lastOrderDate: '2023-10-25'
  },
  {
    id: 'c2',
    name: 'Jane Smith',
    phone: '071 999 8888',
    address: '45 Dumpling Lane, Johannesburg',
    totalOrders: 3,
    lastOrderDate: '2023-10-20'
  }
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Manager Mike', role: 'Admin', pin: '1234' },
  { id: 'u2', name: 'Server Sarah', role: 'Staff', pin: '0000' }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    items: [{ product: INITIAL_PRODUCTS[0], quantity: 2, selectedOption: 'Steamed' }, { product: INITIAL_PRODUCTS[5], quantity: 1, selectedOption: 'Hot' }],
    total: 195,
    paymentMethod: 'Card',
    type: 'Dine-In',
    tableNumber: 5,
    date: '2023-10-26 14:30',
    status: 'Completed',
    orderBy: 'Server Sarah'
  },
  {
    id: 'ORD-002',
    items: [{ product: INITIAL_PRODUCTS[1], quantity: 1, selectedOption: 'Fried' }],
    total: 75,
    paymentMethod: 'Cash',
    type: 'Takeaway',
    date: '2023-10-26 15:15',
    status: 'Preparing',
    orderBy: 'Manager Mike'
  },
  {
    id: 'ORD-003',
    items: [{ product: INITIAL_PRODUCTS[2], quantity: 1, selectedOption: 'Standard' }, { product: INITIAL_PRODUCTS[6], quantity: 2 }],
    total: 150,
    paymentMethod: 'Card',
    type: 'Dine-In',
    tableNumber: 2,
    date: '2023-10-26 16:00',
    status: 'Pending',
    orderBy: 'Server Sarah'
  }
];

export const CATEGORIES = ['Dumplings', 'Sides', 'Drinks', 'Dessert'];
