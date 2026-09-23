export interface CartItem {
  id: string; // unique key: "product-1" or "pet-2"
  itemType: 'Product' | 'Pet';
  productId?: number;
  petId?: number;
  name: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  stock?: number;
  breed?: string;
  brand?: string;
}

export interface CreateOrderItemRequest {
  itemType: 'Product' | 'Pet';
  productId?: number;
  petId?: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customerName: string;
  phoneNumber: string;
  email?: string;
  shippingAddress: string;
  note?: string;
  paymentMethod: 'COD' | 'BankTransfer';
  items: CreateOrderItemRequest[];
}

export interface OrderItem {
  id: number;
  itemType: 'Product' | 'Pet';
  productId?: number;
  petId?: number;
  itemName: string;
  itemImageUrl: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderList {
  id: number;
  orderCode: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  totalAmount: number;
  totalItems: number;
  createdAt: string;
}

export interface OrderDetail extends OrderList {
  shippingAddress: string;
  note: string;
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  trackingCode?: string;
  items: OrderItem[];
}
