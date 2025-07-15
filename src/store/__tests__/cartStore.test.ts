import { useCartStore } from '../cartStore';
import { act } from '@testing-library/react-native';

describe('cartStore', () => {
  it('adds items to cart', () => {
    const product = {
      id: '1',
      name: 'Test',
      description: 'Test',
      price: 10,
      image_url: '',
      category_id: '',
      category_name: '',
      is_available: true,
      is_veg: true,
      rating: 0,
      rating_count: 0,
      preparation_time: 0,
      tags: []
    } as any;

    act(() => {
      useCartStore.getState().addItem(product);
    });

    expect(useCartStore.getState().totalItems).toBe(1);
  });
});
