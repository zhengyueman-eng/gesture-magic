import type { HandLandmark } from '@/types';

export interface Balloon {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  wobble: number;
  wobbleSpeed: number;
}

export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

const BALLOON_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b',
  '#eb4d4b', '#6c5ce7', '#00b894', '#fd79a8', '#fdcb6e'
];

let balloonIdCounter = 0;

export function createBalloon(canvasWidth: number, existingBalloons: Balloon[] = []): Balloon {
  const size = 70 + Math.random() * 30; // 70-100像素，更大的气球
  const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];

  // 计算安全的x位置，避免与现有气球重叠
  let x: number;
  let attempts = 0;
  const minDistance = size * 2.5; // 最小间距为气球直径的2.5倍

  do {
    x = Math.random() * (canvasWidth - size * 2) + size;
    attempts++;

    // 检查与现有气球的距离
    const tooClose = existingBalloons.some((b) => {
      // 只检查屏幕顶部的气球（y < 200）
      if (b.y > 200) return false;
      const dx = x - b.x;
      const dy = -size * 2 - b.y; // 新气球在屏幕外顶部
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < minDistance;
    });

    if (!tooClose) break;
  } while (attempts < 10);

  return {
    id: balloonIdCounter++,
    x,
    y: -size * 2,
    vx: (Math.random() - 0.5) * 30,
    vy: 250 + Math.random() * 50, // 下落速度 250-300像素/秒
    size,
    color,
    alpha: 0.5, // 半透明
    rotation: 0,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 1 + Math.random() * 1.5,
  };
}

export function updateBalloons(balloons: Balloon[], deltaTime: number, canvasHeight: number): Balloon[] {
  for (const b of balloons) {
    // 下落
    b.y += b.vy * deltaTime;
    b.x += b.vx * deltaTime;

    // 左右摇摆
    b.wobble += b.wobbleSpeed * deltaTime;
    b.x += Math.sin(b.wobble) * 15 * deltaTime;

    // 轻微旋转
    b.rotation = Math.sin(b.wobble * 0.5) * 0.1;
  }

  // 移除超出屏幕底部的气球
  return balloons.filter((b) => b.y < canvasHeight + b.size * 2);
}

export function checkBalloonPop(
  balloons: Balloon[],
  fingerTip: HandLandmark,
  canvasWidth: number,
  canvasHeight: number
): { popped: Balloon[]; remaining: Balloon[] } {
  const fingerX = fingerTip.x * canvasWidth;
  const fingerY = fingerTip.y * canvasHeight;

  const popped: Balloon[] = [];
  const remaining: Balloon[] = [];

  for (const b of balloons) {
    const balloonX = b.x;
    const balloonY = b.y;

    // 计算距离
    const dx = fingerX - balloonX;
    const dy = fingerY - balloonY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 判定范围：气球半径的1.2倍
    if (distance < b.size * 1.2) {
      popped.push(b);
    } else {
      remaining.push(b);
    }
  }

  return { popped, remaining };
}

export function createSmokeParticles(balloon: Balloon): SmokeParticle[] {
  const particles: SmokeParticle[] = [];
  const count = 6 + Math.floor(Math.random() * 4); // 6-10个烟雾粒子

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 30 + Math.random() * 40;

    particles.push({
      x: balloon.x,
      y: balloon.y,
      vx: Math.cos(angle) * speed,
      vy: -Math.abs(Math.sin(angle) * speed) - 20, // 向上飘
      size: balloon.size * (0.3 + Math.random() * 0.3),
      color: balloon.color,
      alpha: 0.6,
      life: 0.8 + Math.random() * 0.4,
      maxLife: 1.2,
    });
  }

  return particles;
}

export function updateSmokeParticles(particles: SmokeParticle[], deltaTime: number): SmokeParticle[] {
  for (const p of particles) {
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= deltaTime;
    p.alpha = (p.life / p.maxLife) * 0.6;
  }

  return particles.filter((p) => p.life > 0);
}

// 绘制3D半透明气球
export function drawBalloon(ctx: CanvasRenderingContext2D, balloon: Balloon) {
  ctx.save();
  ctx.translate(balloon.x, balloon.y);
  ctx.rotate(balloon.rotation);

  const { size, color, alpha } = balloon;

  // 绳子
  ctx.globalAlpha = alpha * 0.6;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.quadraticCurveTo(
    Math.sin(balloon.wobble * 2) * size * 0.2,
    size * 1.5,
    0,
    size * 2
  );
  ctx.stroke();

  // 气球底部小结
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size * 0.08, size * 0.95);
  ctx.lineTo(size * 0.08, size * 0.95);
  ctx.lineTo(0, size * 1.05);
  ctx.closePath();
  ctx.fill();

  // 气球主体 - 半透明渐变
  ctx.globalAlpha = alpha;
  const gradient = ctx.createRadialGradient(
    -size * 0.25, -size * 0.25, 0,
    0, 0, size
  );
  gradient.addColorStop(0, lightenColor(color, 60));
  gradient.addColorStop(0.4, color);
  gradient.addColorStop(0.8, color);
  gradient.addColorStop(1, darkenColor(color, 30));
  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.75, size * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // 高光
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-size * 0.2, -size * 0.3, size * 0.12, size * 0.2, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // 边缘发光
  ctx.globalAlpha = alpha * 0.4;
  ctx.strokeStyle = lightenColor(color, 40);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.75, size * 0.9, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// 绘制烟雾粒子
export function drawSmokeParticle(ctx: CanvasRenderingContext2D, particle: SmokeParticle) {
  ctx.globalAlpha = particle.alpha;

  // 烟雾渐变
  const gradient = ctx.createRadialGradient(
    particle.x, particle.y, 0,
    particle.x, particle.y, particle.size
  );
  gradient.addColorStop(0, lightenColor(particle.color, 80));
  gradient.addColorStop(0.5, particle.color);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();
}

// 辅助函数：变亮颜色
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// 辅助函数：变暗颜色
function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}
