import { create } from 'zustand';
import type { GestureType, EffectType, HandData } from '@/types';

interface GestureState {
  cameraEnabled: boolean;
  cameraMirrored: boolean;
  hands: HandData[];
  currentGesture: GestureType | null;
  gestureConfidence: number;
  activeEffect: EffectType | null;
  effectIntensity: number;
  fps: number;
  isModelLoaded: boolean;
  gestureHoldTime: number;

  setCameraEnabled: (enabled: boolean) => void;
  toggleCameraMirror: () => void;
  setHands: (hands: HandData[]) => void;
  setCurrentGesture: (gesture: GestureType | null, confidence: number) => void;
  setActiveEffect: (effect: EffectType | null) => void;
  setEffectIntensity: (intensity: number) => void;
  setFps: (fps: number) => void;
  setIsModelLoaded: (loaded: boolean) => void;
  reset: () => void;
}

const initialState = {
  cameraEnabled: false,
  cameraMirrored: true,
  hands: [] as HandData[],
  currentGesture: null as GestureType | null,
  gestureConfidence: 0,
  activeEffect: null as EffectType | null,
  effectIntensity: 0,
  fps: 0,
  isModelLoaded: false,
  gestureHoldTime: 0,
};

export const useGestureStore = create<GestureState>((set) => ({
  ...initialState,

  setCameraEnabled: (enabled) => set({ cameraEnabled: enabled }),

  toggleCameraMirror: () => set((state) => ({ cameraMirrored: !state.cameraMirrored })),

  setHands: (hands) => set({ hands }),

  setCurrentGesture: (gesture, confidence) =>
    set((state) => ({
      currentGesture: gesture,
      gestureConfidence: confidence,
      gestureHoldTime: gesture === state.currentGesture ? state.gestureHoldTime + 1 : 0,
    })),

  setActiveEffect: (effect) => set({ activeEffect: effect }),

  setEffectIntensity: (intensity) => set({ effectIntensity: Math.min(1, Math.max(0, intensity)) }),

  setFps: (fps) => set({ fps }),

  setIsModelLoaded: (loaded) => set({ isModelLoaded: loaded }),

  reset: () => set(initialState),
}));
