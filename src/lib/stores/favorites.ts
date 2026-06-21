"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesStore {
  favorites: string[]; // Project IDs
  addFavorite: (projectId: string) => void;
  removeFavorite: (projectId: string) => void;
  toggleFavorite: (projectId: string) => void;
  isFavorite: (projectId: string) => boolean;
  clearFavorites: () => void;
  exportFavorites: () => string;
  importFavorites: (data: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (projectId) =>
        set((state) => ({
          favorites: state.favorites.includes(projectId)
            ? state.favorites
            : [...state.favorites, projectId],
        })),

      removeFavorite: (projectId) =>
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== projectId),
        })),

      toggleFavorite: (projectId) => {
        const { favorites } = get();
        if (favorites.includes(projectId)) {
          set({ favorites: favorites.filter((id) => id !== projectId) });
        } else {
          set({ favorites: [...favorites, projectId] });
        }
      },

      isFavorite: (projectId) => get().favorites.includes(projectId),

      clearFavorites: () => set({ favorites: [] }),

      exportFavorites: () => JSON.stringify(get().favorites),

      importFavorites: (data) => {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
            set({ favorites: parsed });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    { name: "martech-favorites" }
  )
);
