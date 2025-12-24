'use client';

import { X, Lock, Zap } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    isLifetimeLimit?: boolean; // NEW: indicates no reset timer
    totalUsed?: number;
    totalAllowed?: number;
}

export default function UpgradeModal({
    isOpen,
    onClose,
    title,
    message,
    isLifetimeLimit = false,
    totalUsed = 2,
    totalAllowed = 2
}: UpgradeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-elevated border border-white/10 rounded-lg max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-accent" />
                        <h2 className="text-xl font-tiempos">{title}</h2>
                    </div>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Message */}
                <p className="text-text-secondary mb-6">{message}</p>

                {isLifetimeLimit && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                        <p className="text-sm text-red-400">
                            <strong>Free trial complete.</strong> You&apos;ve created {totalUsed} out of {totalAllowed} free job applications. Upgrade to continue!
                        </p>
                    </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3 mb-6">
                    <button
                        onClick={() => window.location.href = '/pricing'}
                        className="w-full bg-accent hover:bg-accent/90 text-surface-base py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Zap className="w-4 h-4" />
                        Upgrade to Pro
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-surface-base border border-white/10 hover:bg-white/5 text-text-primary py-3 px-4 rounded-lg transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>

                {/* Pro Features */}
                <div className="pt-6 border-t border-white/10">
                    <p className="text-xs text-text-secondary mb-3 uppercase tracking-wider">Pro Benefits:</p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <span className="text-accent mt-0.5">✓</span>
                            <div>
                                <p className="text-sm font-medium text-text-primary">Unlimited Job Applications</p>
                                <p className="text-xs text-text-secondary">Track as many jobs as you want</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-accent mt-0.5">✓</span>
                            <div>
                                <p className="text-sm font-medium text-text-primary">Unlimited AI Generations</p>
                                <p className="text-xs text-text-secondary">Cover letters, LinkedIn messages, interview prep</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-accent mt-0.5">✓</span>
                            <div>
                                <p className="text-sm font-medium text-text-primary">Priority Support</p>
                                <p className="text-xs text-text-secondary">Get help when you need it</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Pricing Teaser */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-text-secondary">
                        Starting at <span className="text-accent font-bold">$9/month</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
