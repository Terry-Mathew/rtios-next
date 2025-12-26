import React, { useState } from 'react';
import { JobInfo, SavedResume, AppStatus } from '@/src/types';
import { Briefcase, FolderOpen, Plus, Check, Trash2 } from 'lucide-react';
import { useToastStore } from '@/src/stores/toastStore';

interface InputFormProps {
    // Resume Props
    resumes: SavedResume[];
    activeResumeId: string | null;

    // Job Props
    jobs: JobInfo[];
    activeJobId: string | null;
    onAddJob: (job: JobInfo) => Promise<void>;
    onSelectJob: (id: string) => void;
    onDeleteJob: (id: string) => void;

    // App Props
    onGenerate: () => void;
    appStatus: AppStatus;
}


type JobMode = 'library' | 'new';

const InputForm: React.FC<InputFormProps> = ({
    resumes,
    activeResumeId,

    jobs,
    activeJobId,
    onAddJob,
    onSelectJob,
    onDeleteJob,
    onGenerate,
    appStatus,
}) => {
    const addToast = useToastStore((state) => state.addToast);

    const [jobMode, setJobMode] = useState<JobMode>('library');

    // New Job State
    const [newJobData, setNewJobData] = useState<JobInfo>({
        title: '',
        company: '',
        description: '',
        companyUrl: '',
        contextName: ''
    });

    const currentResume = resumes.length > 0 ? resumes[0] : null;

    const [isSavingJob, setIsSavingJob] = useState(false);

    // Link resume to job creation if a resume is active
    const handleSaveJob = async () => {
        if (newJobData.title && newJobData.company && newJobData.description && newJobData.contextName) {
            setIsSavingJob(true);
            try {
                const jobToSave = {
                    ...newJobData,
                    linkedResumeId: activeResumeId || undefined // Automatically link active resume
                };
                await onAddJob(jobToSave);
                setNewJobData({ title: '', company: '', description: '', companyUrl: '', contextName: '' });
                setJobMode('library');
            } catch (error) {
                console.error("Failed to save job", error);
            } finally {
                setIsSavingJob(false);
            }
        }
    };

    const isGenerating = appStatus === AppStatus.GENERATING || appStatus === AppStatus.RESEARCHING || appStatus === AppStatus.ANALYZING || appStatus === AppStatus.PARSING_RESUME;

    return (
        <div className="flex flex-col h-full bg-surface-elevated">



            {/* === APPLICATIONS (JOBS) === */}
            <div className="space-y-6 animate-fade-in-up p-6">
                {jobMode === 'library' ? (
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-tiempos text-lg font-bold text-text-primary mb-1">Mission Objectives</h3>
                                <p className="font-interstate text-xs text-text-secondary">Select a target objective to work on.</p>
                            </div>
                            <button
                                onClick={() => setJobMode('new')}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-accent transition-colors border border-white/10"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    onClick={() => onSelectJob(job.id!)}
                                    className={`p-4 rounded-lg border transition-all cursor-pointer relative group
                                        ${activeJobId === job.id
                                            ? 'bg-accent/10 border-accent shadow-[0_0_10px_rgba(0,255,127,0.1)]'
                                            : 'bg-surface-base border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <h4 className={`font-tiempos text-base font-bold ${activeJobId === job.id ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                                            {job.contextName || job.title}
                                        </h4>
                                        <div className="flex items-center gap-2 font-interstate text-xs text-text-secondary">
                                            <Briefcase className="w-3 h-3" />
                                            {job.company}
                                        </div>
                                    </div>
                                    {activeJobId === job.id && (
                                        <div className="absolute top-4 right-4 text-accent text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                            Active <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id!); }}
                                        className="absolute bottom-4 right-4 p-1.5 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-alert-gap transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {jobs.length === 0 && (
                                <div className="text-center p-8 border border-white/5 rounded bg-surface-base/50 flex flex-col items-center gap-3">
                                    <Briefcase className="w-8 h-8 text-text-secondary opacity-30" />
                                    <p className="text-xs text-text-secondary">No active missions.</p>
                                    <button onClick={() => setJobMode('new')} className="text-xs text-accent hover:underline">Create Mission</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="animate-fade-in-up">
                        {/* New Job Form */}
                        <div className="flex items-center gap-2 mb-6">
                            <button onClick={() => setJobMode('library')} className="text-xs text-text-secondary hover:text-white">Cancel</button>
                            <div className="h-4 w-px bg-white/10"></div>
                            <h3 className="font-tiempos text-lg font-bold text-text-primary">New Mission</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Context Name Input (Required per PRD) */}
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1 font-interstate">Mission Name *</label>
                                <input
                                    type="text"
                                    value={newJobData.contextName || ''}
                                    onChange={(e) => setNewJobData({ ...newJobData, contextName: e.target.value })}
                                    placeholder="e.g. Senior PM - Google"
                                    className="w-full bg-surface-base border border-white/10 rounded px-3 py-2 text-sm text-text-primary focus:border-accent outline-none placeholder:text-white/20"
                                />
                                <p className="text-xs text-text-secondary mt-1">This creates the file name for your saved mission.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1">Target Role *</label>
                                    <input
                                        type="text"
                                        value={newJobData.title}
                                        onChange={(e) => setNewJobData({ ...newJobData, title: e.target.value })}
                                        className="w-full bg-surface-base border border-white/10 rounded px-3 py-2 text-sm text-text-primary focus:border-accent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1">Target Entity *</label>
                                    <input
                                        type="text"
                                        value={newJobData.company}
                                        onChange={(e) => setNewJobData({ ...newJobData, company: e.target.value })}
                                        className="w-full bg-surface-base border border-white/10 rounded px-3 py-2 text-sm text-text-primary focus:border-accent outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">Company URL</label>
                                <input
                                    type="url"
                                    value={newJobData.companyUrl}
                                    onChange={(e) => setNewJobData({ ...newJobData, companyUrl: e.target.value })}
                                    placeholder="https://company.com"
                                    className="w-full bg-surface-base border border-white/10 rounded px-3 py-2 text-sm text-text-primary focus:border-accent outline-none placeholder:text-white/20"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-medium text-text-secondary">Job Description *</label>
                                    <button
                                        onClick={() => addToast({ type: 'info', message: 'Feature coming soon: Load from Saved Parameters' })}
                                        className="text-xs text-accent hover:underline flex items-center gap-1"
                                    >
                                        <FolderOpen className="w-3 h-3" /> Load Saved
                                    </button>
                                </div>
                                <textarea
                                    value={newJobData.description}
                                    onChange={(e) => setNewJobData({ ...newJobData, description: e.target.value })}
                                    placeholder="Paste the full job description here..."
                                    className="w-full bg-surface-base border border-white/10 rounded px-3 py-2 text-sm text-text-primary focus:border-accent outline-none min-h-[150px] resize-none custom-scrollbar placeholder:text-white/20"
                                />
                            </div>

                            <button
                                onClick={handleSaveJob}
                                disabled={!newJobData.title || !newJobData.company || !newJobData.description || !newJobData.contextName || isSavingJob}
                                className="w-full py-3 bg-accent text-surface-base font-interstate font-bold text-xs uppercase tracking-widest rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingJob ? 'Saving Mission...' : 'Save Mission'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Action Bar (Sticky Bottom) */}
            <div className="p-6 bg-surface-elevated border-t border-white/5">
                <button
                    onClick={onGenerate}
                    disabled={!currentResume || !activeJobId || isGenerating}
                    className={`w-full py-4 px-4 rounded-sm font-interstate font-bold text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2
            ${(!currentResume || !activeJobId || isGenerating)
                            ? 'bg-surface-base border border-white/10 text-text-secondary cursor-not-allowed'
                            : 'bg-accent text-surface-base hover:bg-white shadow-[0_0_15px_rgba(0,255,127,0.3)]'
                        }`}
                >
                    {isGenerating ? 'Initializing Recon...' : 'EXECUTE ANALYSIS'}
                </button>
                {(!currentResume || !activeJobId) && !isGenerating && (
                    <p className="text-center mt-2 text-xs text-alert-gap font-interstate uppercase tracking-widest">
                        {!currentResume ? 'Operative Profile Required' : 'Select Mission Objective'}
                    </p>
                )}
            </div>

        </div >
    );
};

export default InputForm;
