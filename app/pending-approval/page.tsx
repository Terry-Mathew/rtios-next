'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Clock, LogOut, Mail } from 'lucide-react';

export default function PendingApprovalPage() {
    const router = useRouter();

    const handleSignOut = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        );
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-app-dark flex items-center justify-center p-4 font-interstate">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <Clock className="w-10 h-10 text-yellow-400" />
                </div>

                {/* Title */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-tiempos text-text-primary">
                        Pending Approval
                    </h1>
                    <p className="text-text-secondary leading-relaxed">
                        Your account is awaiting administrator approval.
                        You&apos;ll receive access once an admin reviews your request.
                    </p>
                </div>

                {/* Info Card */}
                <div className="bg-surface-base border border-white/10 rounded-xl p-6 text-left space-y-4">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                        <div>
                            <p className="text-text-primary font-medium">What happens next?</p>
                            <p className="text-text-secondary text-sm mt-1">
                                An administrator will review your account and grant access.
                                This typically takes 24-48 hours.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sign Out Button */}
                <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>

                {/* Footer */}
                <p className="text-text-muted text-xs">
                    If you believe this is an error, please contact support.
                </p>
            </div>
        </div>
    );
}
