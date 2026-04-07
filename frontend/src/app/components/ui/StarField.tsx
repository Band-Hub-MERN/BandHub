import { useMemo } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  isGold: boolean;
}

interface StarFieldProps {
  count?: number;
  className?: string;
}

export function StarField({ count = 160, className = '' }: StarFieldProps) {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.5 + 0.15,
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      isGold: Math.random() < 0.12, // ~12% are gold
    }));
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Deep space gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(20,20,60,0.5) 0%, rgba(9,9,11,0) 70%)',
        }}
      />
      {/* Stars */}
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: star.isGold ? '#FFC904' : (star.size > 1.5 ? '#E8E8FF' : '#FFFFFF'),
            opacity: star.opacity,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            boxShadow: star.isGold && star.size > 1.2 ? '0 0 3px rgba(255,201,4,0.6)' : undefined,
          }}
        />
      ))}
      {/* Nebula blobs */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '500px',
          height: '300px',
          top: '10%',
          left: '60%',
          background: 'rgba(255,201,4,0.022)',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '600px',
          height: '400px',
          top: '70%',
          left: '20%',
          background: 'rgba(30,30,100,0.12)',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '300px',
          height: '200px',
          top: '40%',
          left: '80%',
          background: 'rgba(255,201,4,0.015)',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: var(--tw-opacity, 0.4); transform: scale(1); }
          50% { opacity: 0.05; transform: scale(0.6); }
        }
      `}</style>
    </div>
  );
}