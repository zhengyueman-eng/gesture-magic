import type { EffectBase } from '@/types';
import { EFFECT_COLORS } from '@/utils/constants';

export class LaserBeamEffect implements EffectBase {
  beams: { startX: number; startY: number; angle: number; length: number; alpha: number; width: number }[] = [];
  originX: number;
  originY: number;
  colors: string[];
  time = 0;

  constructor(x: number, y: number) {
    this.originX = x;
    this.originY = y;
    this.colors = EFFECT_COLORS.laser_beam;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    this.beams = [
      {
        startX: this.originX - 30,
        startY: this.originY,
        angle: -Math.PI / 6 + Math.sin(this.time * 2) * 0.1,
        length: 400 + Math.sin(this.time * 3) * 100,
        alpha: 0.8 + Math.sin(this.time * 5) * 0.2,
        width: 3 + Math.sin(this.time * 4) * 1,
      },
      {
        startX: this.originX + 30,
        startY: this.originY,
        angle: Math.PI / 6 + Math.sin(this.time * 2.5) * 0.1,
        length: 400 + Math.sin(this.time * 3.5) * 100,
        alpha: 0.8 + Math.sin(this.time * 5.5) * 0.2,
        width: 3 + Math.sin(this.time * 4.5) * 1,
      },
    ];
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const beam of this.beams) {
      const endX = beam.startX + Math.cos(beam.angle) * beam.length;
      const endY = beam.startY + Math.sin(beam.angle) * beam.length;

      ctx.globalAlpha = beam.alpha * 0.3;
      ctx.strokeStyle = this.colors[0];
      ctx.lineWidth = beam.width * 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(beam.startX, beam.startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.globalAlpha = beam.alpha * 0.6;
      ctx.strokeStyle = this.colors[1];
      ctx.lineWidth = beam.width * 2;
      ctx.beginPath();
      ctx.moveTo(beam.startX, beam.startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.globalAlpha = beam.alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = beam.width;
      ctx.beginPath();
      ctx.moveTo(beam.startX, beam.startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.globalAlpha = beam.alpha * 0.5;
      ctx.fillStyle = this.colors[0];
      ctx.beginPath();
      ctx.arc(beam.startX, beam.startY, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  isComplete(): boolean {
    return false;
  }
}

export class ScreenShakeEffect implements EffectBase {
  shakeIntensity = 10;
  cracks: { x: number; y: number; angle: number; length: number; alpha: number }[] = [];
  colors: string[];
  time = 0;

  constructor(_x: number, _y: number) {
    this.colors = EFFECT_COLORS.screen_shake;
    for (let i = 0; i < 8; i++) {
      this.cracks.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        angle: Math.random() * Math.PI * 2,
        length: 50 + Math.random() * 150,
        alpha: 0.6 + Math.random() * 0.4,
      });
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    this.shakeIntensity = Math.max(0, this.shakeIntensity - deltaTime * 5);

    for (const crack of this.cracks) {
      crack.alpha -= deltaTime * 0.3;
    }
    this.cracks = this.cracks.filter((c) => c.alpha > 0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
    const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    for (const crack of this.cracks) {
      ctx.globalAlpha = Math.max(0, crack.alpha);
      ctx.strokeStyle = this.colors[0];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(crack.x, crack.y);

      let cx = crack.x;
      let cy = crack.y;
      const segments = 5;
      for (let i = 0; i < segments; i++) {
        const segLength = crack.length / segments;
        const deviation = (Math.random() - 0.5) * 20;
        cx += Math.cos(crack.angle) * segLength + deviation;
        cy += Math.sin(crack.angle) * segLength + deviation;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 0.1;
    ctx.fillStyle = this.colors[1];
    ctx.fillRect(-50, -50, ctx.canvas.width + 100, ctx.canvas.height + 100);

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  isComplete(): boolean {
    return this.shakeIntensity <= 0 && this.cracks.length === 0;
  }
}
