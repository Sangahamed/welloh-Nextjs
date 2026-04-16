"use client";

import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}

const Confetti: React.FC<ConfettiProps> = ({ isActive, onComplete }) => {
  const [pieces, setPieces] = useState<any[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        color: ['#00f3ff', '#bc13fe', '#ff00ff', '#00ff00'][Math.floor(Math.random() * 4)],
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-4"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall-${p.id} ${p.duration}s linear ${p.delay}s forwards`
          }}
        />
      ))}
      <style>{`
        ${pieces.map(p => `
          @keyframes confetti-fall-${p.id} {
            0% { top: -10%; transform: translateX(0) rotate(0deg); }
            100% { top: 110%; transform: translateX(${Math.random() * 100 - 50}px) rotate(${p.rotation + 360}deg); }
          }
        `).join('')}
      `}</style>
    </div>
  );
};

export default Confetti;
