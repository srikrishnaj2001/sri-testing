import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../services/productService';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedVariation?: string;
  selectedAddOns?: string[];
  specialInstructions?: string;
  price: number;
  totalPrice: number;
}

interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  deliveryFee: number;
  taxes: number;
  discount: number;
  grandTotal: number;
  
  // Actions
  addItem: (product: Product, quantity?: number, options?: {
    selectedVariation?: string;
    selectedAddOns?: string[];
    specialInstructions?: string;
  }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemOptions: (itemId: string, options: {
    selectedVariation?: string;
    selectedAddOns?: string[];
    specialInstructions?: string;
  }) => void;
  clearCart: () => void;
  setDeliveryFee: (fee: number) => void;
  setTaxes: (taxes: number) => void;
  setDiscount: (discount: number) => void;
  calculateTotals: () => void;
  getItem: (productId: string) => CartItem | undefined;
  isItemInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

const calculateItemPrice = (product: Product, quantity: number, options?: {
  selectedVariation?: string;
  selectedAddOns?: string[];
}): number => {
  let basePrice = product.price;
  
  // Add variation price if selected
  if (options?.selectedVariation) {
    const variation = product.variations?.find(v => v.id === options.selectedVariation);
    if (variation) {
      basePrice = variation.price;
    }
  }
  
  // Add add-ons price
  let addOnsPrice = 0;
  if (options?.selectedAddOns?.length) {
    options.selectedAddOns.forEach(addOnId => {
      const addOn = product.add_ons?.find(a => a.id === addOnId);
      if (addOn) {
        addOnsPrice += addOn.price;
      }
    });
  }
  
  return (basePrice + addOnsPrice) * quantity;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      deliveryFee: 0,
      taxes: 0,
      discount: 0,
      grandTotal: 0,

      addItem: (product, quantity = 1, options) => {
        const existingItemIndex = get().items.findIndex(
          item => item.product.id === product.id &&
          item.selectedVariation === options?.selectedVariation &&
          JSON.stringify(item.selectedAddOns) === JSON.stringify(options?.selectedAddOns)
        );

        if (existingItemIndex >= 0) {
          // Update existing item
          const items = [...get().items];
          items[existingItemIndex].quantity += quantity;
          items[existingItemIndex].totalPrice = calculateItemPrice(
            product,
            items[existingItemIndex].quantity,
            options
          );
          set({ items });
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `${product.id}-${Date.now()}`,
            product,
            quantity,
            selectedVariation: options?.selectedVariation,
            selectedAddOns: options?.selectedAddOns,
            specialInstructions: options?.specialInstructions,
            price: calculateItemPrice(product, 1, options),
            totalPrice: calculateItemPrice(product, quantity, options),
          };
          set({ items: [...get().items, newItem] });
        }
        
        get().calculateTotals();
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter(item => item.id !== itemId) });
        get().calculateTotals();
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const items = get().items.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity,
              totalPrice: calculateItemPrice(item.product, quantity, {
                selectedVariation: item.selectedVariation,
                selectedAddOns: item.selectedAddOns,
              }),
            };
          }
          return item;
        });
        
        set({ items });
        get().calculateTotals();
      },

      updateItemOptions: (itemId, options) => {
        const items = get().items.map(item => {
          if (item.id === itemId) {
            const updatedItem = {
              ...item,
              selectedVariation: options.selectedVariation,
              selectedAddOns: options.selectedAddOns,
              specialInstructions: options.specialInstructions,
            };
            updatedItem.totalPrice = calculateItemPrice(item.product, item.quantity, options);
            return updatedItem;
          }
          return item;
        });
        
        set({ items });
        get().calculateTotals();
      },

      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
          deliveryFee: 0,
          taxes: 0,
          discount: 0,
          grandTotal: 0,
        });
      },

      setDeliveryFee: (fee) => {
        set({ deliveryFee: fee });
        get().calculateTotals();
      },

      setTaxes: (taxes) => {
        set({ taxes });
        get().calculateTotals();
      },

      setDiscount: (discount) => {
        set({ discount });
        get().calculateTotals();
      },

      calculateTotals: () => {
        const items = get().items;
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const grandTotal = totalPrice + get().deliveryFee + get().taxes - get().discount;
        
        set({
          totalItems,
          totalPrice,
          grandTotal: Math.max(0, grandTotal),
        });
      },

      getItem: (productId) => {
        return get().items.find(item => item.product.id === productId);
      },

      isItemInCart: (productId) => {
        return get().items.some(item => item.product.id === productId);
      },

      getItemQuantity: (productId) => {
        const item = get().items.find(item => item.product.id === productId);
        return item?.quantity || 0;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        deliveryFee: state.deliveryFee,
        taxes: state.taxes,
        discount: state.discount,
      }),
    }
  )
); 