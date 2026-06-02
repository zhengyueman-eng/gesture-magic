import type { Particle, EffectBase } from '@/types';
import { EFFECT_COLORS, PARTICLE_LIMITS } from '@/utils/constants';

interface FireworkParticle extends Particle {
  trail: { x: number; y: number }[];
  gravity: number;
  brightness: number;
  type: 'spark' | 'trail' | 'glow';
}

interface HeartParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  pulse: number;
}

interface BalloonParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  wobble: number;
  wobbleSpeed: number;
  stringLength: number;
}

export class ParticleStormEffect implements EffectBase {
  particles: FireworkParticle[] = [];
  originX: number;
  originY: number;
  maxParticles: number;
  colors: string[];
  spawnTimer = 0;
  flashAlpha = 0;
  shockwaveRadius = 0;
  shockwaveAlpha = 0;
  time = 0;

  constructor(x: number, y: number) {
    this.originX = x;
    this.originY = y;
    this.maxParticles = PARTICLE_LIMITS.particle_storm;
    this.colors = EFFECT_COLORS.particle_storm;
  }

  private createParticle(): FireworkParticle {
    const angle = Math.random() * Math.PI * 2;
    const speed = 150 + Math.random() * 500;
    const size = 3 + Math.random() * 8;
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];

    return {
      x: this.originX + (Math.random() - 0.5) * 20,
      y: this.originY + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.2 + Math.random() * 1.5,
      maxLife: 2.5,
      size: size,
      color: color,
      alpha: 1,
      trail: [],
      gravity: 80 + Math.random() * 120,
      brightness: 0.5 + Math.random() * 0.5,
      type: Math.random() > 0.7 ? 'glow' : Math.random() > 0.5 ? 'trail' : 'spark',
    };
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    this.spawnTimer += deltaTime;

    const spawnRate = 0.008;
    if (this.spawnTimer > spawnRate && this.particles.length < this.maxParticles) {
      this.spawnTimer = 0;
      const burstSize = Math.min(15, this.maxParticles - this.particles.length);
      for (let i = 0; i < burstSize; i++) {
        this.particles.push(this.createParticle());
      }
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha -= deltaTime * 3;
    }

    if (this.shockwaveAlpha > 0) {
      this.shockwaveRadius += 400 * deltaTime;
      this.shockwaveAlpha -= deltaTime * 1.5;
    }

    for (const p of this.particles) {
      p.vy += p.gravity * deltaTime;
      p.vx *= 0.985;
      p.vy *= 0.985;

      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 8) {
        p.trail.shift();
      }

