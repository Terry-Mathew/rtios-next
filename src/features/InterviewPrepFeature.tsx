import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import InterviewPrepDisplay from '@/src/components/features/interview/InterviewPrepDisplay';
import * as AIOrchestrator from '@/src/domains/intelligence/services/orchestrator';
import type { SavedResume, JobInfo } from '@/src/types';

interface InterviewPrepFeatureProps {
    currentResume: SavedResume | null;
    currentJob: JobInfo;
    userProfile: import('@/src/types').UserProfile;
    activeJobId: string | null;
    onUpdateJobOutputs: (jobId: string, updates: import('@/src/domains/jobs/types').JobOutputsUpdate) => void;
}

export const InterviewPrepFeature: React.FC<InterviewPrepFeatureProps> = ({
    currentResume,
    currentJob,
    userProfile,
    activeJobId,
    onUpdateJobOutputs
}) => {
    // Get state with useShallow (CRITICAL - prevents infinite loops)
    const interviewPrep = useWorkspaceStore(
        useShallow((s) => s.interviewPrep)
    );

    // Get actions
    const { updateInterviewPrep } = useWorkspaceStore();

    const handleGenerateInterviewQuestions = async () => {
        if (!currentResume) return;

        updateInterviewPrep({ isGenerating: true });

        try {
            const existingQuestions = interviewPrep.questions.map(q => q.question);

            const newQuestions = await AIOrchestrator.generateInterview(
                currentResume.textParams,
                currentJob,
                userProfile,
                existingQuestions
            );

            const updatedInterviewPrep = {
                questions: [...interviewPrep.questions, ...newQuestions],
                isGenerating: false
            };

            updateInterviewPrep(updatedInterviewPrep);

            // Update job history
            if (activeJobId) {
                onUpdateJobOutputs(activeJobId, {
                    interviewPrep: updatedInterviewPrep
                });
            }
        } catch (e) {
            console.error(e);
            updateInterviewPrep({ isGenerating: false });
        }
    };

    return (
        <InterviewPrepDisplay
            state={interviewPrep}
            jobInfo={currentJob}
            onGenerateMore={handleGenerateInterviewQuestions}
            canGenerate={!!currentResume}
        />
    );
};
