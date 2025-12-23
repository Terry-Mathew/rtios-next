'use client';

/**
 * CareerContextProvider - Global Context Provider for Career State
 * 
 * Persists state via Supabase (public.profiles, public.resumes).
 * Replaces legacy localStorage logic.
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { SavedResume, UserProfile } from '@/src/domains/career/types';
import * as careerService from '@/src/domains/career/services/careerService';
import { useToastStore } from '@/src/stores/toastStore';

// Define the context shape
export interface CareerContextValue {
    // State
    resumes: SavedResume[];
    activeResumeId: string | null;
    userProfile: UserProfile;
    currentResume: SavedResume | undefined;
    isLoading: boolean;

    // Actions
    uploadResume: (file: File) => Promise<void>;
    selectResume: (id: string) => Promise<void>;
    deleteResume: (id: string) => Promise<void>;
    updateProfile: (profile: Partial<UserProfile>) => Promise<void>;

    // For backward compatibility (deprecate if possible)
    addResume: (resume: SavedResume) => void;
    setResumes: React.Dispatch<React.SetStateAction<SavedResume[]>>;
    setActiveResumeId: React.Dispatch<React.SetStateAction<string | null>>;
    syncFromStorage: () => void; // No-op now
}

const DEFAULT_PROFILE: UserProfile = {
    activeResumeId: null,
    portfolioUrl: '',
    linkedinUrl: ''
};

// Create the context (exported for use by careerHooks.ts)
export const CareerContext = createContext<CareerContextValue | null>(null);

// Provider component
export const CareerContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [resumes, setResumes] = useState<SavedResume[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
    const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { addToast } = useToastStore();

    // Derived: Current resume
    const currentResume = resumes.find(r => r.id === activeResumeId) || resumes[0];

    // Initial Load
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                const [paramProfile, paramResumes] = await Promise.all([
                    careerService.fetchProfile(),
                    careerService.getResumes()
                ]);

                if (mounted) {
                    if (paramProfile) {
                        setUserProfile(paramProfile);
                        // If profile has an active resume ID and it exists in fetched resumes, use it
                        if (paramProfile.activeResumeId && paramResumes.find(r => r.id === paramProfile.activeResumeId)) {
                            setActiveResumeId(paramProfile.activeResumeId);
                        } else if (paramResumes.length > 0) {
                            // Default to most recent
                            setActiveResumeId(paramResumes[0].id);
                        }
                    }
                    setResumes(paramResumes);
                }
            } catch (err) {
                console.error('Failed to load career data:', err);
                addToast({ type: 'error', message: 'Failed to load profile data' });
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        init();
        return () => { mounted = false; };
    }, [addToast]);

    // Actions

    const uploadResume = useCallback(async (file: File) => {
        setIsLoading(true);
        try {
            const newResume = await careerService.uploadResume(file);
            setResumes(prev => [newResume, ...prev]);
            setActiveResumeId(newResume.id);

            // Update profile with new active ID
            await careerService.updateProfile({ activeResumeId: newResume.id });
            setUserProfile(prev => ({ ...prev, activeResumeId: newResume.id }));

            addToast({ type: 'success', message: 'Resume uploaded successfully' });
        } catch (error: any) {
            console.error('Upload failed:', error);
            addToast({ type: 'error', message: `Upload failed: ${error.message}` });
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    const deleteResume = useCallback(async (id: string) => {
        try {
            await careerService.deleteResume(id);
            setResumes(prev => prev.filter(r => r.id !== id));

            if (activeResumeId === id) {
                setActiveResumeId(null);
                await careerService.updateProfile({ activeResumeId: null });
            }
            addToast({ type: 'success', message: 'Resume deleted' });
        } catch (error: any) {
            addToast({ type: 'error', message: `Delete failed: ${error.message}` });
        }
    }, [activeResumeId, addToast]);

    const selectResume = useCallback(async (id: string) => {
        setActiveResumeId(id);
        setUserProfile(prev => ({ ...prev, activeResumeId: id }));
        try {
            await careerService.updateProfile({ activeResumeId: id });
        } catch (err: any) {
            console.error('Failed to sync selection:', err);
        }
    }, []);

    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        // Optimistic update
        setUserProfile(prev => ({ ...prev, ...updates }));
        try {
            await careerService.updateProfile(updates);
            addToast({ type: 'success', message: 'Profile updated' });
        } catch (err: any) {
            console.error('Profile update failed:', err);
            addToast({ type: 'error', message: 'Failed to update profile' });
            // Revert? (Complex, skipping for now)
        }
    }, [addToast]);

    // Legacy / Compat stubs
    const addResume = useCallback((resume: SavedResume) => {
        console.warn('addResume is deprecated, use uploadResume');
        // This is tricky because we can't upload 'SavedResume' object back to server easily without the File
        // But for local-first optimism we might leave it. 
        // For now, no-op or state update only if we want to be risky.
        setResumes(prev => [resume, ...prev]);
    }, []);

    const syncFromStorage = useCallback(() => {
        // No-op
    }, []);

    const value: CareerContextValue = {
        resumes,
        activeResumeId,
        userProfile,
        currentResume,
        isLoading,
        addResume,
        uploadResume,
        selectResume,
        deleteResume,
        updateProfile,
        syncFromStorage,
        setResumes,
        setActiveResumeId
    };

    return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>;
};

// Note: useCareerContext hook moved to careerHooks.ts to satisfy react-refresh/only-export-components
