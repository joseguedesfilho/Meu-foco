import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  icon: Icon,
  className = '',
  disabled = false,
  type = 'button'
}: ButtonProps) {
  const variants = {
    primary: 'bg-gold-500 text-black hover:bg-gold-400 shadow-[0_0_20px_rgba(197,141,50,0.3)]',
    secondary: 'bg-white text-black hover:bg-gray-100',
    outline: 'bg-transparent border border-gold-500/50 text-gold-500 hover:bg-gold-500/10',
    ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all duration-200
        flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
    >
      {Icon && <Icon size={18} />}
      {children}
    </motion.button>
  );
}
