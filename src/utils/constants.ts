import type { GestureConfig } from '@/types';

export const GESTURE_CONFIGS: GestureConfig[] = [
  {
    gesture: 'open_palm',
    name: '张开手掌',
    nameEn: 'Open Palm',
    description: '五指完全张开，掌心正对摄像头',
    effect: 'particle_storm',
    effectName: '粒子风暴',
    effectDescription: '从手掌位置爆发彩色粒子，向外扩散',
    icon: 'Hand',
    color: '#00f0ff',
  },
  {
    gesture: 'heart_hands',
    name: '双手比心',
    nameEn: 'Heart Hands',
    description: '双手食指和中指靠拢形成心形',
    effect: 'floating_hearts',
    effectName: '飘浮爱心',
    effectDescription: '红色立体爱心从双手中飘出',
    icon: 'Heart',
    color: '#ff1744',
  },
  {
    gesture: 'peace_sign',
    name: '比耶',
    nameEn: 'Peace Sign',
    description: '伸出食指和中指，做出胜利手势',
    effect: 'polaroid_photo',
    effectName: '拍立得拍照',
    effectDescription: '触发3秒倒计时，拍摄一张拍立得照片',
    icon: 'Scissors',
    color: '#39ff14',
  },
];

export const GESTURE_EFFECT_MAP: Record<string, string> = {
  open_palm: 'particle_storm',
  heart_hands: 'floating_hearts',
};

export const EFFECT_COLORS: Record<string, string[]> = {
  particle_storm: ['#00f0ff', '#b829ff', '#ff2d95', '#39ff14', '#ffd700'],
  floating_hearts: ['#ff1744', '#ff4081', '#ff6b9d', '#ff8a80'],
};

export const MEDIAPIPE_CONFIG = {
  modelComplexity: 1,
  maxNumHands: 2,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
};

export const PARTICLE_LIMITS = {
  particle_storm: 500,
  floating_hearts: 50,
};
