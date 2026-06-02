import { useNavigate } from 'react-router-dom';
import { GESTURE_CONFIGS } from '@/utils/constants';
import {
  Hand, CircleDot, ThumbsUp, Scissors, Circle, MoveRight, ArrowUp, Waves, Heart,
  ArrowLeft, Sparkles
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Hand,
  CircleDot,
  ThumbsUp,
  Scissors,
  Circle,
  MoveRight,
  ArrowUp,
  Waves,
  Heart,
};

export function GalleryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-deep-space relative overflow-hidden">
      <div className="absolute inset-0 z-[1] scanlines pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate('/play')}
            className="flex items-center gap-2 text-white/50 hover:text-neon-cyan transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">返回体验</span>
          </button>

          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-neon-cyan" />
            <h1 className="font-orbitron text-2xl text-white">手势图鉴</h1>
            <span className="font-mono-tech text-xs text-white/30">GALLERY</span>
          </div>

          <div className="w-20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {GESTURE_CONFIGS.map((config, index) => {
            const IconComponent = iconMap[config.icon];
            return (
              <div
                key={config.gesture}
                className="glass-card p-6 hover:border-opacity-50 transition-all duration-300 group"
                style={{
                  borderColor: `${config.color}20`,
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: `${config.color}15`,
                    border: `1px solid ${config.color}40`,
                    boxShadow: `0 0 20px ${config.color}10`,
                  }}
                >
                  <IconComponent className="w-7 h-7" style={{ color: config.color }} />
                </div>

                <h3 className="font-orbitron text-lg font-semibold text-white mb-1">
                  {config.name}
                </h3>
                <p className="font-mono-tech text-xs text-white/30 mb-3">
                  {config.nameEn}
                </p>

                <div
                  className="w-full h-px mb-3"
                  style={{ backgroundColor: `${config.color}30` }}
                />

                <p className="text-sm text-white/50 mb-2">{config.description}</p>

                <div
                  className="mt-4 p-3 rounded-lg"
                  style={{ backgroundColor: `${config.color}08` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3 h-3" style={{ color: config.color }} />
                    <span className="text-xs font-semibold" style={{ color: config.color }}>
                      {config.effectName}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">{config.effectDescription}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/30 text-sm">
            共 {GESTURE_CONFIGS.length} 种手势 · 每种手势对应独特特效
          </p>
        </div>
      </div>
    </div>
  );
}
