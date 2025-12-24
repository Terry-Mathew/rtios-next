'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
    userId: string;
}

export function ResetUsageButton({ userId }: Props) {
    const [loading, setLoading] = useState(false);

    async function resetUsage() {
        if (!confirm('Reset job creation count to 0? This will DELETE all jobs for this user!')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/reset-usage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to reset');

            alert('Usage reset successfully');
            window.location.reload();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error resetting usage');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={resetUsage}
            disabled={loading}
            className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded text-xs font-interstate font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
            <RotateCcw className="w-3.5 h-3.5" />
            {loading ? 'Resetting...' : 'Reset Usage'}
        </button>
    );
}
