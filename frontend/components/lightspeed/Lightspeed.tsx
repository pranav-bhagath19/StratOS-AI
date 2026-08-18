"use client";

import React, { useEffect, useRef, useState } from "react";

export interface LightspeedProps {
  width?: number | string;
  height?: number | string;
  speed?: number;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  streakCount?: number;
  stretchFactor?: number;
  intensity?: number;

  interactionEnabled?: boolean;
  rotation?: number;
  fadePower?: number;
  opacity?: number;
  quality?: "low" | "medium" | "high";
  maxFPS?: number;
  pauseWhenOffscreen?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface StreakParticle {
  angle: number;
  radius: number;
  speed: number;
  color: string;
  thickness: number;
}

interface StarParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  color: string;
}

export function Lightspeed({
  width = "100%",
  height = "100%",
  speed = 1.0,
  primaryColor = "#489dff",
  secondaryColor = "#d2d2d2",
  tertiaryColor = "#4a48f0",
  streakCount = 350,
  stretchFactor = 0.06,
  intensity = 1.2,
  interactionEnabled = true,
  rotation = 0,
  fadePower = 1.8,
  opacity = 0.95,
  quality = "medium",
  maxFPS = 60,
  pauseWhenOffscreen = true,
  className = "",
  children,
}: LightspeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWarping, setIsWarping] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let isVisible = true;
    let lastFrameTime = performance.now();
    const frameInterval = 1000 / maxFPS;

    // Warp multiplier state for smooth interaction lerp
    let currentWarp = 1.0;
    let targetWarp = 1.0;

    // Quality pixel ratio factor
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const qualityScale =
      quality === "low" ? 0.75 : quality === "high" ? Math.min(dpr, 2) : Math.min(dpr, 1.5);

    let canvasWidth = 0;
    let canvasHeight = 0;
    let centerX = 0;
    let centerY = 0;
    let maxRadius = 0;

    const palette = [primaryColor, secondaryColor, tertiaryColor, "#ffffff"];

    // Generate high-density streak particles
    const particles: StreakParticle[] = Array.from({ length: streakCount }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random(),
      speed: (0.002 + Math.random() * 0.007) * speed,
      color: palette[Math.floor(Math.random() * palette.length)],
      thickness: 0.6 + Math.random() * 2.4,
    }));

    // Generate background star dust particles
    const stars: StarParticle[] = Array.from({ length: 180 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.5 + Math.random() * 1.5,
      alpha: 0.2 + Math.random() * 0.7,
      twinkleSpeed: 0.01 + Math.random() * 0.03,
      color: palette[Math.floor(Math.random() * palette.length)],
    }));

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvasWidth = rect.width;
      canvasHeight = rect.height;

      canvas.width = canvasWidth * qualityScale;
      canvas.height = canvasHeight * qualityScale;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      centerX = (canvasWidth * qualityScale) / 2;
      centerY = (canvasHeight * qualityScale) / 2;
      maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // IntersectionObserver to pause rendering when offscreen
    let observer: IntersectionObserver | null = null;
    if (pauseWhenOffscreen && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.05 }
      );
      observer.observe(container);
    }

    // Interaction mouse/touch listeners
    const handleMouseDown = () => {
      if (interactionEnabled) {
        targetWarp = 4.5;
        setIsWarping(true);
      }
    };

    const handleMouseUp = () => {
      targetWarp = 1.0;
      setIsWarping(false);
    };

    if (interactionEnabled) {
      container.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mouseup", handleMouseUp);
      container.addEventListener("touchstart", handleMouseDown, { passive: true });
      window.addEventListener("touchend", handleMouseUp);
    }

    // Render loop
    const render = (now: number) => {
      animFrameId = requestAnimationFrame(render);

      if (!isVisible) return;

      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval) return;
      lastFrameTime = now - (elapsed % frameInterval);

      // Smooth lerp for warp multiplier
      currentWarp += (targetWarp - currentWarp) * 0.12;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Apply rotation if specified
      if (rotation !== 0) {
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.translate(-centerX, -centerY);
      }

      ctx.globalCompositeOperation = "lighter";

      // Render Star Dust Background Particles
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.alpha += Math.sin(now * star.twinkleSpeed) * 0.005;
        const currentAlpha = Math.max(0.1, Math.min(0.9, star.alpha)) * opacity;

        const sx = star.x * canvasWidth * qualityScale;
        const sy = star.y * canvasHeight * qualityScale;

        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * qualityScale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Hyperspace Light Streaks
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update radius position
        p.radius += p.speed * currentWarp;
        if (p.radius > 1.0) {
          p.radius = Math.random() * 0.04;
          p.angle = Math.random() * Math.PI * 2;
          p.color = palette[Math.floor(Math.random() * palette.length)];
        }

        const startR = p.radius * maxRadius;
        const streakLen = startR * stretchFactor * (1 + (currentWarp - 1) * 1.6) * qualityScale;
        const endR = Math.min(startR + streakLen, maxRadius * 1.25);

        const cos = Math.cos(p.angle);
        const sin = Math.sin(p.angle);

        const x1 = centerX + cos * startR;
        const y1 = centerY + sin * startR;
        const x2 = centerX + cos * endR;
        const y2 = centerY + sin * endR;

        const distanceRatio = Math.min(p.radius, 1.0);
        const alpha = Math.pow(distanceRatio, fadePower) * opacity * Math.min(intensity, 2.5);

        if (alpha <= 0.005) continue;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = Math.min(alpha, 1.0);
        ctx.lineWidth = p.thickness * qualityScale * (1 + (currentWarp - 1) * 0.25);
        ctx.lineCap = "round";
        ctx.stroke();
      }

      ctx.restore();
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", resizeCanvas);
      if (observer) observer.disconnect();
      if (interactionEnabled) {
        container.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);
        container.removeEventListener("touchstart", handleMouseDown);
        window.removeEventListener("touchend", handleMouseUp);
      }
    };
  }, [
    speed,
    primaryColor,
    secondaryColor,
    tertiaryColor,
    streakCount,
    stretchFactor,
    intensity,
    interactionEnabled,
    rotation,
    fadePower,
    opacity,
    quality,
    maxFPS,
    pauseWhenOffscreen,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none block"
      />
      {/* Dynamic Warp State Indicator Cue */}
      {isWarping && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none font-sans text-[10px] font-bold text-white bg-blue-600/50 border border-blue-400/60 px-3.5 py-1 rounded-full uppercase tracking-widest backdrop-blur-md animate-pulse shadow-lg">
          WARP SPEED BURST ACTIVE
        </div>
      )}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

export default Lightspeed;
