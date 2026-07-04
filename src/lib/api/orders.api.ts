import { httpClient } from './http-client';
import { Order, OrderTotalInfo } from '@/types/api.types';

export interface QuoteRequest {
  items: { itemId: string; serviceOptionId: string; quantity: number }[];
  couponCode?: string;
  isItemSelectionSkipped?: boolean;
}

export interface QuoteResponse {
  subtotal: number;
  serviceFee: number;
  discountTotal: number;
  grandTotal: number;
  currencyCode: string;
  items: any[];
}

export interface CreateOrderRequest {
  address: {
    areaId: string;
    addressTypeId?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    instructions?: string;
  };
  items?: { itemId: string; serviceOptionId: string; quantity: number }[];
  schedule: {
    pickupDate: string;
    pickupSlotId: string;
    deliveryDate: string;
    deliverySlotId: string;
    frequencyId?: string;
  };
  contact?: {
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
  };
  couponCode?: string;
  specialInstructions?: string;
  isItemSelectionSkipped: boolean;
  acceptedTerms: boolean;
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  status: {
    code: string;
    label: string;
  };
  totals: OrderTotalInfo;
}

export const ordersApi = {
  async getQuote(payload: QuoteRequest): Promise<QuoteResponse> {
    return httpClient.post<QuoteResponse>('/orders/quote', payload);
  },

  async createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
    return httpClient.post<CreateOrderResponse>('/orders', payload);
  },

  async getMyOrders(): Promise<Order[]> {
    return httpClient.get<Order[]>('/orders/me');
  },

  async getOrderById(id: string): Promise<Order> {
    return httpClient.get<Order>(`/orders/${id}`);
  },

  async cancelOrder(id: string): Promise<{ message: string; statusCode: string }> {
    return httpClient.patch<{ message: string; statusCode: string }>(`/orders/${id}/cancel`, {});
  },
};
