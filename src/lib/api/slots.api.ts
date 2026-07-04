import { httpClient } from './http-client';
import { TimeSlot } from '@/types/api.types';

export interface AvailableSlotInfo {
  availabilityId: string;
  slotId: string;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number | null;
}

export const slotsApi = {
  async getAvailability(areaId: string, date: string, type: 'pickup' | 'delivery'): Promise<AvailableSlotInfo[]> {
    return httpClient.get<AvailableSlotInfo[]>('/slots/availability', {
      params: { areaId, date, type },
    });
  },
};
