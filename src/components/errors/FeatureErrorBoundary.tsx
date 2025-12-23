'use client';

import React from 'react';
import { ErrorBoundary } from '@/src/components/errors/ErrorBoundary';

interface FeatureErrorBoundaryProps {
    children: React.ReactNode;
    featureName: string;
}

export const FeatureErrorBoundary: React.FC<FeatureErrorBoundaryProps> = ({
    children,
    featureName
}) => {
    return (
        <ErrorBoundary
            resetKeys={[featureName]}
            onError={(error, _info) => {
                console.error(`[${featureName}] Error:`, error);
                // Here you could also log to your centralized error service with feature context
                // errorService.logError(error, { component: featureName });
            }}
            fallback={
                <div className="flex flex-col items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/10 dark:border-red-800">
                    <div className="mb-3 text-red-500">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-8 h-8"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-red-800 dark:text-red-200">
                        {featureName} Unavailable
                    </h3>
                    <p className="mb-4 text-sm text-center text-red-600 dark:text-red-300">
                        We ran into an issue loading this section.
                    </p>
                    <button
                        onClick={() => window.location.reload()} // Simple reload for now, or use a state reset mechanism if passed
                        className="px-3 py-1.5 text-xs font-medium text-white transition-colors bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Reload Page
                    </button>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
};
