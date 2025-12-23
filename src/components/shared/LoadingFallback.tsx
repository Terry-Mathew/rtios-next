
import React from 'react';
import { Target } from 'lucide-react';

const LoadingFallback: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] h-full w-full bg-surface-base text-accent animate-pulse">
            <div className="relative">
                <Target className="w-10 h-10 mb-4 opacity-50" />
                <div className="absolute inset-0 border-4 border-accent/30 border-t-accent rounded-full w-10 h-10 animate-spin"></div>
            </div>
            <p className="font-interstate text-xs font-bold uppercase tracking-widest text-text-secondary">
                Loading Application Context...
            </p>
        </div>
    );
};

export default LoadingFallback;
