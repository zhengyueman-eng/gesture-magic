import { useRef, useEffect, useCallback } from 'react';
import { useGestureStore } from '@/stores/gestureStore';
import { usePolaroidStore } from '@/stores/polaroidStore';
import { useAnimationFrame } from '@/hooks/useAnimationFrame';
import { ParticleStormEffect, FloatingHeartsEffect } from '@/utils/effects/particleSystem';
import { getHeartSpawnPosition } from '@/utils/gestureRules';
import type { EffectBase, HandLandmark } from '@/types';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  width: number,
  height: number,
  gestureColor: string
) {
  ctx.strokeStyle = gestureColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (const [start, end] of HAND_CONNECTIONS) {
    const x1 = landmarks[start].x * width;
    const y1 = landmarks[start].y * height;
    const x2 = landmarks[end].x * width;
    const y2 = landmarks[end].y * height;

    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  for (let i = 0; i < landmarks.length; i++) {
    const x = landmarks[i].x * width;
    const y = landmarks[i].y * height;

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = i === 0 ? gestureColor : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, i === 0 ? 8 : 5, 0, Math.PI * 2);
    ctx.fill();

    if (i === 0) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = gestureColor;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

function drawGestureLabel(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  width: number,
  height: number,
  gestureName: string,
  gestureColor: string
) {
  const wrist = landmarks[0];
  const x = wrist.x * width;
  const y = wrist.y * height - 40;

  ctx.font = 'bold 16px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  const textWidth = ctx.measureText(gestureName).width;

  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.roundRect(x - textWidth / 2 - 12, y - 18, textWidth + 24, 28, 8);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = gestureColor;
  ctx.fillText(gestureName, x, y);

  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = gestureColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - textWidth / 2 - 12, y - 18, textWidth + 24, 28, 8);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

export function EffectCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 使用Map存储每只手的特效
  const effectsRef = useRef<Map<string, EffectBase>>(new Map());
  const heartEffectRef = useRef<FloatingHeartsEffect | null>(null);

  const activeEffect = useGestureStore((s) => s.activeEffect);
  const hands = useGestureStore((s) => s.hands);
  const currentGesture = useGestureStore((s) => s.currentGesture);
  
  // 获取拍立得拍摄状态，用于隐藏骨架线
  const isPolaroidCapturing = usePolaroidStore((s) => s.isCapturing);

  const updateEffects = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // 处理双手比心特效
    if (currentGesture === 'heart_hands' && hands.length === 2) {
      const spawnPos = getHeartSpawnPosition(hands);
      if (spawnPos) {
        const x = spawnPos.x * canvas.width;
        const y = spawnPos.y * canvas.height;

        if (!heartEffectRef.current) {
          heartEffectRef.current = new FloatingHeartsEffect(x, y);
        }
        heartEffectRef.current.originX = x;
        heartEffectRef.current.originY = y;
      }
    } else {
      heartEffectRef.current = null;
    }

    // 处理单手特效 - 每只手独立
    const currentHandIds = new Set(hands.map((h) => h.handedness as string));

    // 清理已不存在的手的特效
    for (const [handId] of effectsRef.current) {
      if (!currentHandIds.has(handId as string)) {
        effectsRef.current.delete(handId);
      }
    }

    // 为每只手创建/更新特效
    for (const hand of hands) {
      const handId = hand.handedness;
      const x = hand.center.x * canvas.width;
      const y = hand.center.y * canvas.height;

      if (hand.gesture === 'open_palm') {
        let effect = effectsRef.current.get(handId);
        if (!(effect instanceof ParticleStormEffect)) {
          effect = new ParticleStormEffect(x, y);
          effectsRef.current.set(handId, effect);
        }
        (effect as ParticleStormEffect).originX = x;
        (effect as ParticleStormEffect).originY = y;
      } else {
        // 手势不匹配，移除特效
        effectsRef.current.delete(handId);
      }
    }
  }, [activeEffect, hands, currentGesture]);

  useEffect(() => {
    updateEffects();
  }, [updateEffects]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useAnimationFrame((deltaTime) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (heartEffectRef.current) {
      heartEffectRef.current.update(deltaTime);
      heartEffectRef.current.render(ctx);
    }

    // 渲染每只手的特效
    for (const effect of effectsRef.current.values()) {
      effect.update(deltaTime);
      effect.render(ctx);
    }

    // 绘制所有手的骨架（仅在非拍摄状态下显示）
    if (!isPolaroidCapturing) {
      for (const hand of hands) {
        if (hand.landmarks.length >= 21) {
          let color = '#00f0ff';
          let label = '';

          if (currentGesture === 'heart_hands') {
            color = '#ff1744';
            label = '比心';
          } else if (hand.gesture === 'open_palm') {
            color = '#00f0ff';
            label = '张开手掌';
          }

          drawHandSkeleton(ctx, hand.landmarks, canvas.width, canvas.height, color);

          if (label && (currentGesture !== 'heart_hands' || label === '比心')) {
            drawGestureLabel(ctx, hand.landmarks, canvas.width, canvas.height, label, color);
          }
        }
      }
    }
  });

  return (
    <canvas
      ref={canvasRef}
      data-effect-canvas="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}
