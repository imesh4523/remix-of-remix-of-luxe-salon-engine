import { motion } from 'framer-motion';
import { memo, useState, useCallback } from 'react';

// Optimized Static Scissors Component - No internal animations
const Scissors3D = memo(() => (
  <svg viewBox="0 0 100 60" className="w-20 h-12 sm:w-24 sm:h-14 md:w-28 md:h-16 drop-shadow-xl">
    <defs>
      <linearGradient id="goldBlade" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE55C" />
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="goldHandle" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFE55C" />
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    
    {/* Bottom Blade - Static */}
    <g style={{ transform: 'rotate(4deg)', transformOrigin: '55px 32px' }}>
      <path d="M8 28 L50 26 Q55 26 56 30 L56 34 Q55 38 50 38 L8 36 Q4 34 4 32 Q4 30 8 28 Z" fill="url(#goldBlade)" />
      <ellipse cx="70" cy="44" rx="14" ry="11" fill="none" stroke="url(#goldHandle)" strokeWidth="5"/>
      <path d="M56 32 Q60 38 62 44 Q58 40 56 36 Z" fill="url(#goldHandle)"/>
    </g>
    
    {/* Top Blade - Static */}
    <g style={{ transform: 'rotate(-4deg)', transformOrigin: '55px 28px' }}>
      <path d="M8 24 L50 22 Q55 22 56 26 L56 30 Q55 34 50 34 L8 32 Q4 30 4 28 Q4 26 8 24 Z" fill="url(#goldBlade)" />
      <path d="M10 25 L48 23.5" stroke="#FFFACD" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <ellipse cx="70" cy="14" rx="14" ry="11" fill="none" stroke="url(#goldHandle)" strokeWidth="5"/>
      <path d="M56 28 Q60 22 62 14 Q58 20 56 24 Z" fill="url(#goldHandle)"/>
    </g>
    
    {/* Center screw */}
    <circle cx="55" cy="30" r="5" fill="url(#goldHandle)" stroke="#B8860B" strokeWidth="1"/>
    <circle cx="54" cy="29" r="1.5" fill="#FFE55C" opacity="0.9"/>
  </svg>
));
Scissors3D.displayName = 'Scissors3D';

// Optimized Static Hair Dryer Component
const HairDryer3D = memo(() => (
  <svg viewBox="0 0 80 64" className="w-16 h-12 sm:w-20 sm:h-16 md:w-24 md:h-20 drop-shadow-xl">
    <defs>
      <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF69B4" />
        <stop offset="50%" stopColor="#FF1493" />
        <stop offset="100%" stopColor="#DB7093" />
      </linearGradient>
      <linearGradient id="pinkShine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFB6C1" />
        <stop offset="50%" stopColor="#FF69B4" />
        <stop offset="100%" stopColor="#C71585" />
      </linearGradient>
    </defs>
    
    <ellipse cx="45" cy="28" rx="22" ry="16" fill="url(#pinkShine)" />
    <ellipse cx="40" cy="22" rx="12" ry="6" fill="#FFB6C1" opacity="0.5"/>
    <rect x="2" y="22" width="22" height="12" rx="2" fill="#3A3A3A" />
    <rect x="4" y="24" width="4" height="8" rx="1" fill="#5A5A5A"/>
    <path d="M50 38 Q55 50 50 58 L42 58 Q47 50 42 38 Z" fill="url(#pinkGradient)" />
    <path d="M48 40 Q50 48 48 54" stroke="#FFB6C1" strokeWidth="2" fill="none" opacity="0.6"/>
    <circle cx="52" cy="28" r="3" fill="#C71585"/>
  </svg>
));
HairDryer3D.displayName = 'HairDryer3D';

