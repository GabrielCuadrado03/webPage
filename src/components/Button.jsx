import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer';
  
  const variants = {
    primary: 'bg-[var(--color-primary,#00d2ff)] hover:bg-[var(--color-primary-hover,#00b4db)] text-slate-950 font-black shadow-md hover:shadow-lg shadow-[var(--color-primary,#00d2ff)]/25 focus:ring-[var(--color-primary,#00d2ff)]',
    secondary: 'bg-[var(--color-secondary,#ff0055)] hover:bg-[var(--color-secondary-hover,#e0004c)] text-white font-black shadow-md hover:shadow-lg shadow-[var(--color-secondary,#ff0055)]/25 focus:ring-[var(--color-secondary,#ff0055)]',
    outline: 'bg-transparent hover:bg-[var(--color-primary,#00d2ff)]/10 text-[var(--color-primary,#00d2ff)] border border-[var(--color-primary,#00d2ff)]/40 hover:border-[var(--color-primary,#00d2ff)] focus:ring-[var(--color-primary,#00d2ff)]',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg focus:ring-red-500 shadow-red-500/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
