'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
    userId: string;
}

export function DeleteUserButton({ userId }: Props) {
    const [loading, setLoading] = useState(false);

    async function deleteUser() {
        if (!confirm('EXTREMELY DANGEROUS ACTION:\n\nAre you sure you want to PERMANENTLY DELETE this user?\nThis will remove their account and all data. This cannot be undone.')) return;

        // Double confirmation
        if (!confirm('Are you really sure? Click OK to delete.')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/users/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (!res.ok) throw new Error('Failed to delete user');

            alert('User deleted successfully');
            window.location.reload();
        } catch (error) {
            alert('Error deleting user');
            setLoading(false);
        }
    }

    return (
        <button
            onClick={deleteUser}
            disabled={loading}
            className="px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/30 rounded text-xs font-interstate font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="Permanently Delete User"
        >
            <Trash2 className="w-3.5 h-3.5" />
            {loading ? 'Deleting...' : 'Delete'}
        </button>
    );
}
