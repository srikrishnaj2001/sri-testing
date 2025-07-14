export const API_BASE_URL = 'http://localhost:8009';
export const API_VERSION = 'v1';
export const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_your_key_here';

export const ALLOWED_PIN_CODES = ['560001', '560102', '560103', '560104', '560105'];
export const DEFAULT_CITY = 'Bengaluru';
export const DEFAULT_STATE = 'Karnataka';
export const DEFAULT_COUNTRY = 'India';

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const DELIVERY_TIME_MINUTES = 10;

export const THEME_COLORS = {
  primary: '#ef4444',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
}; 