'use client';

import React from 'react';
import { useToastStore } from '@/src/stores/toastStore';
import { Toast } from '@/src/components/ui/Toast';

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end pointer-events-none">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onDismiss={removeToast}
                />
            ))}
        </div>
    );
};
