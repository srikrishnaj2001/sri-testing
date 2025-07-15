import { useQuery } from 'react-query';
import { productService, Product } from '../services/productService';

export const useProducts = (categoryId?: string) => {
  return useQuery<{
    success: boolean;
    message: string;
    data: { products: Product[] };
  }>(
    ['products', categoryId],
    () =>
      categoryId
        ? productService.getProductsByCategory(categoryId)
        : productService.getProducts(),
    {
      staleTime: 1000 * 60
    }
  );
};
