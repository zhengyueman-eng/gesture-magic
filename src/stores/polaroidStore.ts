import { create } from 'zustand';

export interface PolaroidPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  dateStr: string;
}

interface PolaroidState {
  photos: PolaroidPhoto[];
  isCapturing: boolean;
  countdown: number;
  showPolaroid: boolean;
  latestPhoto: PolaroidPhoto | null;
  showGallery: boolean;
  
  // Actions
  addPhoto: (photo: PolaroidPhoto) => void;
  deletePhoto: (id: string) => void;
  setIsCapturing: (capturing: boolean) => void;
  setCountdown: (count: number) => void;
  setShowPolaroid: (show: boolean) => void;
  setLatestPhoto: (photo: PolaroidPhoto | null) => void;
  setShowGallery: (show: boolean) => void;
  clearPhotos: () => void;
}

const MAX_PHOTOS = 20;

export const usePolaroidStore = create<PolaroidState>((set, get) => ({
  photos: [],
  isCapturing: false,
  countdown: 0,
  showPolaroid: false,
  latestPhoto: null,
  showGallery: false,

  addPhoto: (photo) => {
    set((state) => {
      const newPhotos = [photo, ...state.photos].slice(0, MAX_PHOTOS);
      return { photos: newPhotos, latestPhoto: photo };
    });
  },

  deletePhoto: (id) => {
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id),
    }));
  },

  setIsCapturing: (capturing) => set({ isCapturing: capturing }),
  
  setCountdown: (count) => set({ countdown: count }),
  
  setShowPolaroid: (show) => set({ showPolaroid: show }),
  
  setLatestPhoto: (photo) => set({ latestPhoto: photo }),
  
  setShowGallery: (show) => set({ showGallery: show }),

  clearPhotos: () => set({ photos: [], latestPhoto: null }),
}));
