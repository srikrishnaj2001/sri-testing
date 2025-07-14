import api from './api';

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
  };
  token?: string;
}

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/customer/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/customer/login', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  async getProfile(): Promise<AuthResponse> {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async updateProfile(data: Partial<RegisterRequest>): Promise<AuthResponse> {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  async verifyPhone(phone: string, code: string): Promise<AuthResponse> {
    const response = await api.post('/auth/verify-phone', { phone, code });
    return response.data;
  },

  async requestPhoneVerification(phone: string): Promise<AuthResponse> {
    const response = await api.post('/auth/request-phone-verification', { phone });
    return response.data;
  },
}; 