import { useEffect, useRef, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { useGestureStore } from '@/stores/gestureStore';
import { usePolaroidStore } from '@/stores/polaroidStore';
import { classifySingleHandGesture, detectHeartHands, getHandCenter } from '@/utils/gestureRules';
import type { HandLandmark, HandData, GestureType } from '@/types';

export function useMediaPipe(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const gestureHistory = useRef<Map<string, string[]>>(new Map());
  const lastGestureTime = useRef(0);

  const setHands = useGestureStore((s) => s.setHands);
  const setCurrentGesture = useGestureStore((s) => s.setCurrentGesture);
  const setActiveEffect = useGestureStore((s) => s.setActiveEffect);
  const setIsModelLoaded = useGestureStore((s) => s.setIsModelLoaded);
  const setFps = useGestureStore((s) => s.setFps);
  const cameraMirrored = useGestureStore((s) => s.cameraMirrored);

  const onResults = useCallback(
    (results: { multiHandLandmarks?: HandLandmark[][]; multiHandedness?: { label: string; score: number }[] }) => {
      const now = performance.now();
      const dt = now - lastGestureTime.current;
      if (dt > 0) {
        setFps(Math.round(1000 / dt));
      }
      lastGestureTime.current = now;

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // 处理多只手的数据
        const handsData: HandData[] = results.multiHandLandmarks.map((landmarks, index) => {
          // 镜像调整
          const adjustedLandmarks = landmarks.map((lm) => ({
            ...lm,
            x: cameraMirrored ? 1 - lm.x : lm.x,
          }));

          const gesture = classifySingleHandGesture(adjustedLandmarks);
          const center = getHandCenter(adjustedLandmarks);
          const handedness = results.multiHandedness?.[index]?.label === 'Left' ? 'Left' : 'Right';

          return {
            landmarks: adjustedLandmarks,
            gesture,
            center,
            handedness: cameraMirrored
              ? (handedness === 'Left' ? 'Right' : 'Left')
              : handedness,
          };
        });

        setHands(handsData);

        // 检测双手比心（优先级最高）
        if (detectHeartHands(handsData)) {
          setCurrentGesture('heart_hands', 1);
          setActiveEffect('floating_hearts');
          return;
        }

        // 检测每只手的单手势
        const detectedGestures: { gesture: GestureType; handId: string }[] = [];

        for (const hand of handsData) {
          const handId = hand.handedness;
          if (!gestureHistory.current.has(handId)) {
            gestureHistory.current.set(handId, []);
          }
          const history = gestureHistory.current.get(handId)!;

          if (hand.gesture) {
            history.push(hand.gesture);
            if (history.length > 3) {
              history.shift();
            }

            // 检查历史记录中是否有2/3一致
            const counts: Record<string, number> = {};
            for (const g of history) {
              counts[g] = (counts[g] || 0) + 1;
            }

            let mostFrequent: string | null = null;
            let maxCount = 0;
            for (const [g, c] of Object.entries(counts)) {
              if (c > maxCount) {
                maxCount = c;
                mostFrequent = g;
              }
            }

            if (mostFrequent && maxCount >= 2) {
              detectedGestures.push({ gesture: mostFrequent as GestureType, handId });
            }
          } else {
            // 没有检测到手势，清空历史
            history.length = 0;
          }
        }

        // 清理不存在的手的历史记录
        const currentHandIds = new Set(handsData.map((h) => h.handedness as string));
        for (const [handId] of gestureHistory.current) {
          if (!currentHandIds.has(handId as string)) {
            gestureHistory.current.delete(handId);
          }
        }

        // 检查是否正在拍立得拍摄中（防止连拍）
        const isPolaroidCapturing = (window as unknown as { polaroidIsCapturing?: boolean }).polaroidIsCapturing;

        // 如果有检测到的手势，触发对应的特效
        if (detectedGestures.length > 0) {
          // 优先取第一个检测到的手势
          const primaryGesture = detectedGestures[0].gesture;
          setCurrentGesture(primaryGesture, detectedGestures.length / handsData.length);

          if (primaryGesture === 'open_palm') {
            setActiveEffect('particle_storm');
          } else if (primaryGesture === 'peace_sign' && !isPolaroidCapturing) {
            // 触发拍立得拍照（仅在非拍摄状态下）
            const startCapture = (window as unknown as { startPolaroidCapture?: () => void }).startPolaroidCapture;
            if (startCapture) {
              startCapture();
            }
          }
        } else {
          // 没有检测到手势
          setCurrentGesture(null, 0);
          setActiveEffect(null);
        }
      } else {
        gestureHistory.current.clear();
        setHands([]);
        setCurrentGesture(null, 0);
        setActiveEffect(null);
      }
    },
    [setHands, setCurrentGesture, setActiveEffect, setFps, cameraMirrored]
  );

  useEffect(() => {
    if (!videoRef.current) return;

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      modelComplexity: 1,
      maxNumHands: 2, // 支持双手
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });

    cameraRef.current = camera;
    setIsModelLoaded(true);

    return () => {
      camera.stop();
      hands.close();
    };
  }, [videoRef, onResults, setIsModelLoaded]);

  const startCamera = useCallback(async () => {
    if (cameraRef.current) {
      await cameraRef.current.start();
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
  }, []);

  return { startCamera, stopCamera };
}
