import React, { ReactNode } from 'react';
import { motion } from "motion/react";

interface AlfaButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'danger' | 'success' | 'outline' | 'neumorphic';
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function AlfaButton({ children, onClick, className = "", variant = 'primary', type = 'button', disabled }: AlfaButtonProps) {
  const variants = {
    primary: "bg-alfa-blue text-white font-display tracking-widest shadow-xl hover:shadow-[0_15px_40px_rgba(0,40,85,0.3)]",
    danger: "bg-alfa-neon-red text-white font-display tracking-widest shadow-xl hover:shadow-[0_15px_40px_rgba(217,27,66,0.25)]",
    success: "bg-emerald-600 text-white shadow-xl font-display tracking-widest",
    outline: "bg-transparent border-2 border-alfa-blue/20 text-alfa-blue hover:bg-alfa-blue/5",
    neumorphic: "alfa-glass text-alfa-blue font-bold shadow-xl"
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98, y: 0 }}
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`
        relative px-6 sm:px-10 py-3.5 sm:py-5 rounded-[1.2rem] sm:rounded-[2rem] font-black text-lg sm:text-2xl transition-all duration-500
        ${variants[variant]}
        ${disabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
        ${className}
      `}
    >
      <div className="flex items-center justify-center gap-3">
        {children}
      </div>
    </motion.button>
  );
}
