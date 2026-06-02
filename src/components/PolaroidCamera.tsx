import { useRef, useEffect, useState } from 'react';
import { usePolaroidStore } from '@/stores/polaroidStore';
import { soundManager } from '@/utils/soundManager';
import { Camera, X, Trash2, Download } from 'lucide-react';

export function PolaroidCamera({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const polaroidCanvasRef = useRef<HTMLCanvasElement>(null);
  const [animatingPhoto, setAnimatingPhoto] = useState<string | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  const photos = usePolaroidStore((s) => s.photos);
  const isCapturing = usePolaroidStore((s) => s.isCapturing);
  const countdown = usePolaroidStore((s) => s.countdown);
  const showPolaroid = usePolaroidStore((s) => s.showPolaroid);
  const latestPhoto = usePolaroidStore((s) => s.latestPhoto);
  const showGallery = usePolaroidStore((s) => s.showGallery);

  const addPhoto = usePolaroidStore((s) => s.addPhoto);
  const setIsCapturing = usePolaroidStore((s) => s.setIsCapturing);
  const setCountdown = usePolaroidStore((s) => s.setCountdown);
  const setShowPolaroid = usePolaroidStore((s) => s.setShowPolaroid);
  const setShowGallery = usePolaroidStore((s) => s.setShowGallery);
  const deletePhoto = usePolaroidStore((s) => s.deletePhoto);

  // 生成日期字符串
  const getDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 生成文件名
  const getFileName = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `polaroid_${dateStr}_${timeStr}.png`;
  };

  // 下载照片
  const downloadPhoto = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 创建拍立得照片（包含特效）
  const createPolaroidImage = (video: HTMLVideoElement): string | null => {
    // 检查视频是否准备好
    if (!video.videoWidth || !video.videoHeight) {
      console.warn('视频尚未准备好');
      return null;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // 宽幅拍立得尺寸比例 (约 1:0.6)
    const photoWidth = 600;
    const photoHeight = 360;
    const borderTop = 20;
    const borderSide = 20;
    const borderBottom = 80;

    canvas.width = photoWidth + borderSide * 2;
    canvas.height = photoHeight + borderTop + borderBottom;

    // 白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 获取特效 Canvas
    const effectCanvas = document.querySelector('canvas[data-effect-canvas="true"]') as HTMLCanvasElement;

    // 创建一个临时 canvas 来处理视频帧
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    
    // 在临时 canvas 上绘制视频帧
    tempCtx.drawImage(video, 0, 0);
    
    // 如果有特效 Canvas，先翻转特效再叠加
    if (effectCanvas) {
      // 创建翻转后的特效 canvas
      const flippedEffectCanvas = document.createElement('canvas');
      const flippedEffectCtx = flippedEffectCanvas.getContext('2d')!;
      flippedEffectCanvas.width = effectCanvas.width;
      flippedEffectCanvas.height = effectCanvas.height;
      
      // 水平翻转特效
      flippedEffectCtx.translate(effectCanvas.width, 0);
      flippedEffectCtx.scale(-1, 1);
      flippedEffectCtx.drawImage(effectCanvas, 0, 0);
      
      // 将翻转后的特效叠加到视频上
      tempCtx.drawImage(flippedEffectCanvas, 0, 0, video.videoWidth, video.videoHeight);
    }
    
    // 水平翻转临时 canvas（视频+特效）
    const flippedCanvas = document.createElement('canvas');
    const flippedCtx = flippedCanvas.getContext('2d')!;
    flippedCanvas.width = video.videoWidth;
    flippedCanvas.height = video.videoHeight;
    
    flippedCtx.translate(video.videoWidth, 0);
    flippedCtx.scale(-1, 1);
    flippedCtx.drawImage(tempCanvas, 0, 0);

    // 计算视频的裁剪区域（保持宽高比）
    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = photoWidth / photoHeight;
    
    let sx, sy, sw, sh;
    if (videoAspect > targetAspect) {
      // 视频更宽，裁剪左右
      sh = video.videoHeight;
      sw = sh * targetAspect;
      sx = (video.videoWidth - sw) / 2;
      sy = 0;
    } else {
      // 视频更高，裁剪上下
      sw = video.videoWidth;
      sh = sw / targetAspect;
      sx = 0;
      sy = (video.videoHeight - sh) / 2;
    }

    // 绘制翻转后的视频帧（含特效）到主 canvas
    ctx.drawImage(flippedCanvas, sx, sy, sw, sh, borderSide, borderTop, photoWidth, photoHeight);

    // 绘制日期（手写风格）
    ctx.font = 'italic 24px "Comic Sans MS", cursive, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    const dateStr = getDateString();
    ctx.fillText(dateStr, canvas.width / 2, canvas.height - 30);

    return canvas.toDataURL('image/png');
  };

  // 拍照流程
  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const dataUrl = createPolaroidImage(video);

    // 如果照片生成失败，不继续
    if (!dataUrl) {
      console.warn('照片生成失败');
      setIsCapturing(false);
      setCountdown(0);
      return;
    }

    const photo = {
      id: Date.now().toString(),
      dataUrl,
      timestamp: Date.now(),
      dateStr: getDateString(),
    };

    addPhoto(photo);
    setAnimatingPhoto(dataUrl);
    setShowPolaroid(true);

    // 播放咔嚓音效
    soundManager.playShutterSound();

    // 3秒后隐藏相纸动画并恢复拍摄状态
    setTimeout(() => {
      setShowPolaroid(false);
      setAnimatingPhoto(null);
      setIsCapturing(false);
      setCountdown(0);
    }, 3000);
  };

  // 同步拍摄状态到全局，用于防止连拍
  useEffect(() => {
    (window as unknown as { polaroidIsCapturing: boolean }).polaroidIsCapturing = isCapturing;
  }, [isCapturing]);

  // 公开给父组件使用
  useEffect(() => {
    (window as unknown as { startPolaroidCapture: () => void }).startPolaroidCapture = () => {
      if (isCapturing) return;

      setIsCapturing(true);
      setCountdown(3);

      let count = 3;
      const timer = setInterval(() => {
        count--;
        setCountdown(count);

        if (count <= 0) {
          clearInterval(timer);
          capturePhoto();
          // 注意：capturePhoto 中的 setTimeout 会在3秒后设置 isCapturing = false
        }
      }, 1000);
    };
  }, [isCapturing]);

  return (
    <>
      {/* 相机图标 - 左上角，下移避免挡住水印 */}
      <div className="fixed top-16 left-6 z-30">
        <button
          onClick={() => setShowGallery(true)}
          className="relative group"
        >
          <div className="w-14 h-10 bg-gradient-to-b from-gray-100 to-gray-300 rounded-lg shadow-lg border-2 border-gray-400 flex items-center justify-center transition-transform group-hover:scale-105">
            {/* 镜头 */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-gray-600 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-60" />
            </div>
            {/* 闪光灯 */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full opacity-80" />
          </div>
          {/* 照片数量徽章 */}
          {photos.length > 0 && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              {photos.length}
            </div>
          )}
        </button>
      </div>

      {/* 倒计时显示 */}
      {isCapturing && countdown > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-8xl font-bold text-white animate-pulse" style={{ textShadow: '0 0 30px rgba(0,240,255,0.8)' }}>
            {countdown}
          </div>
        </div>
      )}

      {/* 拍立得相纸动画 */}
      {showPolaroid && animatingPhoto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div
            className="polaroid-animation"
            style={{
              animation: 'polaroidMove 3s ease-in-out forwards',
            }}
          >
            <div className="bg-white p-3 pb-16 shadow-2xl" style={{ width: '300px' }}>
              <img src={animatingPhoto} alt="Polaroid" className="w-full h-auto" />
            </div>
          </div>
        </div>
      )}

      {/* 相册弹窗 */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8">
          <div className="w-full max-w-6xl max-h-full overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-orbitron text-2xl text-white">拍立得相册</h2>
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {photos.length === 0 ? (
              <div className="text-center py-20">
                <Camera className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/50">还没有照片，比个耶来拍照吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {photos.map((photo) => (
                  <div key={photo.id} className="group relative">
                    <div 
                      className="bg-white p-2 pb-8 shadow-lg transform transition-transform group-hover:scale-105 cursor-pointer"
                      onClick={() => setEnlargedPhoto(photo.dataUrl)}
                    >
                      <img src={photo.dataUrl} alt="Polaroid" className="w-full h-auto" />
                      <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-600 font-mono">
                        {photo.dateStr}
                      </p>
                    </div>
                    {/* 下载按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPhoto(photo.dataUrl, `polaroid_${photo.id}.png`);
                      }}
                      className="absolute -top-2 right-6 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>
                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto(photo.id);
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 放大查看照片 */}
      {enlargedPhoto && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-8"
          onClick={() => setEnlargedPhoto(null)}
        >
          <button
            onClick={() => setEnlargedPhoto(null)}
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={enlargedPhoto} 
            alt="Enlarged Polaroid" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* CSS 动画 */}
      <style>{`
        @keyframes polaroidMove {
          0% {
            transform: scale(0.5) translateY(100px);
            opacity: 0;
          }
          20% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          70% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          100% {
            transform: scale(0.3) translate(-400px, -300px);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
