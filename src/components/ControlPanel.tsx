import { useNavigate } from 'react-router-dom';
import { Volume2, BookOpen, Power } from 'lucide-react';

export function ControlPanel() {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
      <div
        className="glass-card px-6 py-3 flex items-center gap-4"
        style={{ boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)' }}
      >
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-neon-cyan/50"
          title="音效"
        >
          <Volume2 className="w-4 h-4 text-neon-cyan" />
          <span className="text-xs text-white/70">音效</span>
        </button>

        <div className="w-px h-6 bg-white/10" />

        <button
          onClick={() => navigate('/gallery')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-neon-purple/50"
          title="手势图鉴"
        >
          <BookOpen className="w-4 h-4 text-neon-purple" />
          <span className="text-xs text-white/70">图鉴</span>
        </button>

        <div className="w-px h-6 bg-white/10" />

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors border border-white/10 hover:border-red-500/50"
          title="退出"
        >
          <Power className="w-4 h-4 text-red-400" />
          <span className="text-xs text-white/70">退出</span>
        </button>
      </div>
    </div>
  );
}
