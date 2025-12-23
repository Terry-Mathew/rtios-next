/**
 * useResumeManagement Hook
 * 
 * Consolidates all resume management logic from route components:
 * - Resume CRUD operations (add, delete, select)
 * - Profile updates (portfolio URL, LinkedIn URL)
 * - Workspace synchronization (resumeText)
 * 
 * This hook eliminates duplicate logic between AppView and DashboardView
 * and provides a single source of truth for resume management operations.
 */

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCareerContext } from '@/src/domains/career/hooks/useCareerContext';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

// import { fileToBase64 } from '@/src/utils/fileUtils';
import { AppStatus } from '@/src/types';
import type { SavedResume, UserProfile } from '@/src/domains/career/types';
import { errorService } from '@/src/services/errorService';
import { useToastStore } from '@/src/stores/toastStore';
import { storage, supabaseBrowser } from '@/src/services/supabase';

interface UseResumeManagementReturn {
    // Data
    resumes: SavedResume[];
    activeResumeId: string | null;
    currentResume: SavedResume | undefined;
    userProfile: UserProfile;
    isLoading: boolean;

    // Actions
    addResume: (file: File) => Promise<void>;
    selectResume: (id: string) => void;
    deleteResume: (id: string) => void;
    updateProfile: (profile: UserProfile) => void;
    syncFromStorage: () => void; // NEW: Reload from localStorage
}

export const useResumeManagement = (): UseResumeManagementReturn => {
    // Get career domain state
    const {
        resumes,
        activeResumeId,
        userProfile,
        currentResume,
        isLoading,
        addResume: legacyAddResume, // Deprecated
        uploadResume: contextUploadResume,
        selectResume: handleSelectResume,
        deleteResume: handleDeleteResume,
        updateProfile: setUserProfile,
        syncFromStorage, // NEW: Sync function from context
    } = useCareerContext();

    // Get workspace state (use useShallow to prevent infinite re-renders)
    useWorkspaceStore(useShallow((s) => ({
        status: s.status
    })));

    // Get workspace actions
    const { setStatus, setResumeText } = useWorkspaceStore();

    /**
     * Add a new resume with parsing
     * Handles: file → base64 → AI text extraction → context update
     */
    const addResume = useCallback(async (file: File) => {
        setStatus(AppStatus.PARSING_RESUME);
        try {
            await contextUploadResume(file);
            setStatus(AppStatus.IDLE);
        } catch (e: unknown) {
            const message = errorService.handleError(e, {
                component: 'useResumeManagement',
                action: 'addResume',
                fileName: file.name
            });
            setStatus(AppStatus.ERROR);
            useToastStore.getState().addToast({ type: 'error', message });
        }
    }, [contextUploadResume, setStatus]);

    /**
     * Select a resume as active (simple passthrough)
     */
    const selectResume = useCallback((id: string) => {
        try {
            handleSelectResume(id);
        } catch (error: unknown) {
            const message = errorService.handleError(error, {
                component: 'useResumeManagement',
                action: 'selectResume',
                resumeId: id
            });
            useToastStore.getState().addToast({ type: 'error', message });
        }
    }, [handleSelectResume]);

    /**
     * Delete a resume (simple passthrough)
     */
    const deleteResume = useCallback((id: string) => {
        try {
            handleDeleteResume(id);
            useToastStore.getState().addToast({ type: 'success', message: 'Resume deleted' });
        } catch (error: unknown) {
            const message = errorService.handleError(error, {
                component: 'useResumeManagement',
                action: 'deleteResume',
                resumeId: id
            });
            useToastStore.getState().addToast({ type: 'error', message });
        }
    }, [handleDeleteResume]);

    /**
     * Update user profile (simple passthrough)
     */
    const updateProfile = useCallback((profile: UserProfile) => {
        setUserProfile(profile);
    }, [setUserProfile]);

    return {
        // Data
        resumes,
        activeResumeId,
        currentResume,
        userProfile,
        isLoading,

        // Actions
        addResume,
        selectResume,
        deleteResume,
        updateProfile,
        syncFromStorage // NEW: Pass through sync function
    };
};
