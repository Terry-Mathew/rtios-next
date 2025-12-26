'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { approveUser, denyUser } from '@/src/domains/user/actions';

interface Props {
    userId: string;
    isApproved: boolean;
}

export function ApprovalButtons({ userId, isApproved }: Props) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<boolean | null>(isApproved);

    async function handleApprove() {
        if (!confirm('Approve this user? They will gain full access.')) return;
        setLoading(true);
        try {
            await approveUser(userId);
            setStatus(true);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to approve');
        } finally {
            setLoading(false);
        }
    }

    async function handleDeny() {
        if (!confirm('Deny/Revoke access for this user?')) return;
        setLoading(true);
        try {
            await denyUser(userId);
            setStatus(false);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to deny');
        } finally {
            setLoading(false);
        }
    }

    if (status === true) {
        return (
            <button
                onClick={handleDeny}
                disabled={loading}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded text-xs font-interstate font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                title="Revoke Access"
            >
                <X className="w-3 h-3" />
                Revoke
            </button>
        );
    }

    return (
        <button
            onClick={handleApprove}
            disabled={loading}
            className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded text-xs font-interstate font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
            title="Approve User"
        >
            <Check className="w-3 h-3" />
            {loading ? '...' : 'Approve'}
        </button>
    );
}
