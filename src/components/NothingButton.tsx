import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
}

export const NothingButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "uppercase font-ndot tracking-widest text-sm px-4 py-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
          variant === 'primary' && "bg-ntg-white text-ntg-black hover:bg-ntg-gray hover:text-ntg-white",
          variant === 'secondary' && "border border-ntg-white text-ntg-white hover:bg-ntg-white hover:text-ntg-black",
          variant === 'ghost' && "text-ntg-white hover:bg-ntg-gray/30",
          variant === 'icon' && "p-2 rounded-full hover:bg-ntg-gray/30 text-ntg-light flex items-center justify-center",
          className
        )}
        {...props}
      />
    );
  }
);
NothingButton.displayName = 'NothingButton';
