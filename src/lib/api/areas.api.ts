import { httpClient } from './http-client';
import { ServiceArea } from '@/types/api.types';

export const areasApi = {
  async getAreas(): Promise<ServiceArea[]> {
    return httpClient.get<ServiceArea[]>('/areas');
  },

  async searchAreas(q: string): Promise<ServiceArea[]> {
    return httpClient.get<ServiceArea[]>('/areas/search', { params: { q } });
  },
};
