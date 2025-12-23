'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { ToastData } from '@/src/stores/toastStore';

interface ToastProps extends ToastData {
    onDismiss: (id: string) => void;
}

const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const styles = {
    success: 'border-l-4 border-green-500 bg-white dark:bg-gray-800',
    error: 'border-l-4 border-red-500 bg-white dark:bg-gray-800',
    warning: 'border-l-4 border-yellow-500 bg-white dark:bg-gray-800',
    info: 'border-l-4 border-blue-500 bg-white dark:bg-gray-800',
};

export const Toast: React.FC<ToastProps> = ({ id, type, message, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay to trigger animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => onDismiss(id), 300); // Wait for exit animation
    };

    return (
        <div
            className={`
        flex items-start gap-3 p-4 mb-3 rounded shadow-lg transition-all duration-300 ease-in-out transform
        ${styles[type]}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}
        w-80 pointer-events-auto
      `}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100 break-words">
                {message}
            </div>
            <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
