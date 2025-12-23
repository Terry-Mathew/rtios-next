import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: `
        bg-accent text-surface-base 
        hover:bg-white hover:text-surface-base 
        shadow-[0_0_15px_rgba(0,255,127,0.3)]
        disabled:bg-white/10 disabled:text-text-secondary disabled:shadow-none
    `,
    secondary: `
        bg-white/5 text-text-primary border border-white/10
        hover:bg-white/10 hover:border-white/20
        disabled:bg-white/5 disabled:text-text-secondary disabled:border-white/5
    `,
    ghost: `
        bg-transparent text-text-secondary
        hover:bg-white/5 hover:text-text-primary
        disabled:text-text-secondary/50
    `,
    danger: `
        bg-alert-gap/10 text-alert-gap border border-alert-gap/30
        hover:bg-alert-gap/20 hover:border-alert-gap/50
        disabled:bg-white/5 disabled:text-text-secondary disabled:border-white/5
    `
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'py-1.5 px-3 text-[10px]',
    md: 'py-2.5 px-4 text-xs',
    lg: 'py-4 px-6 text-sm'
};

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    children,
    className = '',
    disabled,
    ...props
}) => {
    return (
        <button
            className={`
                font-interstate font-bold uppercase tracking-widest
                rounded-sm transition-all
                flex items-center justify-center gap-2
                disabled:cursor-not-allowed
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `.trim().replace(/\s+/g, ' ')}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    );
};

export default Button;