      p.life -= deltaTime;
      const lifeRatio = p.life / p.maxLife;
      p.alpha = Math.max(0, lifeRatio * lifeRatio);
      p.brightness = lifeRatio;
    }

    this.particles = this.particles.filter((p) => p.life > 0);

    if (this.particles.length < this.maxParticles * 0.3 && Math.random() < 0.3) {
      this.flashAlpha = 0.4;
      this.shockwaveRadius = 5;
      this.shockwaveAlpha = 0.8;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const canvas = ctx.canvas;

    if (this.flashAlpha > 0) {
      ctx.globalAlpha = this.flashAlpha;
      const flashGradient = ctx.createRadialGradient(
        this.originX, this.originY, 0,
        this.originX, this.originY, 150
      );
      flashGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      flashGradient.addColorStop(0.3, 'rgba(255, 240, 200, 0.3)');
      flashGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
      ctx.fillStyle = flashGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (this.shockwaveAlpha > 0) {
      ctx.globalAlpha = this.shockwaveAlpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.originX, this.originY, this.shockwaveRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = this.shockwaveAlpha * 0.5;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(this.originX, this.originY, this.shockwaveRadius * 0.85, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const p of this.particles) {
      if (p.trail.length >= 2) {
        ctx.globalAlpha = p.alpha * 0.4;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.stroke();
      }

      if (p.type === 'glow') {
        ctx.globalAlpha = p.alpha * 0.15 * p.brightness;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = p.alpha * 0.3 * p.brightness;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = p.alpha * 0.8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  isComplete(): boolean {
    return false;
  }
}

// 绘制3D立体爱心
function draw3DHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  alpha: number,
  pulse: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const scale = 1 + Math.sin(pulse) * 0.1;
  ctx.scale(scale, scale);

  // 外层光晕
  ctx.globalAlpha = alpha * 0.2;
  const glowGradient = ctx.createRadialGradient(0, 0, size * 0.5, 0, 0, size * 2);
  glowGradient.addColorStop(0, 'rgba(255, 50, 100, 0.8)');
  glowGradient.addColorStop(0.5, 'rgba(255, 100, 150, 0.4)');
  glowGradient.addColorStop(1, 'rgba(255, 150, 200, 0)');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
  ctx.fill();

  // 3D立体效果 - 阴影层
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillStyle = '#8b0000';
  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size, -size * 0.1, -size, size * 0.4);
  ctx.bezierCurveTo(-size, size * 0.9, 0, size * 1.4, 0, size * 1.4);
  ctx.bezierCurveTo(0, size * 1.4, size, size * 0.9, size, size * 0.4);
  ctx.bezierCurveTo(size, -size * 0.1, size * 0.5, -size * 0.3, 0, size * 0.3);
  ctx.fill();

  // 主体爱心
  ctx.globalAlpha = alpha;
  const heartGradient = ctx.createLinearGradient(-size, -size, size, size);
  heartGradient.addColorStop(0, '#ff1744');
  heartGradient.addColorStop(0.3, '#ff4081');
  heartGradient.addColorStop(0.6, '#ff6b9d');
  heartGradient.addColorStop(1, '#ff8a80');
  ctx.fillStyle = heartGradient;

  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size, -size * 0.1, -size, size * 0.4);
  ctx.bezierCurveTo(-size, size * 0.9, 0, size * 1.4, 0, size * 1.4);
  ctx.bezierCurveTo(0, size * 1.4, size, size * 0.9, size, size * 0.4);
  ctx.bezierCurveTo(size, -size * 0.1, size * 0.5, -size * 0.3, 0, size * 0.3);
  ctx.fill();

  // 高光效果
  ctx.globalAlpha = alpha * 0.6;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-size * 0.3, 0, size * 0.15, size * 0.25, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // 边缘发光
  ctx.globalAlpha = alpha * 0.8;
  ctx.strokeStyle = '#ff69b4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size, -size * 0.1, -size, size * 0.4);
  ctx.bezierCurveTo(-size, size * 0.9, 0, size * 1.4, 0, size * 1.4);
  ctx.bezierCurveTo(0, size * 1.4, size, size * 0.9, size, size * 0.4);
  ctx.bezierCurveTo(size, -size * 0.1, size * 0.5, -size * 0.3, 0, size * 0.3);
  ctx.stroke();

  ctx.restore();
}

export class FloatingHeartsEffect implements EffectBase {
  hearts: HeartParticle[] = [];
  originX: number;
  originY: number;
  spawnTimer = 0;
  time = 0;
  maxHearts = 50;

  constructor(x: number, y: number) {
    this.originX = x;
    this.originY = y;
  }

  private createHeart(): HeartParticle {
    const angle = (Math.random() - 0.5) * 0.5;
    const speed = 80 + Math.random() * 120;
    const size = 15 + Math.random() * 25;

    return {
      x: this.originX + (Math.random() - 0.5) * 60,
      y: this.originY + (Math.random() - 0.5) * 30,
      vx: Math.sin(angle) * speed * 0.3,
      vy: -speed,
      size: size,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2,
      alpha: 1,
      life: 2 + Math.random() * 2,
      maxLife: 4,
      color: '#ff1744',
      pulse: Math.random() * Math.PI * 2,
    };
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    this.spawnTimer += deltaTime;

    if (this.spawnTimer > 0.05 && this.hearts.length < this.maxHearts) {
      this.spawnTimer = 0;
      const count = Math.min(2, this.maxHearts - this.hearts.length);
      for (let i = 0; i < count; i++) {
        this.hearts.push(this.createHeart());
      }
    }

    for (const h of this.hearts) {
      h.x += h.vx * deltaTime;
      h.y += h.vy * deltaTime;
      h.x += Math.sin(this.time * 2 + h.pulse) * 20 * deltaTime;
      h.rotation += h.rotationSpeed * deltaTime;
      h.pulse += deltaTime * 3;
      h.life -= deltaTime;
      const lifeRatio = h.life / h.maxLife;
      h.alpha = Math.max(0, lifeRatio * lifeRatio);
    }

    this.hearts = this.hearts.filter((h) => h.life > 0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const h of this.hearts) {
      draw3DHeart(ctx, h.x, h.y, h.size, h.rotation, h.alpha, h.pulse);
    }
    ctx.globalAlpha = 1;
  }

  isComplete(): boolean {
    return false;
  }
}

// 绘制3D立体气球
function draw3DBalloon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number,
  wobble: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 摆动效果
  const wobbleX = Math.sin(wobble) * size * 0.1;
  ctx.translate(wobbleX, 0);

  // 气球绳子
  ctx.globalAlpha = alpha * 0.6;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.quadraticCurveTo(
    Math.sin(wobble * 2) * size * 0.2,
    size * 1.5,
    0,
    size * 2
  );
  ctx.stroke();

  // 气球底部小结
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size * 0.1, size * 0.95);
  ctx.lineTo(size * 0.1, size * 0.95);
  ctx.lineTo(0, size * 1.05);
  ctx.closePath();
  ctx.fill();

  // 气球主体阴影（3D效果）
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(size * 0.1, size * 0.1, size * 0.85, size * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // 气球主体
  ctx.globalAlpha = alpha;
  const balloonGradient = ctx.createRadialGradient(
    -size * 0.3, -size * 0.3, 0,
    0, 0, size
  );
  balloonGradient.addColorStop(0, lightenColor(color, 40));
  balloonGradient.addColorStop(0.3, color);
  balloonGradient.addColorStop(0.8, color);
  balloonGradient.addColorStop(1, darkenColor(color, 20));
  ctx.fillStyle = balloonGradient;

  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.8, size, 0, 0, Math.PI * 2);
  ctx.fill();

  // 高光
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-size * 0.25, -size * 0.4, size * 0.15, size * 0.25, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // 边缘发光
  ctx.globalAlpha = alpha * 0.5;
  ctx.strokeStyle = lightenColor(color, 30);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.8, size, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
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

