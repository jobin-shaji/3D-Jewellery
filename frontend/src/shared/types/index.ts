export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  authProvider: 'local' | 'google';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  // isVerified: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

// export interface ProductCustomization {
//   id?: string;
//   name: string;
//   type: 'select' | 'range' | 'text';
//   options?: string[];
//   min?: number;
//   max?: number;
//   unit?: string;
//   required: boolean;
//   default_value?: string | number;
// }

export interface ProductVariant {
  variant_id?: string;
  name: string;
  stock_quantity: number;
  making_price: number;
  metal: Metal[];
  totalPrice?: number;
}

export interface Metal {
  id?: string;
  type: string; 
  purity: string;
  weight: number;
  color?: string;
}

export interface Gemstone {
  id?: string;
  type: string; 
  carat: number; 
  color?: string;
  clarity?: string; 
  count: number;
  shape?: string;
  price: number; // Price per carat or total price
}

export interface Certificate {
  name: string;
  file_url: string;
}

export interface ProductImage {
  id?: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id?: string;
  name: string;
  description?: string;
  makingPrice: number;
  category_id: number;
  category?: Category;
  stock_quantity: number;
  metals?: Metal[];
  gemstones?: Gemstone[];
  variants?: ProductVariant[];
  // customizations?: ProductCustomization[];
  images?: ProductImage[];
  primaryImage?: ProductImage;
  model_3d_url?: string;
  certificates?: Certificate[];
  is_active: boolean;
  created_at?: string;
  totalPrice?: number;
  latestPriceUpdate?: string;
  reconstruction_job_id?: string | null;
  reconstruction_status?: 'queued' | 'processing' | 'completed' | 'failed' | null;
}

export interface Address {
  id: string;
  userId: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  variant_id?: string;
  name: string;
  totalprice: number;
  quantity: number;
  image?: {
    image_url: string;
    alt_text: string;
  };
}

export interface Cart {
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // For any extra backend fields (like summary, etc.)
}

// Order related types
export interface OrderItem {
  product: {
    id: string;
    name: string;
    description: string;
    category_id: number;
    makingPrice: number;
    metals: any[];
    gemstones: any[];
    images: any[];
    model_3d_url: string;
    certificates: any[];
    totalPrice: number;
  };
  variant: {
    variant_id: string;
    name: string;
    making_price: number;
    metal: any[];
    totalPrice: number;
  } | null;
  quantity: number;
  price: number;
}

export interface OrderPayment {
  method: string;
  transactionId?: string;
  paymentStatus: string;
  paidAt?: string;
  refundAmount: number;
}

export interface OrderHistoryEntry {
  status: string;
  timestamp: string;
  updatedBy: string;
  notes?: string;
}

export interface OrderNotes {
  customerNotes?: string;
  adminNotes?: string;
  specialInstructions?: string;
}

export interface Order {
  orderId: string;
  userId: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalPrice: number;
  payment: OrderPayment;
  status: string;
  orderHistory: OrderHistoryEntry[];
  notes: OrderNotes;
  invoiceUrl?: string;
  createdAt: string;
  updatedAt: string;
}
