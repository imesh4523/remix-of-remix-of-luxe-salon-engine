import { motion } from 'framer-motion';
import { memo } from 'react';

// Optimized mascot - reduced animations for better performance
export const FloatingMascot = memo(() => {
  return (
    <motion.div
      className="fixed top-24 right-6 z-40 pointer-events-none sm:right-10 md:right-16 will-change-transform"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Single gentle float animation */}
      <motion.div
        className="relative"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Soft glow behind mascot */}
        <div className="absolute inset-0 w-32 h-32 sm:w-40 sm:h-40 -translate-x-2 -translate-y-2 bg-gradient-radial from-pink-200/40 via-violet-200/20 to-transparent rounded-full blur-2xl" />
        
        {/* Main Mascot Container - Drag enabled */}
        <motion.div
          className="relative cursor-grab active:cursor-grabbing"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          drag
          dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
          dragElastic={0.15}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Body - Marshmallow shape with 3D effect */}
          <div className="relative w-24 h-28 sm:w-28 sm:h-32 md:w-32 md:h-36">
            
            {/* Main body shape */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-50 rounded-[60%_60%_55%_55%] shadow-[0_20px_50px_rgba(0,0,0,0.15),0_8px_20px_rgba(0,0,0,0.1)]">
              {/* 3D highlight - top shine */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-8 sm:w-20 sm:h-10 bg-gradient-to-b from-white to-transparent rounded-full opacity-90" />
              
              {/* 3D inner shadow for depth */}
              <div className="absolute inset-2 rounded-[55%] bg-gradient-to-b from-transparent via-transparent to-slate-100/50" />
            </div>
            
            {/* Face container */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-3 sm:pt-4">
              
              {/* Eyes with shine - Static, no animation */}
              <div className="flex gap-5 sm:gap-6 md:gap-7 mb-2">
                {/* Left eye */}
                <div className="relative">
                  <div className="w-3 h-3.5 sm:w-3.5 sm:h-4 md:w-4 md:h-5 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full shadow-inner">
                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full opacity-90" />
                    <div className="absolute bottom-1 right-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white/50 rounded-full" />
                  </div>
                </div>
                
                {/* Right eye */}
                <div className="relative">
                  <div className="w-3 h-3.5 sm:w-3.5 sm:h-4 md:w-4 md:h-5 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full shadow-inner">
                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full opacity-90" />
                    <div className="absolute bottom-1 right-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white/50 rounded-full" />
                  </div>
                </div>
              </div>
              
              {/* Rosy cheeks - Static */}
              <div className="flex gap-10 sm:gap-12 md:gap-14 -mt-1">
                <div className="w-4 h-2.5 sm:w-5 sm:h-3 bg-gradient-to-r from-pink-300/60 to-rose-300/60 rounded-full blur-[2px]" />
                <div className="w-4 h-2.5 sm:w-5 sm:h-3 bg-gradient-to-r from-rose-300/60 to-pink-300/60 rounded-full blur-[2px]" />
              </div>
              
              {/* Cute smile - cat mouth style */}
              <div className="relative mt-1 sm:mt-1.5">
                <svg width="20" height="10" viewBox="0 0 20 10" className="sm:w-6 sm:h-3 md:w-7 md:h-4">
                  <path 
                    d="M2 3 Q10 10 18 3" 
                    fill="none" 
                    stroke="#4B5563" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            
            {/* Arms - Static positioned */}
            <div className="absolute top-12 -left-3 sm:top-14 sm:-left-4 md:top-16 md:-left-5">
              <div className="w-5 h-7 sm:w-6 sm:h-8 md:w-7 md:h-9 bg-gradient-to-b from-white to-slate-50 rounded-full shadow-md">
                <div className="absolute top-1 left-1 w-2 h-3 bg-white/80 rounded-full" />
              </div>
              <div className="absolute -bottom-1 left-0 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-white to-slate-50 rounded-full shadow-sm" />
            </div>
            
            <div className="absolute top-12 -right-3 sm:top-14 sm:-right-4 md:top-16 md:-right-5">
              <div className="w-5 h-7 sm:w-6 sm:h-8 md:w-7 md:h-9 bg-gradient-to-b from-white to-slate-50 rounded-full shadow-md">
                <div className="absolute top-1 right-1 w-2 h-3 bg-white/80 rounded-full" />
              </div>
              <div className="absolute -bottom-1 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-white to-slate-50 rounded-full shadow-sm" />
            </div>
            
            {/* Legs - Static */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-3 sm:gap-4">
              <div className="w-4 h-5 sm:w-5 sm:h-6 md:w-6 md:h-7 bg-gradient-to-b from-white to-slate-100 rounded-full shadow-md">
                <div className="absolute top-1 left-1 w-2 h-2 bg-white/80 rounded-full" />
              </div>
              <div className="w-4 h-5 sm:w-5 sm:h-6 md:w-6 md:h-7 bg-gradient-to-b from-white to-slate-100 rounded-full shadow-md">
                <div className="absolute top-1 left-1 w-2 h-2 bg-white/80 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Single sparkle - reduced from 3 */}
        <motion.div
          className="absolute -top-3 right-0 w-3 h-3 sm:w-4 sm:h-4"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg viewBox="0 0 24 24" className="w-full h-full text-amber-400 fill-current drop-shadow-lg">
            <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

FloatingMascot.displayName = 'FloatingMascot';

export default FloatingMascot;
