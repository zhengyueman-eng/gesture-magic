import { forwardRef } from 'react';
import { useGestureStore } from '@/stores/gestureStore';

export const CameraPreview = forwardRef<HTMLVideoElement>((_, ref) => {
  const cameraMirrored = useGestureStore((s) => s.cameraMirrored);

  return (
    <div
      className="fixed bottom-24 right-6 z-20 rounded-xl overflow-hidden"
      style={{
        boxShadow: '0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1)',
        border: '2px solid rgba(0, 240, 255, 0.5)',
      }}
    >
      <video
        ref={ref}
        className="w-48 h-36 object-cover bg-black"
        style={{
          transform: cameraMirrored ? 'scaleX(-1)' : 'none',
        }}
        playsInline
        muted
      />
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-mono-tech text-white/70">LIVE</span>
      </div>
    </div>
  );
});

CameraPreview.displayName = 'CameraPreview';
