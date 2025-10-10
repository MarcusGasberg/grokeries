import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ShoppingState {
  isActive: boolean;
  startTime: number | null;
  activeListId: string | null;
  categoryFilter: string | null;
}

interface ShoppingActions {
  startShopping: (listId: string) => void;
  endShopping: () => void;
  setCategoryFilter: (category: string | null) => void;
  reset: () => void;
}

const initialState: ShoppingState = {
  isActive: false,
  startTime: null,
  activeListId: null,
  categoryFilter: null,
};

export const useShoppingStore = create<ShoppingState & ShoppingActions>()(
  persist(
    (set) => ({
      ...initialState,

      startShopping: (listId: string) =>
        set({
          isActive: true,
          startTime: Date.now(),
          activeListId: listId,
          categoryFilter: null,
        }),

      endShopping: () =>
        set({
          isActive: false,
          startTime: null,
          activeListId: null,
          categoryFilter: null,
        }),

      setCategoryFilter: (category: string | null) =>
        set({ categoryFilter: category }),

      reset: () => set(initialState),
    }),
    {
      name: "shopping-trip-storage",
    }
  )
);
