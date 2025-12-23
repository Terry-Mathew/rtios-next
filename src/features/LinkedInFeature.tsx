import React, { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import LinkedInMessageGenerator from '@/src/components/features/linkedin/LinkedInMessageGenerator';
import * as AIOrchestrator from '@/src/domains/intelligence/services/orchestrator';
import type { SavedResume, JobInfo, LinkedInState } from '@/src/types';

interface LinkedInFeatureProps {
    currentResume: SavedResume | null;
    currentJob: JobInfo;
    activeJobId: string | null;
    onUpdateJobOutputs: (jobId: string, updates: import('@/src/domains/jobs/types').JobOutputsUpdate) => void;
}

export const LinkedInFeature: React.FC<LinkedInFeatureProps> = ({
    currentResume,
    currentJob,
    activeJobId,
    onUpdateJobOutputs
}) => {
    // Get state with useShallow (CRITICAL - prevents infinite loops)
    const { linkedIn, research } = useWorkspaceStore(
        useShallow((s) => ({
            linkedIn: s.linkedIn,
            research: s.research
        }))
    );

    // Get actions
    const { updateLinkedIn } = useWorkspaceStore();

    const handleGenerateLinkedIn = async () => {
        if (!currentResume) return;

        updateLinkedIn({ isGenerating: true });

        try {
            const message = await AIOrchestrator.generateLinkedIn(
                currentResume.textParams,
                currentJob,
                linkedIn.input,
                research?.summary || "No research available"
            );

            const updatedLinkedIn = { ...linkedIn, generatedMessage: message, isGenerating: false };

            updateLinkedIn(updatedLinkedIn);

            // Update job history
            if (activeJobId) {
                onUpdateJobOutputs(activeJobId, {
                    linkedIn: updatedLinkedIn
                });
            }
        } catch (e) {
            console.error(e);
            updateLinkedIn({ isGenerating: false });
        }
    };

    const setLinkedInState = useCallback((updater: React.SetStateAction<LinkedInState>) => {
        const currentLinkedIn = useWorkspaceStore.getState().linkedIn;
        let newLinkedInState: LinkedInState;
        if (typeof updater === 'function') {
            const updaterFn = updater as (prevState: LinkedInState) => LinkedInState;
            newLinkedInState = updaterFn(currentLinkedIn);
        } else {
            newLinkedInState = updater;
        }
        updateLinkedIn(newLinkedInState);
    }, [updateLinkedIn]);

    return (
        <LinkedInMessageGenerator
            jobInfo={currentJob}
            linkedInState={linkedIn}
            setLinkedInState={setLinkedInState}
            onGenerate={handleGenerateLinkedIn}
            canGenerate={!!currentResume}
        />
    );
};
