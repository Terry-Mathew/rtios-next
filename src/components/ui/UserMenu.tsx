'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { auth } from '@/src/services/supabase';

export function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await auth.getUser();
            if (user) {
                setEmail(user.email || null);
            }
        };
        fetchUser();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await auth.signOut();
        // Force full reload to / to clear all state & caches
        window.location.href = '/';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-full bg-surface-elevated hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors focus:outline-none focus:border-accent"
            >
                <User className="w-4 h-4 text-text-secondary" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface-elevated border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-fade-in-up z-50">
                    <div className="p-4 border-b border-white/5">
                        <p className="text-xs text-text-secondary">Signed in as</p>
                        <p className="text-sm font-medium text-text-primary truncate" title={email || ''}>
                            {email || 'Loading...'}
                        </p>
                    </div>

                    <div className="py-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/settings');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            Settings
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2 text-sm text-alert-gap hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
