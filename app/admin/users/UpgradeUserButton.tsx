'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';

interface Props {
    userId: string;
    currentRole: string;
}

export function UpgradeUserButton({ userId, currentRole }: Props) {
    const [loading, setLoading] = useState(false);

    async function upgradeUser(role: 'user' | 'admin') {
        const action = role === 'admin' ? 'promote to Admin' : 'demote to User';
        if (!confirm(`Are you sure you want to ${action}?`)) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/upgrade-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to upgrade');

            alert(`User ${action} successfully`);
            window.location.reload();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error updating user');
        } finally {
            setLoading(false);
        }
    }

    const isAdmin = currentRole === 'admin';

    return (
        <button
            onClick={() => upgradeUser(isAdmin ? 'user' : 'admin')}
            disabled={loading}
            className={`px-3 py-1.5 rounded text-xs font-interstate font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${isAdmin
                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                }`}
        >
            <Shield className="w-3.5 h-3.5" />
            {loading ? 'Updating...' : isAdmin ? 'Demote' : 'Make Admin'}
        </button>
    );
}
