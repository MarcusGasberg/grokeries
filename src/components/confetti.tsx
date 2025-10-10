import { useEffect, useRef } from "react";

interface ConfettiPiece {
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  velocityX: number;
  velocityY: number;
  size: number;
  color: string;
  shape: "square" | "circle" | "triangle";
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

const COLORS = [
  "#10b981", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // purple
  "#ef4444", // red
  "#14b8a6", // teal
  "#f97316", // orange
];

const SHAPES: Array<"square" | "circle" | "triangle"> = [
  "square",
  "square",
  "circle",
  "triangle",
];

export function Confetti({ active, onComplete }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const piecesRef = useRef<ConfettiPiece[]>([]);
  const startTimeRef = useRef<number>(0);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      piecesRef.current = [];
      hasInitializedRef.current = false;
      return;
    }

    // Only initialize once when active becomes true
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const rect = { width: window.innerWidth, height: window.innerHeight };

    // Initialize confetti pieces
    const newPieces: ConfettiPiece[] = [];
    const pieceCount = 150;

    for (let i = 0; i < pieceCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 5 + Math.random() * 10;

      newPieces.push({
        x: rect.width / 2,
        y: rect.height / 2,
        rotation: Math.random() * 360,
        rotationSpeed: -10 + Math.random() * 20,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity - 8, // Bias upward
        size: 10 + Math.random() * 15,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      });
    }

    piecesRef.current = newPieces;
    startTimeRef.current = Date.now();

    const duration = 20_000;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed > duration) {
        // Animation complete
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (onComplete) onComplete();
        return;
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Batch context state changes
      ctx.lineWidth = 2;

      // Update and draw all pieces
      const pieces = piecesRef.current;
      for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];

        // Update physics
        piece.velocityY += 0.5; // gravity
        piece.x += piece.velocityX;
        piece.y += piece.velocityY;
        piece.rotation += piece.rotationSpeed;

        // Skip pieces that are off-screen
        if (piece.y > rect.height + 50 || piece.x < -50 || piece.x > rect.width + 50) {
          continue;
        }

        // Draw piece
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);

        // Set colors once per piece
        ctx.fillStyle = piece.color;
        ctx.strokeStyle = "rgba(0,0,0,0.4)";

        const halfSize = piece.size / 2;

        if (piece.shape === "square") {
          ctx.fillRect(-halfSize, -halfSize, piece.size, piece.size);
          ctx.strokeRect(-halfSize, -halfSize, piece.size, piece.size);
        } else if (piece.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          // triangle
          ctx.beginPath();
          ctx.moveTo(0, -halfSize);
          ctx.lineTo(halfSize, halfSize);
          ctx.lineTo(-halfSize, halfSize);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: "transparent" }}
    />
  );
}
