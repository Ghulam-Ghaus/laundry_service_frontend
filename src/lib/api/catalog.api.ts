import { httpClient } from './http-client';
import { ServiceCategory, CatalogItem } from '@/types/api.types';

export const catalogApi = {
  async getCategories(): Promise<ServiceCategory[]> {
    return httpClient.get<ServiceCategory[]>('/catalog/categories');
  },

  async getCategoryItems(categoryId: string): Promise<CatalogItem[]> {
    return httpClient.get<CatalogItem[]>(`/catalog/categories/${categoryId}/items`);
  },

  async searchItems(q: string): Promise<CatalogItem[]> {
    return httpClient.get<CatalogItem[]>('/catalog/items/search', { params: { q } });
  },

  async getFullCatalog(): Promise<ServiceCategory[]> {
    return httpClient.get<ServiceCategory[]>('/catalog/full');
  },
};
