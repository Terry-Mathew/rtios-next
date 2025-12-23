import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    variant = 'default'
}) => {
    const isCompact = variant === 'compact';

    return (
        <div className={`
            flex flex-col items-center justify-center text-center
            ${isCompact ? 'py-6 px-4' : 'py-12 px-8'}
        `}>
            <div className={`
                flex items-center justify-center rounded-full bg-white/5 mb-4
                ${isCompact ? 'w-10 h-10' : 'w-16 h-16'}
            `}>
                <Icon className={`text-text-secondary ${isCompact ? 'w-5 h-5' : 'w-8 h-8'} opacity-50`} />
            </div>

            <h3 className={`
                font-tiempos font-bold text-text-primary mb-2
                ${isCompact ? 'text-base' : 'text-lg'}
            `}>
                {title}
            </h3>

            {description && (
                <p className={`
                    font-interstate text-text-secondary max-w-xs
                    ${isCompact ? 'text-xs' : 'text-sm'}
                `}>
                    {description}
                </p>
            )}

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="mt-4 text-accent text-xs font-interstate font-bold uppercase tracking-widest hover:underline transition-all"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
