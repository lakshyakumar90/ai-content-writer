import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function ParticleSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const particles: { x: number; y: number; z: number; size: number; speed: number; color: string }[] = [];
    const count = 600;
    const radius = Math.min(w, h) * 0.28;

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.8 + Math.random() * 0.2);
      const isPink = Math.random() < 0.08;
      particles.push({
        x: Math.sin(phi) * Math.cos(theta) * r,
        y: Math.sin(phi) * Math.sin(theta) * r,
        z: Math.cos(phi) * r,
        size: 1 + Math.random() * 2,
        speed: 0.002 + Math.random() * 0.004,
        color: isPink ? 'rgba(253, 233, 255,' : 'rgba(0, 200, 190,',
      });
    }

    let angle = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      angle += 0.004;

      const sorted = particles.map(p => {
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const rx = p.x * cosA - p.z * sinA;
        const rz = p.x * sinA + p.z * cosA;
        const scale = 400 / (400 + rz);
        return { ...p, rx, rz, scale };
      }).sort((a, b) => a.rz - b.rz);

      for (const p of sorted) {
        const sx = w / 2 + p.rx * p.scale;
        const sy = h / 2 + p.y * p.scale;
        const alpha = Math.max(0.15, p.scale * 0.8);
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = p.color + alpha + ')';
        ctx.fill();
      }

      requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ maskImage: 'radial-gradient(ellipse at center, transparent 30%, black 70%)', WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 30%, black 70%)' }}
    />
  );
}

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#012624]">
      <ParticleSphere />

      <div className="relative z-10 max-w-page mx-auto px-5 sm:px-6 lg:px-8 w-full flex flex-col items-center text-center pt-24 sm:pt-28 pb-24 sm:pb-32">
        {/* Section label */}
        <span
          className="font-matter font-medium text-xs uppercase text-silver-mist mb-6 sm:mb-8"
          style={{ letterSpacing: '0.12em' }}
        >
          AI Content Studio
        </span>

        {/* Hero Headline */}
        <h1
          className="font-matter font-medium text-platinum leading-none max-w-5xl"
          style={{
            fontSize: 'clamp(2rem, 6vw, 5.5rem)',
            letterSpacing: '-0.04em',
          }}
        >
          Write. Create.{' '}
          <span className="text-gradient-aurora">Generate.</span>
        </h1>

        {/* Subtext */}
        <p
          className="font-matter font-regular text-silver-mist mt-5 max-w-xl px-4"
          style={{ fontSize: 'clamp(0.95rem, 2vw, 1.2rem)', lineHeight: '1.5' }}
        >
          An abyssal content studio — AI writing, image generation, and resume analysis in a single instrument-panel interface.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate("/signup")}
          className="font-arial text-sm uppercase text-[#222222] gradient-aurora px-8 py-3 rounded-[6px] font-regular mt-8 sm:mt-10 transition-opacity hover:opacity-90"
          style={{ letterSpacing: '0.08em' }}
        >
          Enter the Abyss
        </button>
      </div>
    </section>
  );
}
