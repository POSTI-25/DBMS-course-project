"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  delta: number; // twinkle speed
  speed: number;
}

interface Meteor {
  x: number;
  y: number;
  len: number;
  angle: number;
  speed: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export default function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0, H = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let lastMeteor = 0;

    function resize() {
      W = canvas!.width  = window.innerWidth;
      H = canvas!.height = window.innerHeight;
      buildStars();
    }

    function buildStars() {
      const count = Math.floor((W * H) / 5000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.2,
        alpha: Math.random() * 0.5 + 0.3,
        delta: (Math.random() * 0.006 + 0.002) * (Math.random() < 0.5 ? 1 : -1),
        speed: 0,
      }));
    }

    function spawnMeteor() {
      const x = Math.random() * W * 1.2;
      const y = Math.random() * H * 0.4;
      meteors.push({
        x, y,
        len: Math.random() * 180 + 80,
        angle: (Math.PI / 180) * (Math.random() * 20 + 25),
        speed: Math.random() * 8 + 6,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 60 + 50,
      });
    }

    function draw(ts: number) {
      ctx!.clearRect(0, 0, W, H);

      // Stars
      for (const s of stars) {
        s.alpha += s.delta;
        if (s.alpha <= 0.1 || s.alpha >= 0.9) s.delta = -s.delta;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(200,220,255,${s.alpha})`;
        ctx!.fill();
      }

      // Spawn meteor every ~6s
      if (ts - lastMeteor > 6000 + Math.random() * 4000) {
        spawnMeteor();
        lastMeteor = ts;
      }

      // Draw meteors
      meteors = meteors.filter((m) => m.life < m.maxLife);
      for (const m of meteors) {
        m.life++;
        const progress = m.life / m.maxLife;
        m.alpha = progress < 0.2
          ? progress / 0.2
          : progress > 0.7
          ? 1 - (progress - 0.7) / 0.3
          : 1;
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;

        const tailX = m.x - Math.cos(m.angle) * m.len;
        const tailY = m.y - Math.sin(m.angle) * m.len;
        const grad = ctx!.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, `rgba(34,211,238,0)`);
        grad.addColorStop(0.6, `rgba(180,220,255,${m.alpha * 0.6})`);
        grad.addColorStop(1, `rgba(255,255,255,${m.alpha})`);
        ctx!.beginPath();
        ctx!.moveTo(tailX, tailY);
        ctx!.lineTo(m.x, m.y);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();

        // Head glow
        const hGrad = ctx!.createRadialGradient(m.x, m.y, 0, m.x, m.y, 4);
        hGrad.addColorStop(0, `rgba(255,255,255,${m.alpha})`);
        hGrad.addColorStop(1, `rgba(34,211,238,0)`);
        ctx!.beginPath();
        ctx!.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx!.fillStyle = hGrad;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
