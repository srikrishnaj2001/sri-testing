import api from './api';
import { ORDER_STATUSES } from '../constants/config';

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  selected_variation?: string;
  selected_add_ons?: string[];
  special_instructions?: string;
}

export interface Address {
  id?: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pin_code: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  status: keyof typeof ORDER_STATUSES;
  customer_id: string;
  items: OrderItem[];
  delivery_address: Address;
  payment_method: 'cash_on_delivery' | 'online';
  payment_status: 'pending' | 'completed' | 'failed';
  subtotal: number;
  delivery_fee: number;
  taxes: number;
  discount: number;
  total: number;
  estimated_delivery_time: string;
  actual_delivery_time?: string;
  created_at: string;
  updated_at: string;
  delivery_man?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  order_tracking?: {
    status: string;
    timestamp: string;
    message: string;
  }[];
}

export interface PlaceOrderRequest {
  items: OrderItem[];
  delivery_address: Address;
  payment_method: 'cash_on_delivery' | 'online';
  special_instructions?: string;
  coupon_code?: string;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface OrdersResponse {
  success: boolean;
  message: string;
  data: {
    orders: Order[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export const orderService = {
  async placeOrder(orderData: PlaceOrderRequest): Promise<OrderResponse> {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  async getOrders(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<OrdersResponse> {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  async getOrder(orderId: string): Promise<OrderResponse> {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  async getOrderTracking(orderId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      order_id: string;
      status: string;
      tracking_history: {
        status: string;
        timestamp: string;
        message: string;
      }[];
    };
  }> {
    const response = await api.get(`/order-tracking/${orderId}`);
    return response.data;
  },

  async cancelOrder(orderId: string, reason: string): Promise<OrderResponse> {
    const response = await api.post(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  async reorderItems(orderId: string): Promise<OrderResponse> {
    const response = await api.post(`/orders/${orderId}/reorder`);
    return response.data;
  },

  async rateOrder(orderId: string, rating: number, review?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.post(`/orders/${orderId}/rate`, { rating, review });
    return response.data;
  },

  async getDeliveryEstimate(addressId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      estimated_delivery_time: string;
      delivery_fee: number;
    };
  }> {
    const response = await api.get(`/orders/delivery-estimate/${addressId}`);
    return response.data;
  },

  async validateCoupon(couponCode: string, subtotal: number): Promise<{
    success: boolean;
    message: string;
    data: {
      is_valid: boolean;
      discount_amount: number;
      discount_percentage: number;
      minimum_order_amount: number;
    };
  }> {
    const response = await api.post('/orders/validate-coupon', {
      coupon_code: couponCode,
      subtotal
    });
    return response.data;
  },
}; 