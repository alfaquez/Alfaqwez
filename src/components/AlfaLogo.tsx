import React from 'react';
import { motion } from 'motion/react';

export function AlfaLogo({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const scale = size === "sm" ? 0.6 : size === "md" ? 1 : size === "lg" ? 1.5 : 2;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center select-none"
      style={{ scale }}
    >
      <div className="relative">
        {/* Main Blue Square with 3D feel */}
        <motion.div 
          whileHover={{ rotateY: 15, rotateX: 10 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="w-32 h-32 bg-[#1a2d5e] rounded-[1.5rem] flex flex-col items-center justify-end pb-4 shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_-8px_10px_rgba(0,0,0,0.2),inset_0_8px_10px_rgba(255,255,255,0.1)] relative"
        >
          {/* 3D Blood Drop */}
          <motion.div 
            animate={{ 
                y: [0, -5, 0],
                scale: [1, 1.05, 1]
            }}
            transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
            }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-20 bg-gradient-to-br from-[#ff3d3d] to-[#d91b42] rounded-t-full rounded-b-[40%_60%] shadow-[0_15px_25px_rgba(217,27,66,0.4),inset_-5px_-5px_15px_rgba(0,0,0,0.2),inset_5px_5px_15px_rgba(255,255,255,0.4)]"
          >
             {/* Highlight on drop */}
             <div className="absolute top-[15%] left-[20%] w-[25%] h-[35%] bg-white/40 blur-[2px] rounded-full rotate-[-15deg]" />
          </motion.div>

          {/* "alfa" Text */}
          <span className="text-white text-5xl font-black lowercase tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            alfa
          </span>
        </motion.div>

        {/* Shadow under the block */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/20 blur-xl rounded-full" />
      </div>

      {/* "LABS" Text */}
      <motion.span 
        initial={{ letterSpacing: "1em", opacity: 0 }}
        animate={{ letterSpacing: "0.6em", opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="mt-6 text-[#1a2d5e] font-black text-xl tracking-[0.6em] ml-[0.6em] uppercase"
      >
        LABS
      </motion.span>
    </motion.div>
  );
}