export class RisingBalloonsEffect implements EffectBase {
  balloons: BalloonParticle[] = [];
  canvasWidth: number;
  canvasHeight: number;
  spawnTimer = 0;
  time = 0;
  maxBalloons = 8;
  colors = ['#ff1744', '#00e676', '#2979ff', '#ffea00', '#e040fb', '#00b0ff', '#ff9100'];
  isActive = false;

  constructor(_x: number, _y: number) {
    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;
  }

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  private createBalloon(): BalloonParticle {
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    // 更大的气球尺寸：60-100像素
    const size = 60 + Math.random() * 40;

    // 从屏幕底部随机位置生成
    return {
      x: Math.random() * this.canvasWidth,
      y: this.canvasHeight + size * 2,
      vx: (Math.random() - 0.5) * 20,
      vy: -(30 + Math.random() * 40), // 缓慢上升
      size: size,
      color: color,
      alpha: 0,
      life: 8 + Math.random() * 4,
      maxLife: 12,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.5 + Math.random() * 1,
      stringLength: size * 2 + Math.random() * size,
    };
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    this.spawnTimer += deltaTime;

    // 缓慢生成气球，一次生成几个
    if (this.spawnTimer > 0.5 && this.balloons.length < this.maxBalloons) {
      this.spawnTimer = 0;
      const count = Math.min(2, this.maxBalloons - this.balloons.length);
      for (let i = 0; i < count; i++) {
        this.balloons.push(this.createBalloon());
      }
    }

    for (const b of this.balloons) {
      // 缓慢上升
      b.x += b.vx * deltaTime;
      b.y += b.vy * deltaTime;
      
      // 左右轻微摇摆
      b.wobble += b.wobbleSpeed * deltaTime;
      b.x += Math.sin(b.wobble) * 10 * deltaTime;

      // 生命周期
      b.life -= deltaTime;
      const lifeRatio = b.life / b.maxLife;
      
      // 淡入淡出效果
      if (lifeRatio > 0.9) {
        // 淡入
        b.alpha = (1 - lifeRatio) * 10;
      } else if (lifeRatio < 0.2) {
        // 淡出
        b.alpha = lifeRatio * 5;
      } else {
        // 正常显示
        b.alpha = 1;
      }
      b.alpha = Math.max(0, Math.min(1, b.alpha));
    }

    this.balloons = this.balloons.filter((b) => b.life > 0 && b.y > -b.size * 3);
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const b of this.balloons) {
      draw3DBalloon(ctx, b.x, b.y, b.size, b.color, b.alpha, b.wobble);
    }
    ctx.globalAlpha = 1;
  }

  isComplete(): boolean {
    return false;
  }
}
