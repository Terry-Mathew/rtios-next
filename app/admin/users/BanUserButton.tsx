'use client';

import { useState } from 'react';
import { Ban, CheckCircle } from 'lucide-react';

interface Props {
    userId: string;
    currentStatus: string; // 'active' | 'banned'
}

export function BanUserButton({ userId, currentStatus }: Props) {
    const [loading, setLoading] = useState(false);
    const isBanned = currentStatus === 'banned';

    async function toggleBan() {
        const action = isBanned ? 'UNBAN' : 'BAN';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/users/ban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status: isBanned ? 'active' : 'banned' })
            });

            if (!res.ok) throw new Error('Failed to update status');

            window.location.reload();
        } catch (error) {
            alert('Error updating status');
            setLoading(false);
        }
    }

    return (
        <button
            onClick={toggleBan}
            disabled={loading}
            className={`px-3 py-1.5 rounded text-xs font-interstate font-medium transition-colors flex items-center gap-1.5 ${isBanned
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                }`}
        >
            {isBanned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
            {loading ? 'Updating...' : (isBanned ? 'Unban' : 'Ban')}
        </button>
    );
}