// Optimized Static Comb Component
const Comb3D = memo(() => (
  <svg viewBox="0 0 64 40" className="w-14 h-10 sm:w-18 sm:h-12 md:w-20 md:h-14 drop-shadow-xl">
    <defs>
      <linearGradient id="roseGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F4C2C2" />
        <stop offset="50%" stopColor="#E8B4B8" />
        <stop offset="100%" stopColor="#C9A0A0" />
      </linearGradient>
      <linearGradient id="roseGoldShine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFE4E1" />
        <stop offset="50%" stopColor="#F4C2C2" />
        <stop offset="100%" stopColor="#BC8F8F" />
      </linearGradient>
    </defs>
    
    <rect x="4" y="4" width="56" height="8" rx="3" fill="url(#roseGoldShine)" />
    <rect x="8" y="5" width="48" height="3" rx="1.5" fill="#FFE4E1" opacity="0.6"/>
    
    {[...Array(12)].map((_, i) => (
      <rect
        key={i}
        x={8 + i * 4}
        y="11"
        width="2.5"
        height="20"
        rx="1"
        fill="url(#roseGoldGradient)"
      />
    ))}
  </svg>
));
Comb3D.displayName = 'Comb3D';

// Optimized Static Nail Polish Component
const NailPolish3D = memo(() => (
  <svg viewBox="0 0 32 56" className="w-8 h-14 sm:w-10 sm:h-18 md:w-12 md:h-20 drop-shadow-xl">
    <defs>
      <linearGradient id="polishGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B9D" />
        <stop offset="50%" stopColor="#C44569" />
        <stop offset="100%" stopColor="#8B1A4A" />
      </linearGradient>
      <linearGradient id="capGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#2C2C2C" />
        <stop offset="50%" stopColor="#1A1A1A" />
        <stop offset="100%" stopColor="#0D0D0D" />
      </linearGradient>
    </defs>
    
    <path d="M6 22 Q4 24 4 28 L4 48 Q4 52 8 52 L24 52 Q28 52 28 48 L28 28 Q28 24 26 22 Z" fill="url(#polishGradient)" />
    <path d="M8 26 Q7 28 7 32 L7 46 Q7 48 9 48" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" opacity="0.7"/>
    <rect x="11" y="14" width="10" height="10" fill="url(#polishGradient)"/>
    <rect x="9" y="4" width="14" height="12" rx="2" fill="url(#capGradient)" />
    <rect x="11" y="5" width="4" height="8" rx="1" fill="#4A4A4A" opacity="0.5"/>
  </svg>
));
NailPolish3D.displayName = 'NailPolish3D';

interface FloatingItemProps {
  children: React.ReactNode;
  initialPos: { x: number; y: number };
  delay: number;
}

const FloatingItem = memo(({ children, initialPos, delay }: FloatingItemProps) => {
  const [itemScale, setItemScale] = useState(1);

  const handleDoubleClick = useCallback(() => {
    setItemScale(s => Math.min(s + 0.25, 2.2));
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setItemScale(s => Math.max(s - 0.25, 0.5));
  }, []);

  return (
    <motion.div
      className="absolute cursor-grab active:cursor-grabbing touch-none pointer-events-auto will-change-transform"
      style={{ 
        left: initialPos.x, 
        top: initialPos.y,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: itemScale }}
      transition={{ delay, duration: 0.5 }}
      drag
      dragConstraints={{ left: -120, right: 120, top: -120, bottom: 120 }}
      dragElastic={0.12}
      whileHover={{ scale: itemScale * 1.1 }}
      whileTap={{ scale: itemScale * 0.95 }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {children}
      {/* Subtle glow */}
      <div className="absolute inset-0 -z-10 bg-gradient-radial from-white/15 to-transparent rounded-full blur-xl scale-150" />
    </motion.div>
  );
});
FloatingItem.displayName = 'FloatingItem';

export const FloatingSalonIcons = memo(() => {
  const items = [
    { component: <Scissors3D />, initialPos: { x: 5, y: 40 }, delay: 0.5 },
    { component: <HairDryer3D />, initialPos: { x: 90, y: 5 }, delay: 0.7 },
    { component: <Comb3D />, initialPos: { x: 40, y: 85 }, delay: 0.9 },
    { component: <NailPolish3D />, initialPos: { x: 150, y: 55 }, delay: 1.1 },
  ];

  return (
    <motion.div
      className="fixed top-24 left-1 z-0 sm:left-3 md:left-6 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="relative w-48 h-40 sm:w-60 sm:h-48 md:w-72 md:h-56">
        {items.map((item, index) => (
          <FloatingItem
            key={index}
            initialPos={item.initialPos}
            delay={item.delay}
          >
            {item.component}
          </FloatingItem>
        ))}
      </div>
    </motion.div>
  );
});

FloatingSalonIcons.displayName = 'FloatingSalonIcons';

export default FloatingSalonIcons;
