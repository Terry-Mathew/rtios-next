'use client';

import { useState } from 'react';
import { Shield, Download } from 'lucide-react';
import { exportUserData } from '@/src/domains/user/actions';
import { UserStats } from '@/src/domains/user/types';
import { useToastStore } from '@/src/stores/toastStore';

export default function PrivacySection({ stats }: { stats: UserStats }) {
    const [isExporting, setIsExporting] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    // TODO: I don think we have the database schema for this if so create a migration script for me so that i can apply or however you want it to be done

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // No userId needed, handled by session in action
            const data = await exportUserData();

            // Download as JSON
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rtios-export-${Date.now()}.json`;
            a.click();

            addToast({ type: 'success', message: 'Data exported successfully' });
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', message: 'Failed to export data' });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Privacy Header */}
            <div className="flex items-start gap-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                    <Shield className="w-6 h-6 text-accent" />
                </div>
                <div>
                    <h2 className="text-xl font-tiempos mb-1">Privacy</h2>
                    <p className="text-sm text-text-secondary">
                        Rtios believes in transparent data practices
                    </p>
                </div>
            </div>

            {/* Info Links */}
            <div className="space-y-2">
                <p className="text-sm text-text-secondary">
                    Learn how your information is protected when using Rtios products
                </p>
                <div className="space-y-1">
                    <a href="/privacy" className="text-sm text-accent hover:underline block">
                        How we protect your data →
                    </a>
                    <a href="/privacy" className="text-sm text-accent hover:underline block">
                        How we use your data →
                    </a>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Privacy Settings */}
            <div>
                <h3 className="text-lg font-interstate mb-4">Privacy settings</h3>

                {/* Export Data */}
                <div className="flex items-center justify-between py-4 border-b border-white/5">
                    <div>
                        <h4 className="font-medium">Export data</h4>
                        <p className="text-sm text-text-secondary">
                            Download all your jobs, resumes, and AI outputs
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="bg-surface-elevated hover:bg-white/10 border border-white/10 text-text-primary px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? 'Exporting...' : 'Export data'}
                    </button>
                </div>

                {/* Usage Stats (Read-only) */}
                <div className="flex items-center justify-between py-4">
                    <div>
                        <h4 className="font-medium">Your usage</h4>
                        <p className="text-sm text-text-secondary mt-1">
                            {stats.totalJobs} jobs tracked - {stats.coverLettersGenerated} cover letters generated
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
