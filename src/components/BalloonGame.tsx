import { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGestureStore } from '@/stores/gestureStore';
import { useAnimationFrame } from '@/hooks/useAnimationFrame';
import {
  createBalloon,
  updateBalloons,
  checkBalloonPop,
  createSmokeParticles,
  updateSmokeParticles,
  drawBalloon,
  drawSmokeParticle,
  type Balloon,
  type SmokeParticle,
} from '@/utils/game/balloonGame';
import { soundManager, type SoundType } from '@/utils/soundManager';
import { Trophy, Timer, RotateCcw, Play, Volume2, VolumeX, Music } from 'lucide-react';

export function BalloonGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balloonsRef = useRef<Balloon[]>([]);
  const smokeParticlesRef = useRef<SmokeParticle[]>([]);
  const spawnTimerRef = useRef(0);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const [volume, setVolume] = useState(soundManager.getVolume());
  const [selectedSound, setSelectedSound] = useState<SoundType>(soundManager.getCurrentSound());
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  const isPlaying = useGameStore((s) => s.isPlaying);
  const score = useGameStore((s) => s.score);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const startGame = useGameStore((s) => s.startGame);
  const endGame = useGameStore((s) => s.endGame);
  const incrementScore = useGameStore((s) => s.incrementScore);
  const decrementTime = useGameStore((s) => s.decrementTime);
  const resetGame = useGameStore((s) => s.resetGame);

  const hands = useGestureStore((s) => s.hands);

  // 游戏计时器
  useEffect(() => {
    if (isPlaying) {
      gameTimerRef.current = setInterval(() => {
        decrementTime();
      }, 1000);
    } else {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
        gameTimerRef.current = null;
      }
    }

    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, [isPlaying, decrementTime]);

  // 游戏主循环
  useAnimationFrame((deltaTime) => {
    if (!isPlaying || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 生成新气球
    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current > 0.4) { // 每0.4秒生成
      spawnTimerRef.current = 0;
      if (balloonsRef.current.length < 10) { // 最多10个气球
        balloonsRef.current.push(createBalloon(canvas.width, balloonsRef.current));
      }
    }

    // 更新气球位置
    balloonsRef.current = updateBalloons(balloonsRef.current, deltaTime, canvas.height);

    // 检测手指戳气球
    for (const hand of hands) {
      if (hand.landmarks.length >= 21) {
        const indexTip = hand.landmarks[8];
        const { popped, remaining } = checkBalloonPop(
          balloonsRef.current,
          indexTip,
          canvas.width,
          canvas.height
        );

        // 处理被戳破的气球
        for (const balloon of popped) {
          // 增加分数
          incrementScore();
          // 创建烟雾粒子
          const particles = createSmokeParticles(balloon);
          smokeParticlesRef.current.push(...particles);
          // 播放音效
          soundManager.playPopSound();
        }

        balloonsRef.current = remaining;
      }
    }

    // 更新烟雾粒子
    smokeParticlesRef.current = updateSmokeParticles(smokeParticlesRef.current, deltaTime);

    // 渲染
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制烟雾（在气球下方）
    for (const particle of smokeParticlesRef.current) {
      drawSmokeParticle(ctx, particle);
    }

    // 绘制气球
    for (const balloon of balloonsRef.current) {
      drawBalloon(ctx, balloon);
    }
  });

  // 处理窗口大小变化
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

  const handleStartGame = () => {
    balloonsRef.current = [];
    smokeParticlesRef.current = [];
    spawnTimerRef.current = 0;
    soundManager.resume();
    startGame();
  };

  const handleRestartGame = () => {
    balloonsRef.current = [];
    smokeParticlesRef.current = [];
    spawnTimerRef.current = 0;
    soundManager.resume();
    resetGame();
    startGame();
  };

  const handleToggleMute = () => {
    const newMuted = soundManager.toggleMute();
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    soundManager.setVolume(newVolume);
    setVolume(newVolume);
  };

  const handleSoundSelect = (sound: SoundType) => {
    soundManager.setCurrentSound(sound);
    setSelectedSound(sound);
    soundManager.resume();
    soundManager.playPopSound();
  };

  const soundOptions: { value: SoundType; label: string; desc: string }[] = [
    { value: 'A', label: '音效 A', desc: '清脆"啪"声' },
    { value: 'B', label: '音效 B', desc: '低沉"砰"声' },
    { value: 'C', label: '音效 C', desc: '尖锐"啵"声' },
    { value: 'D', label: '音效 D', desc: '可爱"啵"声' },
  ];

  return (
    <div className="absolute inset-0 z-20">
      {/* 游戏画布 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* 游戏UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 顶部状态栏 */}
        {isPlaying && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-6">
            {/* 得分 */}
            <div
              className="glass-card px-6 py-3 flex items-center gap-3"
              style={{ boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}
            >
              <Trophy className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-[10px] text-white/50 font-mono-tech">SCORE</div>
                <div className="text-2xl font-orbitron text-white">{score}</div>
              </div>
            </div>

            {/* 剩余时间 */}
            <div
              className="glass-card px-6 py-3 flex items-center gap-3"
              style={{
                boxShadow: timeLeft <= 5
                  ? '0 0 20px rgba(255, 50, 50, 0.5)'
                  : '0 0 20px rgba(0, 240, 255, 0.3)'
              }}
            >
              <Timer className={`w-5 h-5 ${timeLeft <= 5 ? 'text-red-400' : 'text-neon-cyan'}`} />
              <div>
                <div className="text-[10px] text-white/50 font-mono-tech">TIME</div>
                <div className={`text-2xl font-orbitron ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                  {timeLeft}s
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 音量控制 - 放在退出游戏按钮左边 */}
        {isPlaying && (
          <div className="absolute top-6 right-36 glass-card px-4 py-2 flex items-center gap-3 pointer-events-auto">
            <button
              onClick={handleToggleMute}
              className="text-white/70 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              disabled={isMuted}
              className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
              style={{
                background: `linear-gradient(to right, #00f0ff ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`
              }}
            />
          </div>
        )}

        {/* 开始游戏界面 */}
        {!isPlaying && timeLeft === 30 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-auto">
            <div className="text-center">
              <h2 className="font-orbitron text-4xl text-white mb-2">戳气球</h2>
              <p className="text-white/60 mb-6">用食指指尖戳破掉落的气球！</p>

              <button
                onClick={handleStartGame}
                className="neon-btn flex items-center gap-3 mx-auto mb-6"
              >
                <Play className="w-5 h-5" />
                开始游戏
              </button>

              {/* 音效选择 */}
              <div className="relative">
                <button
                  onClick={() => setShowSoundMenu(!showSoundMenu)}
                  className="glass-card px-4 py-2 flex items-center gap-2 mx-auto text-white/80 hover:text-white transition-colors"
                >
                  <Music className="w-4 h-4" />
                  <span className="text-sm">气球破裂音效</span>
                  <span className="text-xs text-neon-cyan ml-2">
                    {soundOptions.find((s) => s.value === selectedSound)?.label}
                  </span>
                </button>

                {/* 下拉菜单 */}
                {showSoundMenu && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 glass-card py-2 min-w-[160px]">
                    {soundOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleSoundSelect(option.value);
                          setShowSoundMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          selectedSound === option.value
                            ? 'text-neon-cyan bg-white/10'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          <span className="text-xs text-white/40">{option.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 游戏结束界面 */}
        {!isPlaying && timeLeft === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-auto">
            <div className="text-center">
              <h2 className="font-orbitron text-4xl text-white mb-4">时间到！</h2>
              <div className="glass-card p-8 mb-6 inline-block">
                <div className="text-[10px] text-white/50 font-mono-tech mb-2">最终得分</div>
                <div className="text-6xl font-orbitron text-yellow-400">{score}</div>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleRestartGame}
                  className="neon-btn flex items-center gap-3"
                >
                  <RotateCcw className="w-5 h-5" />
                  再玩一次
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
