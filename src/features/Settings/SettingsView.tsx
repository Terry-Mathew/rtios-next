'use client';

import { useState } from 'react';
import { UserProfile, UserStats } from '@/src/domains/user/types';
import PrivacySection from './PrivacySection';
import AccountSection from './AccountSection';

export default function SettingsView({
    profile,
    stats,
}: {
    profile: UserProfile;
    stats: UserStats;
}) {
    const [activeSection, setActiveSection] = useState<'privacy' | 'account'>('privacy');

    return (
        <div className="min-h-screen bg-surface-base text-text-primary">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <h1 className="text-3xl font-tiempos mb-8">Settings</h1>

                {/* Tab Navigation */}
                <div className="flex gap-4 border-b border-white/10 mb-8">
                    <button
                        onClick={() => setActiveSection('privacy')}
                        className={`pb-3 px-1 transition-colors cursor-pointer ${activeSection === 'privacy'
                                ? 'border-b-2 border-accent text-text-primary'
                                : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Privacy & Data
                    </button>
                    <button
                        onClick={() => setActiveSection('account')}
                        className={`pb-3 px-1 transition-colors cursor-pointer ${activeSection === 'account'
                                ? 'border-b-2 border-accent text-text-primary'
                                : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Account
                    </button>
                </div>

                {/* Sections */}
                {activeSection === 'privacy' && <PrivacySection stats={stats} />}
                {activeSection === 'account' && <AccountSection profile={profile} />}
            </div>
        </div>
    );
}
