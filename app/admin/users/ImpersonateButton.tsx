'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';

interface Props {
    userId: string;
}

export function ImpersonateButton({ userId }: Props) {
    const [loading, setLoading] = useState(false);

    async function impersonate() {
        if (!confirm('Generate a Magic Link to log in as this user? (Open in Incognito/Private window)')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to generate link');

            // Copy to clipboard
            await navigator.clipboard.writeText(data.url);

            // Prompt user
            const openNow = confirm('Magic Link generated and COPIED to clipboard!\n\nDo you want to open it in a new tab now?\n(Ideally use Incognito to stay logged in as Admin)');

            if (openNow) {
                window.open(data.url, '_blank');
            }

        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error generating link');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={impersonate}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded text-xs font-interstate font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="Generate Login Link"
        >
            <Eye className="w-3.5 h-3.5" />
            {loading ? 'Generating...' : 'Impersonate'}
        </button>
    );
}
