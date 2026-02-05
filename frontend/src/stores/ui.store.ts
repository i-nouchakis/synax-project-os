import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Floor plan visibility preference
  floorPlansHiddenByDefault: boolean;
  setFloorPlansHiddenByDefault: (hidden: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      floorPlansHiddenByDefault: false,
      setFloorPlansHiddenByDefault: (hidden) => set({ floorPlansHiddenByDefault: hidden }),
    }),
    {
      name: 'synax-ui-preferences',
    }
  )
);
