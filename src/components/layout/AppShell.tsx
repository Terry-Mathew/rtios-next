'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/src/components/ui/AuthModal';
import { useAppStore } from '@/src/stores/appStore';

interface AppShellProps {
    children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
    const router = useRouter();
    const isAuthModalOpen = useAppStore((s) => s.isAuthModalOpen);
    const setIsAuthModalOpen = useAppStore((s) => s.setIsAuthModalOpen);

    const handleAuthSuccess = () => {
        setIsAuthModalOpen(false);
        router.push('/dashboard');
    };

    return (
        <div className="flex h-screen bg-surface-base text-text-primary font-sans overflow-hidden selection:bg-accent/30">
            <main className="flex-1 overflow-auto relative flex flex-col">
                {children}
            </main>
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onSuccess={handleAuthSuccess}
            />
        </div>
    );
};
