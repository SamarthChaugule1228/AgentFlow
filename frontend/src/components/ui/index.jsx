import React from 'react';

export function Button({ variant = 'primary', size = 'md', disabled = false, className = '', children, ...props }) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#75b992] focus-visible:ring-offset-2';
  const variants = {
    primary: 'bg-[#3d9b69] text-white hover:bg-[#2f8a5c] shadow-[0_10px_22px_rgba(61,155,105,0.20)] disabled:bg-[#9bc2aa]',
    secondary: 'border border-[#d4e4d8] bg-white text-[#193026] hover:bg-[#f4f8f6] disabled:opacity-60',
    ghost: 'text-[#4a8564] hover:bg-[#eef5f0] disabled:opacity-60',
    danger: 'bg-[#b14b48] text-white hover:bg-[#9b3f3c] disabled:opacity-60'
  };
  const sizes = {
    sm: 'h-8 px-3 py-1.5 text-xs',
    md: 'h-10 px-4 py-2.5 text-sm',
    lg: 'h-12 px-6 py-3 text-base'
  };
  const combinedClasses = [baseClasses, variants[variant], sizes[size], className, 'disabled:cursor-not-allowed'].filter(Boolean).join(' ');
  return <button className={combinedClasses} disabled={disabled} {...props}>{children}</button>;
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-xl border border-[#e0e7df] bg-white ${className}`}>{children}</div>;
}

export function Input({ error, label, ...props }) {
  return <div className="flex flex-col gap-2">
    {label && <label className="text-sm font-medium text-[#193026]">{label}</label>}
    <input {...props} className={`h-10 rounded-lg border px-3 text-sm outline-none transition ${error ? 'border-[#d4746d] ring-2 ring-[#f5e8e6]' : 'border-[#dce4dc] ring-[#75b992] focus:ring-2'}`}/>
    {error && <span className="text-xs text-[#b14b48]">{error}</span>}
  </div>;
}

export function Badge({ variant = 'default', children }) {
  const variants = {
    default: 'bg-[#edf8f0] text-[#3d875c]',
    success: 'bg-[#e7f6ec] text-[#2e8657]',
    warning: 'bg-[#fff5dc] text-[#9b751d]',
    error: 'bg-[#fff0ee] text-[#b35d55]'
  };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${variants[variant]}`}>{children}</span>;
}

export function Toast({ variant = 'default', message, icon: Icon }) {
  const variants = {
    default: 'bg-[#eef5f1] border-[#d4e4d8] text-[#4a8564]',
    success: 'bg-[#e7f6ec] border-[#b9dcc7] text-[#2e8657]',
    error: 'bg-[#fff0ee] border-[#e8c2bc] text-[#b35d55]'
  };
  return <div className={`rounded-lg border ${variants[variant]} px-4 py-3 text-sm flex items-center gap-3`}>
    {Icon && <Icon size={18} className="shrink-0"/>}
    {message}
  </div>;
}
