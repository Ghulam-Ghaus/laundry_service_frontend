import { httpClient } from './http-client';
import { Order, ServiceArea, TimeSlot, ServiceCategory, CatalogItem } from '@/types/api.types';

export interface DashboardStats {
  todayOrders: number;
  pendingPickup: number;
  inCleaning: number;
  readyForDelivery: number;
  completed: number;
  failedCancelled: number;
  revenueEstimate: number;
  currencyCode: string;
}

export interface AdminOrderListResponse {
  items: (Order & { customer?: { first_name: string; last_name: string | null; email: string } })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminApi = {
  // --- Dashboard KPIs ---
  async getDashboardStats(): Promise<DashboardStats> {
    return httpClient.get<DashboardStats>('/admin/dashboard/stats');
  },

  // --- Orders ---
  async getOrders(page = 1, limit = 20, status?: string): Promise<AdminOrderListResponse> {
    return httpClient.get<AdminOrderListResponse>('/admin/orders', {
      params: { page: page.toString(), limit: limit.toString(), ...(status ? { status } : {}) },
    });
  },

  async updateOrderStatus(orderId: string, statusCode: string, note?: string): Promise<{ message: string; statusCode: string }> {
    return httpClient.patch<{ message: string; statusCode: string }>(`/admin/orders/${orderId}/status`, {
      statusCode,
      note,
    });
  },

  async assignStaff(orderId: string, staffUserId: string, taskTypeCode: string): Promise<{ message: string; taskId: string }> {
    return httpClient.patch<{ message: string; taskId: string }>(`/admin/orders/${orderId}/assign-staff`, {
      staffUserId,
      taskTypeCode,
    });
  },

  // --- Catalog CRUD ---
  async createCategory(data: { code: string; name: string; description?: string; sortOrder?: number }): Promise<ServiceCategory> {
    return httpClient.post<ServiceCategory>('/admin/catalog/categories', data);
  },

  async updateCategory(id: string, data: Partial<ServiceCategory>): Promise<ServiceCategory> {
    return httpClient.patch<ServiceCategory>(`/admin/catalog/categories/${id}`, data);
  },

  async deleteCategory(id: string): Promise<void> {
    return httpClient.delete<void>(`/admin/catalog/categories/${id}`);
  },

  async createItem(data: { categoryId: string; code: string; name: string; description?: string; unitLabel?: string }): Promise<CatalogItem> {
    return httpClient.post<CatalogItem>('/admin/catalog/items', data);
  },

  async updateItem(id: string, data: Partial<CatalogItem>): Promise<CatalogItem> {
    return httpClient.patch<CatalogItem>(`/admin/catalog/items/${id}`, data);
  },

  async deleteItem(id: string): Promise<void> {
    return httpClient.delete<void>(`/admin/catalog/items/${id}`);
  },

  async setItemPrice(data: { itemId: string; serviceOptionId: string; price: string; compareAtPrice?: string }): Promise<any> {
    return httpClient.post<any>('/admin/catalog/prices', data);
  },

  // --- Areas CRUD ---
  async createArea(data: { code: string; name: string; city: string; sortOrder?: number }): Promise<ServiceArea> {
    return httpClient.post<ServiceArea>('/admin/areas', data);
  },

  async updateArea(id: string, data: Partial<ServiceArea>): Promise<ServiceArea> {
    return httpClient.patch<ServiceArea>(`/admin/areas/${id}`, data);
  },

  async deleteArea(id: string): Promise<void> {
    return httpClient.delete<void>(`/admin/areas/${id}`);
  },

  // --- Settings ---
  async getSettings(): Promise<any[]> {
    return httpClient.get<any[]>('/admin/settings');
  },

  async updateSettings(payload: Record<string, any>): Promise<{ message: string }> {
    return httpClient.post<{ message: string }>('/admin/settings', payload);
  },

  // --- Audit Logs ---
  async getAuditLogs(page = 1, limit = 20, action?: string): Promise<any> {
    return httpClient.get<any>('/admin/audit-logs', {
      params: { page: page.toString(), limit: limit.toString(), ...(action ? { action } : {}) },
    });
  },

  // --- Trash ---
  async getTrash(entityName: string): Promise<any[]> {
    return httpClient.get<any[]>(`/admin/trash/${entityName}`);
  },

  async restoreRecord(entityName: string, id: string): Promise<{ message: string }> {
    return httpClient.post<{ message: string }>(`/admin/trash/${entityName}/${id}/restore`, {});
  },
};
