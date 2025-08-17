import React from 'react';

/** Bouton conforme charte ECOLOJIA (vert #7DDE4A, arrondis, hover doux) */
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  varianta: 'primary' | 'secondary' | 'ghost';
  leftIcona: React.ReactNode;
  rightIcona: React.ReactNode;
  isloading?: boolean;
};

const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl';
const variants: Record<string,string> = {
  primary: 'bg-[#7DDE4A] text-white hover:bg-[#6BC93B] disabled:opacity-60',
  secondary: 'bg-white text-[#3B3B3B] border border-[#DDE9DA] hover:bg-[#F7F9F4] disabled:opacity-60',
  ghost: 'bg-transparent text-[#3B3B3B] hover:bg-[#E9F8DF] disabled:opacity-60'
};
const size = 'px-4 py-2 text-sm';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={className}
      disabled={isLoading || disabled}
      {...props}
    >
      {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  )
);
Button.displayName = 'Button';

export default Button;


