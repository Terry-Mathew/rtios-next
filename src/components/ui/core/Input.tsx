import React, { useId } from 'react';

export type InputVariant = 'boxed' | 'underlined';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    variant?: InputVariant;
    label?: string;
    error?: string;
    helperText?: string;
}

const variantStyles: Record<InputVariant, string> = {
    boxed: `
        bg-surface-base border border-white/10 rounded-lg px-4 py-3
        hover:border-white/20
        focus:border-accent focus:ring-1 focus:ring-accent
    `,
    underlined: `
        bg-transparent border-b border-white/20 py-2 px-0
        hover:border-white/30
        focus:border-accent
    `
};

export const Input: React.FC<InputProps> = ({
    variant = 'boxed',
    label,
    error,
    helperText,
    className = '',
    id,
    ...props
}) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = [
        error ? errorId : null,
        helperText && !error ? helperId : null
    ].filter(Boolean).join(' ') || undefined;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-[10px] font-interstate font-bold text-text-secondary uppercase tracking-widest mb-2"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                aria-describedby={describedBy}
                aria-invalid={!!error}
                className={`
                    w-full text-sm font-interstate text-text-primary
                    placeholder-text-placeholder
                    focus:outline-none transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${variantStyles[variant]}
                    ${error ? 'border-alert-gap focus:border-alert-gap focus:ring-alert-gap/30' : ''}
                    ${className}
                `.trim().replace(/\s+/g, ' ')}
                {...props}
            />
            {error && (
                <p
                    id={errorId}
                    role="alert"
                    className="mt-1.5 text-[10px] text-alert-gap font-interstate"
                >
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p
                    id={helperId}
                    className="mt-1.5 text-[10px] text-text-secondary font-interstate"
                >
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default Input;
