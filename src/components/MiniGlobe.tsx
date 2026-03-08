import { useEffect, useRef } from 'react';

interface Props {
  center: { lat: number; lng: number };
}

export default function MiniGlobe({ center }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const r = size / 2 - 4;
    const cx = size / 2;
    const cy = size / 2;

    // Convert lat/lng to rotation
    const lonRad = (center.lng * Math.PI) / 180;
    const latRad = (center.lat * Math.PI) / 180;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Globe background
      const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
      grad.addColorStop(0, 'hsla(216, 20%, 16%, 1)');
      grad.addColorStop(1, 'hsla(216, 30%, 8%, 1)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Globe border
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'hsla(216, 14%, 24%, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw simplified continent outlines (Africa focus)
      ctx.strokeStyle = 'hsla(142, 71%, 45%, 0.3)';
      ctx.lineWidth = 0.8;

      // Simplified Africa outline points [lat, lng]
      const africaPoints: [number, number][] = [
        [37, -10], [37, 10], [32, 32], [30, 32], [22, 36],
        [12, 44], [2, 42], [-12, 44], [-26, 33], [-35, 18],
        [-34, 26], [-28, 30], [-15, 40], [-10, 34], [0, 10],
        [5, 1], [4, -8], [10, -16], [15, -17], [20, -17],
        [28, -13], [35, -5], [37, -10],
      ];

      // Nigeria highlight
      const nigeriaPoints: [number, number][] = [
        [4, 3], [6, 3], [7, 4], [10, 4], [12, 4],
        [13, 6], [13, 10], [13, 14], [10, 12],
        [7, 10], [6, 8], [4, 6], [4, 3],
      ];

      const project = (lat: number, lng: number): [number, number, boolean] => {
        const phi = (lat * Math.PI) / 180;
        const lambda = (lng * Math.PI) / 180;

        // Rotate based on center
        const x3d = Math.cos(phi) * Math.sin(lambda - lonRad);
        const y3d = Math.cos(latRad) * Math.sin(phi) - Math.sin(latRad) * Math.cos(phi) * Math.cos(lambda - lonRad);
        const z3d = Math.sin(latRad) * Math.sin(phi) + Math.cos(latRad) * Math.cos(phi) * Math.cos(lambda - lonRad);

        if (z3d < 0) return [0, 0, false]; // behind globe

        return [cx + x3d * r, cy - y3d * r, true];
      };

      // Draw graticule
      ctx.strokeStyle = 'hsla(216, 14%, 24%, 0.25)';
      ctx.lineWidth = 0.4;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lng = -180; lng <= 180; lng += 5) {
          const [px, py, visible] = project(lat, lng);
          if (visible) {
            if (!started) { ctx.moveTo(px, py); started = true; }
            else ctx.lineTo(px, py);
          } else { started = false; }
        }
        ctx.stroke();
      }
      for (let lng = -180; lng <= 150; lng += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 5) {
          const [px, py, visible] = project(lat, lng);
          if (visible) {
            if (!started) { ctx.moveTo(px, py); started = true; }
            else ctx.lineTo(px, py);
          } else { started = false; }
        }
        ctx.stroke();
      }

      // Draw Africa
      const drawOutline = (points: [number, number][], color: string, width: number, fill?: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        let started = false;
        const fillPts: [number, number][] = [];
        for (const [lat, lng] of points) {
          const [px, py, visible] = project(lat, lng);
          if (visible) {
            fillPts.push([px, py]);
            if (!started) { ctx.moveTo(px, py); started = true; }
            else ctx.lineTo(px, py);
          } else { started = false; }
        }
        ctx.stroke();
        if (fill && fillPts.length > 2) {
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.moveTo(fillPts[0][0], fillPts[0][1]);
          fillPts.forEach(([px, py]) => ctx.lineTo(px, py));
          ctx.closePath();
          ctx.fill();
        }
      };

      drawOutline(africaPoints, 'hsla(142, 71%, 45%, 0.35)', 0.8, 'hsla(142, 71%, 45%, 0.06)');
      drawOutline(nigeriaPoints, 'hsla(142, 71%, 55%, 0.8)', 1.2, 'hsla(142, 71%, 45%, 0.2)');

      // Draw center dot (current position)
      const [dotX, dotY, dotVisible] = project(center.lat, center.lng);
      if (dotVisible) {
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(142, 71%, 45%)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'hsla(142, 71%, 45%, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Atmospheric glow
      const atmoGrad = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.1);
      atmoGrad.addColorStop(0, 'hsla(142, 71%, 45%, 0.05)');
      atmoGrad.addColorStop(1, 'hsla(142, 71%, 45%, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = atmoGrad;
      ctx.fill();
    };

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [center.lat, center.lng]);

  return (
    <div className="glass-panel rounded-lg p-1.5 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={150}
        height={150}
        className="rounded-full"
      />
      <div className="absolute bottom-0.5 left-0 right-0 text-center">
        <span className="text-[7px] text-muted-foreground tracking-wider">
          {center.lat.toFixed(1)}°N {center.lng.toFixed(1)}°E
        </span>
      </div>
    </div>
  );
}
