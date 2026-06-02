import { useGestureStore } from '@/stores/gestureStore';
import { GESTURE_CONFIGS } from '@/utils/constants';
import { Hand, Heart, Scissors } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Hand,
  Heart,
  Scissors,
};

export function GestureStatusBar() {
  const currentGesture = useGestureStore((s) => s.currentGesture);
  const gestureConfidence = useGestureStore((s) => s.gestureConfidence);
  const fps = useGestureStore((s) => s.fps);
  const hands = useGestureStore((s) => s.hands);

  const config = currentGesture
    ? GESTURE_CONFIGS.find((g) => g.gesture === currentGesture)
    : null;

  const IconComponent = config ? iconMap[config.icon] : null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
      <div
        className="glass-card px-6 py-3 flex items-center gap-4 min-w-[300px]"
        style={{
          boxShadow: config
            ? `0 0 30px ${config.color}30, inset 0 0 20px ${config.color}10`
            : '0 0 20px rgba(0, 240, 255, 0.1)',
        }}
      >
        {IconComponent ? (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center animate-bounce-in"
            style={{ backgroundColor: `${config?.color}20`, border: `1px solid ${config?.color}50` }}
          >
            <IconComponent className="w-5 h-5" style={{ color: config?.color }} />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10">
            <Hand className="w-5 h-5 text-white/30" />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-orbitron text-sm font-semibold" style={{ color: config?.color || '#ffffff80' }}>
              {config?.name || '等待手势...'}
            </span>
            {config && (
              <span className="text-[10px] font-mono-tech text-white/40">
                {config.nameEn}
              </span>
            )}
          </div>
          {config && (
            <div className="text-xs text-white/50 mt-0.5">
              {config.effectName}
            </div>
          )}
        </div>

        {config && (
          <div className="flex flex-col items-end gap-1">
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${gestureConfidence * 100}%`,
                  backgroundColor: config.color,
                }}
              />
            </div>
            <span className="text-[10px] font-mono-tech text-white/40">
              {Math.round(gestureConfidence * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="glass-card px-3 py-2 flex items-center gap-2">
        <span className="text-[10px] font-mono-tech text-neon-cyan">FPS</span>
        <span className="text-sm font-mono-tech text-white">{fps}</span>
      </div>

      <div className="glass-card px-3 py-2 flex items-center gap-2">
        <span className="text-[10px] font-mono-tech text-white/40">HANDS</span>
        <span className="text-sm font-mono-tech text-white">{hands.length}</span>
      </div>
    </div>
  );
}
