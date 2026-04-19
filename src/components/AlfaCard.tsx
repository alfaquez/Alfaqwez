import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from "motion/react";

interface AlfaCardProps extends HTMLMotionProps<'div'> {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  animate?: boolean;
}

export function AlfaCard({ children, title, subtitle, className = "", animate = true, ...props }: AlfaCardProps) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.95 } : false}
      animate={animate ? { opacity: 1, scale: 1 } : false}
      className={`alfa-glass border-alfa-neon-blue/10 shadow-[0_15px_35px_rgba(0,40,85,0.08)] rounded-[2rem] sm:rounded-[3rem] overflow-hidden ${className}`}
      {...props}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-alfa-neon-blue/5 blur-3xl rounded-full -mr-12 -mt-12 pointer-events-none" />
      <div className="relative z-10 p-4 sm:p-6">
        {(title || subtitle) && (
          <div className="mb-2 sm:mb-4 flex flex-col gap-0.5">
            {subtitle && (
              <span className="text-[10px] sm:text-[14px] font-black uppercase tracking-[0.25em] text-alfa-blue/40 leading-none">
                {subtitle}
              </span>
            )}
            {title && (
              <h3 className="text-2xl sm:text-4xl font-black text-alfa-blue tracking-tight leading-tight">
                {title}
              </h3>
            )}
          </div>
        )}
        
        <div>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

