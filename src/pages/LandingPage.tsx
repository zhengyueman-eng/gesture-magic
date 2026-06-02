import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Sparkles, Hand, Zap, ChevronRight } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [showInstructions, setShowInstructions] = useState(false);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#00f0ff', '#b829ff', '#ff2d95', '#39ff14'];
    for (let i = 0; i < 80; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission('granted');
      setShowInstructions(true);
    } catch {
      setCameraPermission('denied');
    }
  };

  const startExperience = () => {
    navigate('/play');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div className="absolute inset-0 z-[1] scanlines pointer-events-none" />

      <div className="relative z-10 text-center px-4 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-neon-cyan animate-pulse" />
            <span className="font-mono-tech text-sm text-neon-cyan tracking-[0.3em]">
              INTERACTIVE EXPERIENCE
            </span>
            <Sparkles className="w-6 h-6 text-neon-purple animate-pulse" />
          </div>

          <h1 className="font-orbitron text-5xl md:text-7xl font-bold mb-2">
            <span className="neon-text">GESTURE</span>
          </h1>
          <h1 className="font-orbitron text-5xl md:text-7xl font-bold mb-6">
            <span className="neon-text-purple">MAGIC</span>
          </h1>

          <p className="text-white/60 text-lg mb-2">
            对着摄像头做手势，释放你的魔法
          </p>
          <p className="text-white/40 text-sm font-mono-tech">
            Make gestures to the camera and unleash your magic
          </p>
        </div>

        {!showInstructions ? (
          <div className="space-y-6">
            {cameraPermission === 'denied' && (
              <div className="glass-card p-4 border-red-500/30">
                <p className="text-red-400 text-sm">
                  摄像头权限被拒绝。请在浏览器设置中允许摄像头访问。
                </p>
              </div>
            )}

            <button
              onClick={requestCamera}
              className="neon-btn text-lg px-10 py-4 animate-pulse-glow"
            >
              <span className="flex items-center gap-3">
                <Camera className="w-5 h-5" />
                开启魔法之旅
                <ChevronRight className="w-5 h-5" />
              </span>
            </button>

            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                  <Hand className="w-5 h-5 text-neon-cyan" />
                </div>
                <span className="text-xs text-white/50">手势识别</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-neon-purple" />
                </div>
                <span className="text-xs text-white/50">触发特效</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-neon-pink" />
                </div>
                <span className="text-xs text-white/50">实时识别</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 text-left">
              <h3 className="font-orbitron text-lg text-neon-cyan mb-4">使用指南</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan text-sm font-bold">1</div>
                  <span className="text-white/70 text-sm">举起你的手，让摄像头看到</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple text-sm font-bold">2</div>
                  <span className="text-white/70 text-sm">做出支持的手势（如张开手掌、比耶等）</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neon-pink/20 flex items-center justify-center text-neon-pink text-sm font-bold">3</div>
                  <span className="text-white/70 text-sm">观察屏幕上对应的炫酷特效！</span>
                </div>
              </div>
            </div>

            <button
              onClick={startExperience}
              className="neon-btn text-lg px-10 py-4 animate-pulse-glow"
            >
              <span className="flex items-center gap-3">
                <Zap className="w-5 h-5" />
                开始体验
                <ChevronRight className="w-5 h-5" />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
