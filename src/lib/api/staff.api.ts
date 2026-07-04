import { httpClient } from './http-client';

export interface StaffTask {
  id: string;
  scheduled_date: string | null;
  notes: string | null;
  task_type: {
    code: string;
    label: string;
  };
  status: {
    code: string;
    label: string;
  };
  order: {
    order_number: string;
  };
}

export const staffApi = {
  async getTasks(): Promise<StaffTask[]> {
    return httpClient.get<StaffTask[]>('/staff/tasks');
  },

  async getTaskById(id: string): Promise<any> {
    return httpClient.get<any>(`/staff/tasks/${id}`);
  },

  async updateTaskStatus(id: string, statusCode: string): Promise<{ message: string; status: string }> {
    return httpClient.patch<{ message: string; status: string }>(`/staff/tasks/${id}/status`, { statusCode });
  },

  async addTaskNotes(id: string, notes: string): Promise<{ message: string }> {
    return httpClient.post<{ message: string }>(`/staff/tasks/${id}/notes`, { notes });
  },
};
