'use client';

import { useState } from 'react';
import { UserProfile } from '@/src/domains/user/types';
import { updatePassword, deleteUserAccount } from '@/src/domains/user/actions';
import { useToastStore } from '@/src/stores/toastStore';
import { useRouter } from 'next/navigation';

export default function AccountSection({ profile }: { profile: UserProfile }) {
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const addToast = useToastStore((s) => s.addToast);
    const router = useRouter();

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            addToast({ type: 'error', message: 'Passwords do not match' });
            return;
        }
        if (newPassword.length < 8) {
            addToast({ type: 'error', message: 'Password must be at least 8 characters' });
            return;
        }

        setIsChangingPassword(true);
        try {
            await updatePassword(newPassword); // Session based
            addToast({ type: 'success', message: 'Password updated successfully' });
            setShowPasswordChange(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', message: 'Failed to update password' });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            addToast({ type: 'error', message: 'Please type DELETE to confirm' });
            return;
        }

        setIsDeleting(true);
        try {
            await deleteUserAccount(); // Session based
            addToast({ type: 'success', message: 'Account deleted' });
            router.push('/');
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', message: 'Failed to delete account' });
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Account Info */}
            <div className="bg-surface-elevated border border-white/5 rounded-lg p-6">
                <h3 className="text-lg font-interstate mb-4">Account Information</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-text-secondary">Email</label>
                        <p className="text-text-primary">{profile.email}</p>
                    </div>
                    <div>
                        <label className="text-xs text-text-secondary">Member since</label>
                        <p className="text-text-primary">
                            {new Date(profile.createdAt).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-surface-elevated border border-white/5 rounded-lg p-6">
                <h3 className="text-lg font-interstate mb-4">Change Password</h3>

                {!showPasswordChange ? (
                    <button
                        onClick={() => setShowPasswordChange(true)}
                        className="bg-accent hover:bg-accent-hover text-surface-base px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                        Change Password
                    </button>
                ) : (
                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="New password (min 8 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-surface-base border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent text-text-primary"
                        />
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-surface-base border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent text-text-primary"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handlePasswordChange}
                                disabled={isChangingPassword}
                                className="bg-accent hover:bg-accent-hover text-surface-base px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isChangingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                            <button
                                onClick={() => setShowPasswordChange(false)}
                                className="bg-surface-base border border-white/10 hover:bg-white/5 text-text-primary px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Account */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6">
                <h3 className="text-lg font-interstate text-red-500 mb-2">Delete Account</h3>
                <p className="text-sm text-text-secondary mb-4">
                    This will permanently delete all your data: jobs, resumes, and AI outputs. This action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                        Delete Account
                    </button>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-text-primary">
                            Type <strong className="text-red-500">DELETE</strong> to confirm:
                        </p>
                        <input
                            type="text"
                            placeholder="Type DELETE"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full bg-surface-base border border-red-500/30 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 text-text-primary"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmText('');
                                }}
                                className="bg-surface-base border border-white/10 hover:bg-white/5 text-text-primary px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
