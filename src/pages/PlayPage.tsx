import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGestureStore } from '@/stores/gestureStore';
import { useGameStore } from '@/stores/gameStore';
import { useMediaPipe } from '@/hooks/useMediaPipe';
import { EffectCanvas } from '@/components/EffectCanvas';
import { BalloonGame } from '@/components/BalloonGame';
import { GestureStatusBar } from '@/components/GestureStatusBar';
import { ControlPanel } from '@/components/ControlPanel';
import { PolaroidCamera } from '@/components/PolaroidCamera';
import { Loader2, Gamepad2 } from 'lucide-react';

export function PlayPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const isModelLoaded = useGestureStore((s) => s.isModelLoaded);
  const cameraMirrored = useGestureStore((s) => s.cameraMirrored);
  const [showGame, setShowGame] = useState(false);

  const { startCamera } = useMediaPipe(videoRef);
  const resetGame = useGameStore((s) => s.resetGame);

  useEffect(() => {
    const init = async () => {
      try {
        await startCamera();
      } catch {
        navigate('/');
      }
    };
    init();
  }, [startCamera, navigate]);

  const handleToggleGame = () => {
    if (showGame) {
      // 退出游戏时重置
      resetGame();
    }
    setShowGame(!showGame);
  };

  return (
    <div className="relative min-h-screen bg-deep-space overflow-hidden">
      {/* 摄像头画面作为主背景 */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{
            transform: cameraMirrored ? 'scaleX(-1)' : 'none',
          }}
          playsInline
          muted
        />
        {/* 暗角叠加层，增强特效可见度 */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10, 10, 15, 0.6) 100%)',
          }}
        />
      </div>

      {/* 扫描线效果 */}
      <div className="absolute inset-0 z-[1] scanlines pointer-events-none" />

      {/* 加载遮罩 */}
      {!isModelLoaded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-space/90">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-neon-cyan animate-spin mx-auto mb-4" />
            <p className="font-orbitron text-neon-cyan text-lg">加载魔法模型中...</p>
            <p className="text-white/40 text-sm mt-2">Loading MediaPipe Hands Model</p>
          </div>
        </div>
      )}

      {/* 特效 Canvas - 叠加在摄像头画面上 */}
      {!showGame && <EffectCanvas />}

      {/* 戳气球游戏 */}
      {showGame && <BalloonGame />}

      {/* UI 层 */}
      {!showGame && <GestureStatusBar />}
      <ControlPanel />

      {/* 拍立得相机 */}
      {!showGame && <PolaroidCamera videoRef={videoRef} />}

      {/* 游戏入口按钮 */}
      <div className="fixed top-6 right-6 z-30">
        <button
          onClick={handleToggleGame}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${
            showGame
              ? 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30'
              : 'bg-neon-cyan/10 border-neon-cyan/50 hover:bg-neon-cyan/20'
          }`}
        >
          <Gamepad2 className={`w-5 h-5 ${showGame ? 'text-red-400' : 'text-neon-cyan'}`} />
          <span className={`text-sm ${showGame ? 'text-red-400' : 'text-white/70'}`}>
            {showGame ? '退出游戏' : '戳气球'}
          </span>
        </button>
      </div>

      <div className="fixed top-6 left-6 z-20">
        <h2 className="font-orbitron text-xl text-white/30">GESTURE MAGIC</h2>
      </div>
    </div>
  );
}
