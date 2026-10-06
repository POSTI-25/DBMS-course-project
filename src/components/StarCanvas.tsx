"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; radius: number; phase: number; speed: number; depth: number };
type Meteor = { x: number; y: number; angle: number; length: number; born: number; duration: number; speed: number };
type Sparkle = { x: number; y: number; phase: number; speed: number; size: number };
type Comet = { x: number; y: number; angle: number; born: number; duration: number; speed: number; length: number };

export default function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, frame = 0, lastFrame = 0;
    let stars: Star[] = [], sparkles: Sparkle[] = [], meteors: Meteor[] = [], comets: Comet[] = [];
    let nextMeteor = performance.now() + 1100;
    let nextComet = performance.now() + 3500;
    let nextFlare = performance.now() + 5000;
    let flare = { x: 0, y: 0, born: -10000 };

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(520, Math.max(150, Math.round(width * height / 3400)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        radius: .3 + Math.random() * 1.3, phase: Math.random() * Math.PI * 2,
        speed: .35 + Math.random() * 1.2, depth: .25 + Math.random() * .75,
      }));
      sparkles = Array.from({ length: Math.min(65, Math.max(22, Math.round(count / 8))) }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        phase: Math.random() * Math.PI * 2, speed: .65 + Math.random() * 1.4,
        size: 3 + Math.random() * 7,
      }));
    }

    function draw(time: number) {
      if (time - lastFrame < 30) { frame = requestAnimationFrame(draw); return; }
      lastFrame = time;
      ctx!.clearRect(0, 0, width, height);
      const seconds = time / 1000;
      const still = reducedMotion.matches;
      for (const star of stars) {
        const alpha = still ? .65 : .42 + .36 * Math.sin(seconds * star.speed + star.phase);
        const x = star.x + (still ? 0 : Math.sin(seconds * .06 + star.phase) * 8 * star.depth);
        const y = star.y + (still ? 0 : Math.cos(seconds * .04 + star.phase) * 6 * star.depth);
        ctx!.fillStyle = `rgba(215,231,255,${Math.max(.12, alpha * star.depth)})`;
        ctx!.beginPath(); ctx!.arc(x, y, star.radius, 0, Math.PI * 2); ctx!.fill();
      }
      for (const sparkle of sparkles) {
        const pulse = still ? .35 : Math.pow(Math.max(0, Math.sin(seconds * sparkle.speed + sparkle.phase)), 7);
        if (pulse < .08) continue;
        const glow = ctx!.createRadialGradient(sparkle.x, sparkle.y, 0, sparkle.x, sparkle.y, sparkle.size * 2.5);
        glow.addColorStop(0, `rgba(243,250,255,${pulse * .75})`);
        glow.addColorStop(.25, `rgba(161,207,255,${pulse * .25})`);
        glow.addColorStop(1, "rgba(161,207,255,0)");
        ctx!.fillStyle = glow;
        ctx!.beginPath(); ctx!.arc(sparkle.x, sparkle.y, sparkle.size * 2.5, 0, Math.PI * 2); ctx!.fill();
        ctx!.strokeStyle = `rgba(225,242,255,${pulse * .5})`;
        ctx!.lineWidth = .6;
        ctx!.beginPath(); ctx!.moveTo(sparkle.x - sparkle.size, sparkle.y); ctx!.lineTo(sparkle.x + sparkle.size, sparkle.y);
        ctx!.moveTo(sparkle.x, sparkle.y - sparkle.size); ctx!.lineTo(sparkle.x, sparkle.y + sparkle.size); ctx!.stroke();
      }
      if (!still) {
        if (time > nextMeteor) {
          const leftToRight = Math.random() < .5;
          meteors.push({ x: Math.random() * width, y: Math.random() * height * .8,
            angle: leftToRight ? .3 + Math.random() * .5 : Math.PI + .3 + Math.random() * .5,
            length: 85 + Math.random() * 160, born: time,
            duration: 700 + Math.random() * 650, speed: 350 + Math.random() * 370 });
          nextMeteor = time + 1200 + Math.random() * 3200;
        }
        meteors = meteors.filter(m => time - m.born < m.duration);
        for (const m of meteors) {
          const progress = (time - m.born) / m.duration;
          const alpha = Math.sin(progress * Math.PI) * .8;
          const distance = m.speed * (time - m.born) / 1000;
          const x = m.x + Math.cos(m.angle) * distance;
          const y = m.y + Math.sin(m.angle) * distance;
          const gradient = ctx!.createLinearGradient(x - Math.cos(m.angle) * m.length, y - Math.sin(m.angle) * m.length, x, y);
          gradient.addColorStop(0, "rgba(135,185,255,0)");
          gradient.addColorStop(1, `rgba(235,245,255,${alpha})`);
          ctx!.strokeStyle = gradient; ctx!.lineWidth = 1.3;
          ctx!.beginPath(); ctx!.moveTo(x - Math.cos(m.angle) * m.length, y - Math.sin(m.angle) * m.length);
          ctx!.lineTo(x, y); ctx!.stroke();
          const glow = ctx!.createRadialGradient(x, y, 0, x, y, 28);
          glow.addColorStop(0, `rgba(210,230,255,${alpha * .3})`);
          glow.addColorStop(1, "rgba(210,230,255,0)");
          ctx!.fillStyle = glow; ctx!.beginPath(); ctx!.arc(x, y, 28, 0, Math.PI * 2); ctx!.fill();
        }
        if (time > nextComet) {
          const fromLeft = Math.random() < .5;
          comets.push({ x: fromLeft ? -120 : width + 120, y: Math.random() * height * .75,
            angle: fromLeft ? .12 + Math.random() * .45 : Math.PI - .12 - Math.random() * .45,
            born: time, duration: 2400 + Math.random() * 1800,
            speed: 230 + Math.random() * 190, length: 170 + Math.random() * 150 });
          nextComet = time + 5200 + Math.random() * 6500;
        }
        comets = comets.filter(comet => time - comet.born < comet.duration);
        for (const comet of comets) {
          const progress = (time - comet.born) / comet.duration;
          const alpha = Math.sin(progress * Math.PI) * .78;
          const distance = comet.speed * (time - comet.born) / 1000;
          const x = comet.x + Math.cos(comet.angle) * distance;
          const y = comet.y + Math.sin(comet.angle) * distance;
          const tailX = x - Math.cos(comet.angle) * comet.length;
          const tailY = y - Math.sin(comet.angle) * comet.length;
          const tail = ctx!.createLinearGradient(tailX, tailY, x, y);
          tail.addColorStop(0, "rgba(86,146,211,0)");
          tail.addColorStop(.55, `rgba(108,183,241,${alpha * .2})`);
          tail.addColorStop(1, `rgba(221,244,255,${alpha})`);
          ctx!.strokeStyle = tail; ctx!.lineWidth = 3.2;
          ctx!.beginPath(); ctx!.moveTo(tailX, tailY); ctx!.lineTo(x, y); ctx!.stroke();
          const head = ctx!.createRadialGradient(x, y, 0, x, y, 24);
          head.addColorStop(0, `rgba(245,252,255,${alpha})`);
          head.addColorStop(.18, `rgba(147,211,255,${alpha * .5})`);
          head.addColorStop(1, "rgba(147,211,255,0)");
          ctx!.fillStyle = head; ctx!.beginPath(); ctx!.arc(x, y, 24, 0, Math.PI * 2); ctx!.fill();
        }
        if (time > nextFlare) {
          const star = stars[Math.floor(Math.random() * stars.length)];
          flare = { x: star.x, y: star.y, born: time };
          nextFlare = time + 7000 + Math.random() * 12000;
        }
        const age = time - flare.born;
        if (age < 1600) {
          const alpha = Math.sin(age / 1600 * Math.PI) * .42;
          ctx!.strokeStyle = `rgba(235,245,255,${alpha})`; ctx!.lineWidth = .8;
          ctx!.beginPath(); ctx!.moveTo(flare.x - 24, flare.y); ctx!.lineTo(flare.x + 24, flare.y);
          ctx!.moveTo(flare.x, flare.y - 24); ctx!.lineTo(flare.x, flare.y + 24); ctx!.stroke();
        }
      }
      if (document.visibilityState === "visible" && !still) frame = requestAnimationFrame(draw);
    }

    function onVisibility() {
      cancelAnimationFrame(frame);
      if (document.visibilityState === "visible") frame = requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <div className="space-scene" aria-hidden="true">
    <div className="space-nebula" />
    <div className="black-hole"><div className="black-hole-halo" /><div className="black-hole-ring" /><div className="black-hole-core" /></div>
    <div className="space-planet space-planet-one" /><div className="space-planet space-planet-two" />
    <div className="space-moon space-moon-one" /><div className="space-moon space-moon-two" />
    <div className="space-satellite space-satellite-one" /><div className="space-satellite space-satellite-two" />
    <div className="space-asteroid space-asteroid-one" /><div className="space-asteroid space-asteroid-two" />
    <canvas ref={canvasRef} className="space-stars" /><div className="space-vignette" />
  </div>;
}
