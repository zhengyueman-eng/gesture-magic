import type { EffectBase } from '@/types';
import { EFFECT_COLORS, PARTICLE_LIMITS } from '@/utils/constants';

export class ShockwaveEffect implements EffectBase {
  rings: { radius: number; alpha: number; width: number }[] = [];
  centerX: number;
  centerY: number;
  colors: string[];
  spawnTimer = 0;

  constructor(x: number, y: number) {
    this.centerX = x;
    this.centerY = y;
    this.colors = EFFECT_COLORS.shockwave;
  }

  update(deltaTime: number): void {
    this.spawnTimer += deltaTime;

    if (this.spawnTimer > 0.3) {
      this.spawnTimer = 0;
      this.rings.push({ radius: 10, alpha: 1, width: 8 });
    }

    for (const ring of this.rings) {
      ring.radius += 300 * deltaTime;
      ring.alpha -= deltaTime * 0.8;
      ring.width = Math.max(1, ring.width - deltaTime * 3);
    }

    this.rings = this.rings.filter((r) => r.alpha > 0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const ring of this.rings) {
      ctx.globalAlpha = Math.max(0, ring.alpha);
      ctx.strokeStyle = this.colors[0];
      ctx.lineWidth = ring.width;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, ring.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = this.colors[1];
      ctx.lineWidth = ring.width * 0.5;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, ring.radius * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  isComplete(): boolean {
    return false;
  }
}

export class WaveDiffusionEffect implements EffectBase {
  waves: { x: number; y: number; width: number; alpha: number; offset: number }[] = [];
  originX: number;
  originY: number;
  colors: string[];
  time = 0;

  constructor(x: number, y: number) {
    this.originX = x;
    this.originY = y;
    this.colors = EFFECT_COLORS.wave_diffusion;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    if (this.waves.length < 10 && Math.random() < 0.1) {
      this.waves.push({
        x: this.originX,
        y: this.originY,
        width: 20 + Math.random() * 40,
        alpha: 1,
        offset: Math.random() * Math.PI * 2,
      });
    }

    for (const wave of this.waves) {
      wave.x += (wave.x < this.originX ? -1 : 1) * 150 * deltaTime;
      wave.alpha -= deltaTime * 0.5;
    }

    this.waves = this.waves.filter((w) => w.alpha > 0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const wave of this.waves) {
      ctx.globalAlpha = Math.max(0, wave.alpha);
      ctx.strokeStyle = this.colors[Math.floor(Math.random() * this.colors.length)];
      ctx.lineWidth = 3;
      ctx.beginPath();

      const startX = wave.x - wave.width;
      const endX = wave.x + wave.width;
      for (let px = startX; px <= endX; px += 5) {
        const py = wave.y + Math.sin((px / 30) + this.time * 5 + wave.offset) * 20;
        if (px === startX) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  isComplete(): boolean {
    return false;
  }
}
