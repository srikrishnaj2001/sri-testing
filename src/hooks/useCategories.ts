import { useQuery } from 'react-query';
import { productService, Category } from '../services/productService';

export const useCategories = () => {
  return useQuery<{
    success: boolean;
    message: string;
    data: { categories: Category[] };
  }>(['categories'], () => productService.getCategories());
};
