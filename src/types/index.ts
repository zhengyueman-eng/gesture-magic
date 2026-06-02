export type GestureType =
  | 'open_palm'
  | 'heart_hands'
  | 'peace_sign';

export type EffectType =
  | 'particle_storm'
  | 'floating_hearts';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: HandLandmark[];
  gesture: GestureType | null;
  center: { x: number; y: number };
  handedness: 'Left' | 'Right';
}

export interface HandResults {
  multiHandLandmarks: HandLandmark[][];
  multiHandedness: { label: string; score: number }[];
}

export interface GestureConfig {
  gesture: GestureType;
  name: string;
  nameEn: string;
  description: string;
  effect: EffectType;
  effectName: string;
  effectDescription: string;
  icon: string;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface EffectBase {
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  isComplete(): boolean;
  destroy?(): void;
}

export interface CameraState {
  enabled: boolean;
  mirrored: boolean;
  stream: MediaStream | null;
}
