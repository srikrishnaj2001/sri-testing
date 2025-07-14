import api from './api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  image_url: string;
  category_id: string;
  category_name: string;
  is_available: boolean;
  is_veg: boolean;
  rating: number;
  rating_count: number;
  preparation_time: number;
  tags: string[];
  ingredients?: string[];
  nutritional_info?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  variations?: {
    id: string;
    name: string;
    price: number;
    is_available: boolean;
  }[];
  add_ons?: {
    id: string;
    name: string;
    price: number;
    is_available: boolean;
  }[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  product_count: number;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: {
    categories: Category[];
    total: number;
  };
}

export const productService = {
  async getProducts(params?: {
    page?: number;
    per_page?: number;
    category_id?: string;
    search?: string;
    sort_by?: 'name' | 'price' | 'rating' | 'popularity';
    sort_order?: 'asc' | 'desc';
    is_veg?: boolean;
    min_price?: number;
    max_price?: number;
  }): Promise<ProductsResponse> {
    const response = await api.get('/products', { params });
    return response.data;
  },

  async getProduct(id: string): Promise<{ success: boolean; message: string; data: Product }> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async getProductsByCategory(categoryId: string, params?: {
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<ProductsResponse> {
    const response = await api.get(`/products/category/${categoryId}`, { params });
    return response.data;
  },

  async getCategories(): Promise<CategoriesResponse> {
    const response = await api.get('/categories');
    return response.data;
  },

  async getCategoryTree(): Promise<CategoriesResponse> {
    const response = await api.get('/categories/tree');
    return response.data;
  },

  async getPopularProducts(limit?: number): Promise<ProductsResponse> {
    const response = await api.get('/products', { 
      params: { 
        sort_by: 'popularity', 
        sort_order: 'desc',
        per_page: limit || 10
      } 
    });
    return response.data;
  },

  async getFeaturedProducts(limit?: number): Promise<ProductsResponse> {
    const response = await api.get('/products', { 
      params: { 
        is_featured: true,
        per_page: limit || 10
      } 
    });
    return response.data;
  },

  async searchProducts(query: string, params?: {
    page?: number;
    per_page?: number;
    category_id?: string;
    is_veg?: boolean;
  }): Promise<ProductsResponse> {
    const response = await api.get('/products', { 
      params: { 
        search: query,
        ...params
      } 
    });
    return response.data;
  },
}; 