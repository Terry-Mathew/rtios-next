import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastStore {
    toasts: ToastData[];
    addToast: (toast: Omit<ToastData, 'id'>) => void;
    removeToast: (id: string) => void;
    clearAllToasts: () => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...toast, id };

        set((state) => {
            // Limit max visible toasts to 5
            const currentToasts = state.toasts;
            if (currentToasts.length >= 5) {
                return { toasts: [...currentToasts.slice(1), newToast] };
            }
            return { toasts: [...currentToasts, newToast] };
        });

        // Auto-dismiss
        if (toast.duration !== 0) { // 0 duration means persistent
            const duration = toast.duration || 5000;
            setTimeout(() => {
                get().removeToast(id);
            }, duration);
        }
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
    clearAllToasts: () => set({ toasts: [] }),
}));
