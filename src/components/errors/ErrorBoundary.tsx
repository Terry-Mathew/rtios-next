'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: readonly unknown[];
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Call custom onError handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps) {
        // Check if resetKeys have changed
        if (this.props.resetKeys && prevProps.resetKeys) {
            const hasChanged = this.props.resetKeys.some(
                (key, index) => key !== prevProps.resetKeys![index]
            );
            if (hasChanged) {
                this.reset();
            }
        }
    }

    reset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default customized fallback UI
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-surface-base rounded-lg text-center">
                    <div className="mb-4 text-accent">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-12 h-12"
                        >
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <h2 className="mb-2 text-xl font-tiempos text-text-primary">Something went wrong</h2>
                    <p className="mb-6 font-interstate text-text-secondary max-w-md">
                        We encountered an unexpected error. Please try again or refresh the page.
                    </p>
                    <button
                        onClick={this.reset}
                        className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
