import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

type FallingPatternProps = React.ComponentProps<'div'> & {
  color?: string;
  speed?: number;
  dotSize?: number;
  gap?: number;
};

/**
 * Dot-matrix with isobar/contour wave patterns.
 * Uses sine interference to create topographic contour bands that drift organically.
 * Renders via putImageData (atomic, single-op blit) — zero flicker.
 */
export function FallingPattern({
  color = '#10b981',
  speed = 1,
  dotSize = 1.5,
  gap = 6,
  className,
}: FallingPatternProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const hex = color.replace('#', '');
    const cr = parseInt(hex.substring(0, 2), 16);
    const cg = parseInt(hex.substring(2, 4), 16);
    const cb = parseInt(hex.substring(4, 6), 16);

    let w = 0, h = 0, cols = 0, rows = 0;
    let imgData: ImageData;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      cols = Math.ceil(w / gap);
      rows = Math.ceil(h / gap);
      imgData = ctx.createImageData(canvas.width, canvas.height);
    };

    // Set a pixel block (dot) in ImageData
    const setDot = (cx: number, cy: number, alpha: number) => {
      const a = (alpha * 255) | 0;
      const sx = (cx * dpr) | 0;
      const sy = (cy * dpr) | 0;
      const ds = Math.max(1, (dotSize * dpr) | 0);
      const stride = canvas.width * 4;
      const data = imgData.data;

      for (let dy = 0; dy < ds; dy++) {
        const rowOff = (sy + dy) * stride;
        for (let dx = 0; dx < ds; dx++) {
          const i = rowOff + (sx + dx) * 4;
          data[i] = cr;
          data[i + 1] = cg;
          data[i + 2] = cb;
          data[i + 3] = a;
        }
      }
    };

    const draw = (ts: number) => {
      const t = ts * 0.001 * speed;

      // Clear imageData (fill with transparent)
      imgData.data.fill(0);

      for (let row = 0; row < rows; row++) {
        const py = row * gap;
        for (let col = 0; col < cols; col++) {
          const px = col * gap;

          // Create a smooth scalar field from overlapping waves
          // at different scales, angles, and speeds
          const f1 = Math.sin(px * 0.006 + py * 0.004 + t * 0.5)
                    + Math.sin(px * 0.004 - py * 0.006 + t * 0.3);

          const f2 = Math.sin(px * 0.009 + py * 0.007 - t * 0.4 + 1.5)
                    + Math.sin(-px * 0.005 + py * 0.008 + t * 0.35 + 3.0);

          const f3 = Math.sin(px * 0.003 + py * 0.01 + t * 0.25 + 5.0)
                    + Math.sin(px * 0.007 - py * 0.003 - t * 0.45 + 2.0);

          // Combine into a single field value (-6 to +6 range)
          const field = f1 + f2 * 0.7 + f3 * 0.5;

          // Create contour bands using sin of the field value
          // This produces repeating bands like isobars/topographic lines
          const contour = Math.sin(field * 2.5);

          // Map to alpha: contour peaks = bright, valleys = dim
          // Shift range from [-1,1] to alpha range
          const alpha = 0.08 + (contour * 0.5 + 0.5) * 0.30;

          setDot(px, py, alpha);
        }
      }

      // Atomic blit — putImageData is a single operation, no intermediate state
      ctx.putImageData(imgData, 0, 0);
      animRef.current = requestAnimationFrame(draw);
    };

    resize();
    animRef.current = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(animRef.current);
      resize();
      animRef.current = requestAnimationFrame(draw);
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [color, speed, dotSize, gap]);

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
