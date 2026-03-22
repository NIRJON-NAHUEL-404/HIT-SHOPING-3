
export type Category = 'Watch' | 'Gadget' | 'Shirt' | 'Panjabi' | 'Formal' | 'Mobile' | 'girl pdc' | string;

export interface CategoryDef {
  id: string;
  name: string;
  parentId?: string;
  icon?: string;
  image?: string;
}

export interface ProductVariation {
  size: string;
  color: string;
  stock: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  image?: string;
  createdAt: number;
  isApproved: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  sku?: string;
  stock?: number;
  category: Category;
  subcategory?: string;
  image: string;
  images?: string[];
  description: string;
  flashSaleExpiry?: number; // timestamp
  variations: ProductVariation[];
  rating: number;
  tags: string[];
  reviewScreenshots?: string[];
  reviews?: Review[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'danger';
  timestamp: number;
  read: boolean;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  address: string;
  phone: string;
  whatsapp?: string;
  notifications: Notification[];
  wishlist: string[]; // Array of product IDs
  role?: 'Admin' | 'Manager' | 'Editor' | 'Customer';
}

export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  deliveryCharge: number;
  status: OrderStatus;
  paymentMethod: 'Bkash' | 'Nagad' | 'Rocket' | 'COD' | 'SSLCommerz' | 'Shurjopay';
  shippingDetails: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    whatsapp: string;
    transactionId?: string;
    paymentScreenshot?: string; // Base64 image
  };
  createdAt: number;
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  isActive: boolean;
}

export interface Banner {
  id: string;
  imageUrl: string;
  link?: string;
}

export interface SiteSettings {
  logoUrl: string;
  logoName: string;
  footerCopyright: string;
  contactNumber: string;
  facebookUrl: string;
  instagramUrl: string;
}

export interface AppState {
  products: Product[];
  orders: Order[];
  users: User[];
  deliveryCharge: number;
  shippingRates: { insideDhaka: number; outsideDhaka: number };
  paymentNumber: string;
  currentUser: User | null;
  cart: CartItem[];
  announcements: string[];
  categories: CategoryDef[];
  coupons: Coupon[];
  banners: Banner[];
  siteSettings: SiteSettings;
}
