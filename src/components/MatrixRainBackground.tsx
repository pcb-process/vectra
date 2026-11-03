"use client";

import React, { useEffect, useRef } from "react";

export function MatrixRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const chars = "฿0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ$+-*/=%";
    const fontSize = 15;
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () =>
        Math.floor(Math.random() * -50)
      );
    };

    resize();
    window.addEventListener("resize", resize);

    let lastTime = 0;
    const fpsInterval = 50; // ~20fps for classic Matrix cadence

    const draw = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(draw);
      if (timestamp - lastTime < fpsInterval) return;
      lastTime = timestamp;

      ctx.fillStyle = "rgba(1, 8, 2, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Bright head character + glowing trail
        if (Math.random() > 0.85) {
          ctx.fillStyle = "#b9ffce";
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#00ff41";
        } else {
          ctx.fillStyle = "rgba(0, 255, 65, 0.32)";
          ctx.shadowBlur = 6;
          ctx.shadowColor = "#00ff41";
        }

        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-35"
      aria-hidden="true"
    />
  );
}
