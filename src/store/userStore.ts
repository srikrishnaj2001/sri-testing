import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Address } from '../services/orderService';
import { Product } from '../services/productService';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
  loyalty_points?: number;
  total_orders?: number;
  total_spent?: number;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  addresses: Address[];
  defaultAddress: Address | null;
  wishlist: Product[];
  
  // Actions
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  
  // Addresses
  setAddresses: (addresses: Address[]) => void;
  addAddress: (address: Address) => void;
  updateAddress: (addressId: string, updates: Partial<Address>) => void;
  removeAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string) => void;
  
  // Wishlist
  setWishlist: (products: Product[]) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      addresses: [],
      defaultAddress: null,
      wishlist: [],

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
          addresses: [],
          defaultAddress: null,
          wishlist: [],
        });
      },

      setAddresses: (addresses: Address[]) => {
        const defaultAddr = addresses.find(addr => addr.is_default);
        set({ addresses, defaultAddress: defaultAddr || null });
      },

      addAddress: (address: Address) => {
        const addresses = [...get().addresses, address];
        set({ addresses });
        
        if (address.is_default || get().addresses.length === 0) {
          set({ defaultAddress: address });
        }
      },

      updateAddress: (addressId: string, updates: Partial<Address>) => {
        const addresses = get().addresses.map(addr => {
          if (addr.id === addressId) {
            return { ...addr, ...updates };
          }
          return addr;
        });
        
        set({ addresses });
        
        if (updates.is_default) {
          const updatedAddress = addresses.find(addr => addr.id === addressId);
          if (updatedAddress) {
            set({ defaultAddress: updatedAddress });
          }
        }
      },

      removeAddress: (addressId: string) => {
        const addresses = get().addresses.filter(addr => addr.id !== addressId);
        set({ addresses });
        
        if (get().defaultAddress?.id === addressId) {
          set({ defaultAddress: addresses.find(addr => addr.is_default) || null });
        }
      },

      setDefaultAddress: (addressId: string) => {
        const addresses = get().addresses.map(addr => ({
          ...addr,
          is_default: addr.id === addressId
        }));
        
        const defaultAddress = addresses.find(addr => addr.id === addressId);
        set({ addresses, defaultAddress: defaultAddress || null });
      },

      setWishlist: (products: Product[]) => {
        set({ wishlist: products });
      },

      addToWishlist: (product: Product) => {
        const wishlist = [...get().wishlist, product];
        set({ wishlist });
      },

      removeFromWishlist: (productId: string) => {
        const wishlist = get().wishlist.filter(product => product.id !== productId);
        set({ wishlist });
      },

      toggleWishlist: (product: Product) => {
        const isInWishlist = get().wishlist.some(p => p.id === product.id);
        if (isInWishlist) {
          get().removeFromWishlist(product.id);
        } else {
          get().addToWishlist(product);
        }
      },

      isInWishlist: (productId: string) => {
        return get().wishlist.some(product => product.id === productId);
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        addresses: state.addresses,
        defaultAddress: state.defaultAddress,
        wishlist: state.wishlist,
      }),
    }
  )
); 