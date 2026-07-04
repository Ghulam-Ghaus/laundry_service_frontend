import { httpClient } from './http-client';
import { AuthUser } from '@/types/api.types';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  user: AuthUser;
  accessToken: string;
}

export const authApi = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/auth/login', credentials);
    if (response && response.accessToken) {
      localStorage.setItem('access_token', response.accessToken);
    }
    return response;
  },

  async register(data: {
    email: string;
    phone?: string;
    password?: string;
    firstName: string;
    lastName?: string;
  }): Promise<RegisterResponse> {
    return httpClient.post<RegisterResponse>('/auth/register', data);
  },

  async getMe(): Promise<AuthUser> {
    return httpClient.get<AuthUser>('/auth/me');
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  },
};
