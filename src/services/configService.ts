import api from './api';

export interface AppConfig {
  app_name: string;
  app_version: string;
  currency: string;
  currency_symbol: string;
  delivery_fee: number;
  min_order_amount: number;
  max_order_amount: number;
  tax_percentage: number;
  delivery_time_minutes: number;
  business_hours: {
    monday: { start: string; end: string; is_open: boolean };
    tuesday: { start: string; end: string; is_open: boolean };
    wednesday: { start: string; end: string; is_open: boolean };
    thursday: { start: string; end: string; is_open: boolean };
    friday: { start: string; end: string; is_open: boolean };
    saturday: { start: string; end: string; is_open: boolean };
    sunday: { start: string; end: string; is_open: boolean };
  };
  contact_info: {
    phone: string;
    email: string;
    address: string;
  };
  social_links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  payment_methods: {
    cash_on_delivery: boolean;
    online_payment: boolean;
    razorpay_key?: string;
    stripe_key?: string;
  };
  features: {
    wishlist_enabled: boolean;
    reviews_enabled: boolean;
    loyalty_points_enabled: boolean;
    referral_enabled: boolean;
    chat_support_enabled: boolean;
    push_notifications_enabled: boolean;
  };
  maintenance_mode: boolean;
  force_update: boolean;
  min_app_version: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  action_type: 'product' | 'category' | 'external_link' | 'none';
  action_value?: string;
  is_active: boolean;
  sort_order: number;
  start_date?: string;
  end_date?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  delivery_radius: number;
  supported_pin_codes: string[];
}

export interface ConfigResponse {
  success: boolean;
  message: string;
  data: AppConfig;
}

export interface BannersResponse {
  success: boolean;
  message: string;
  data: {
    banners: Banner[];
    total: number;
  };
}

export interface BranchesResponse {
  success: boolean;
  message: string;
  data: {
    branches: Branch[];
    total: number;
  };
}

export const configService = {
  async getAppConfig(): Promise<ConfigResponse> {
    const response = await api.get('/config');
    return response.data;
  },

  async getBanners(): Promise<BannersResponse> {
    const response = await api.get('/config/banners');
    return response.data;
  },

  async getBranches(): Promise<BranchesResponse> {
    const response = await api.get('/config/branches');
    return response.data;
  },

  async getBranchesByLocation(latitude: number, longitude: number): Promise<BranchesResponse> {
    const response = await api.get('/config/branches/location', {
      params: { latitude, longitude }
    });
    return response.data;
  },

  async checkServiceAvailability(pinCode: string): Promise<{
    success: boolean;
    message: string;
    data: {
      is_available: boolean;
      nearest_branch?: Branch;
      estimated_delivery_time?: string;
    };
  }> {
    const response = await api.get('/config/service-availability', {
      params: { pin_code: pinCode }
    });
    return response.data;
  },

  async getBusinessHours(): Promise<{
    success: boolean;
    message: string;
    data: {
      is_open: boolean;
      current_time: string;
      business_hours: AppConfig['business_hours'];
      next_opening_time?: string;
    };
  }> {
    const response = await api.get('/config/business-hours');
    return response.data;
  },

  async checkAppVersion(currentVersion: string): Promise<{
    success: boolean;
    message: string;
    data: {
      is_update_required: boolean;
      is_force_update: boolean;
      latest_version: string;
      update_url?: string;
    };
  }> {
    const response = await api.get('/config/app-version', {
      params: { current_version: currentVersion }
    });
    return response.data;
  },
}; 