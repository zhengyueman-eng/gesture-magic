import { create } from 'zustand';

interface GameState {
  isPlaying: boolean;
  score: number;
  timeLeft: number;
  gameDuration: number;

  startGame: () => void;
  endGame: () => void;
  incrementScore: () => void;
  decrementTime: () => void;
  resetGame: () => void;
}

const GAME_DURATION = 30; // 30秒

export const useGameStore = create<GameState>((set) => ({
  isPlaying: false,
  score: 0,
  timeLeft: GAME_DURATION,
  gameDuration: GAME_DURATION,

  startGame: () => set({ isPlaying: true, score: 0, timeLeft: GAME_DURATION }),

  endGame: () => set({ isPlaying: false }),

  incrementScore: () => set((state) => ({ score: state.score + 1 })),

  decrementTime: () => set((state) => {
    const newTime = state.timeLeft - 1;
    if (newTime <= 0) {
      return { timeLeft: 0, isPlaying: false };
    }
    return { timeLeft: newTime };
  }),

  resetGame: () => set({ isPlaying: false, score: 0, timeLeft: GAME_DURATION }),
}));
