import React from 'react';

interface AlfaInputProps {
  key?: React.Key;
  label?: string;
  type?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  dir?: 'rtl' | 'ltr';
  neon?: boolean;
}

export function AlfaInput({ label, type = "text", name, value, onChange, placeholder, className = "", icon, dir = 'rtl', neon = false }: AlfaInputProps) {
  return (
    <div className={`flex flex-col gap-1 sm:gap-2.5 ${className}`} dir={dir}>
      {label && <label className="text-[10px] sm:text-[11px] font-black opacity-30 uppercase tracking-[0.25em] px-3">{label}</label>}
      <div className={`relative group rounded-[1.2rem] sm:rounded-[1.6rem] flex items-center h-[50px] sm:h-[68px] transition-all duration-500 ${neon ? 'alfa-neon-glass-input' : 'alfa-glass border-white/80'}`}>
        {icon && (
          <div className="absolute left-5 sm:left-7 text-alfa-blue group-focus-within:text-alfa-neon-blue transition-colors duration-500 z-10 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder || label}
          className={`w-full h-full bg-transparent px-6 ${icon ? (dir === 'rtl' ? 'pr-6 pl-12 sm:pl-16' : 'pl-14 sm:pl-16 pr-6') : 'px-6'} font-black text-alfa-blue outline-none placeholder:text-alfa-blue/20 placeholder:font-black text-base sm:text-2xl`}
        />
      </div>
    </div>
  );
}
