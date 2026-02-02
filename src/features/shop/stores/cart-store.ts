
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MDLItem } from '@/features/mdl/types';

export interface CartItem extends MDLItem {
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addToCart: (item: MDLItem, quantity?: number) => void;
    removeFromCart: (id: number) => void;
    updateQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addToCart: (item, quantity = 1) => set((state) => {
                const existingItem = state.items.find((i) => i.id === item.id);
                if (existingItem) {
                    return {
                        items: state.items.map((i) =>
                            i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
                        ),
                    };
                }
                return { items: [...state.items, { ...item, quantity }] };
            }),
            removeFromCart: (id) => set((state) => ({
                items: state.items.filter((i) => i.id !== id),
            })),
            updateQuantity: (id, quantity) => set((state) => ({
                items: state.items.map((i) =>
                    i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
                ),
            })),
            clearCart: () => set({ items: [] }),
            getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
            // Defaulting to harga_jabodetabek, assuming client is in Jakarta for now or will be adjusted later
            getTotalPrice: () => get().items.reduce((total, item) => total + ((item.harga_jabodetabek || 0) * item.quantity), 0),
        }),
        {
            name: 'mdl-cart-storage',
        }
    )
);
