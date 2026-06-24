import React, { useEffect, useRef } from "react";

interface ConfettiProps {
  trigger: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  gravity: number;
  wind: number;
}

const CONFETTI_COLORS = [
  "#FF4D00", // Brutalist Orange
  "#FFA500", // Gold/Amber
  "#FFFFFF", // Pure White
  "#FF3B30", // Accent Red
  "#38BDF8"  // Cyber Blue accent
];

export default function Confetti({ trigger }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTriggerRef = useRef(trigger);

  useEffect(() => {
    if (trigger === 0 || trigger === lastTriggerRef.current) return;
    lastTriggerRef.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const particles: Particle[] = [];
    const particleCount = 140;

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = canvas.height + 20;
      const size = Math.random() * 8 + 6;
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      
      const speedY = -(Math.random() * 12 + 8);
      const speedX = Math.random() * 6 - 3;
      const rotation = Math.random() * 360;
      const rotationSpeed = Math.random() * 4 - 2;
      const opacity = 1;
      const gravity = Math.random() * 0.2 + 0.25;
      const wind = Math.random() * 0.05 - 0.025;

      particles.push({
        x,
        y,
        size,
        color,
        speedX,
        speedY,
        rotation,
        rotationSpeed,
        opacity,
        gravity,
        wind
      });
    }

    particlesRef.current = particles;

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const activeParticles = particlesRef.current;

      if (activeParticles.length === 0) {
        return;
      }

      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];

        // Update physics
        p.speedY += p.gravity;
        p.speedX += p.wind;
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Guaranteed base decay + fade out when going off-screen (bottom, left, right)
        p.opacity -= 0.004; // complete fade out within ~250 frames (~4 seconds)
        if (p.y > canvas.height || p.x < -40 || p.x > canvas.width + 40) {
          p.opacity -= 0.02; // accelerated fade off-screen
        }

        if (p.opacity <= 0) {
          activeParticles.splice(i, 1);
          continue;
        }

        // Render particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        // Draw a satisfying rectangular confetti piece
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
