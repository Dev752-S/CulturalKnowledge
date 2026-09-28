import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface CulturalBackgroundProps {
  children: ReactNode;
}

export default function CulturalBackground({ children }: CulturalBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  // Subtle floating ambient gold/cream particles
  const particles = [
    { id: 1, top: '15%', left: '22%', size: 4, duration: 8, delay: 0 },
    { id: 2, top: '28%', right: '25%', size: 3, duration: 11, delay: 1.5 },
    { id: 3, top: '65%', left: '18%', size: 5, duration: 9, delay: 0.5 },
    { id: 4, top: '75%', right: '20%', size: 4, duration: 12, delay: 2 },
    { id: 5, top: '40%', left: '80%', size: 3, duration: 10, delay: 1 },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F5EFE4] flex flex-col justify-between select-none">
      {/* High-Resolution Watercolor Artwork Base */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-95 transition-opacity duration-1000"
        style={{
          backgroundImage: "url('/assets/cultural_watercolor_bg.jpg')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      {/* Soft Center Radial Lightener to guarantee optimal glass card contrast */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(245, 239, 228, 0.5) 0%, rgba(245, 239, 228, 0.1) 60%, transparent 100%)',
        }}
      />

      {/* Gentle Floating Cultural Ambient Particles (Optional Subtle Motion) */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-gradient-to-tr from-[#D19A4A] to-[#F5EFE4] opacity-35 blur-[0.5px]"
              style={{
                top: p.top,
                left: p.left,
                right: p.right,
                width: p.size,
                height: p.size,
              }}
              animate={{
                y: [0, -18, 0],
                x: [0, 8, 0],
                opacity: [0.2, 0.45, 0.2],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Main Foreground Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
