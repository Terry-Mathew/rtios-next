import React, { useState } from 'react';
import { JobInfo, UserProfile, SavedResume, AppStatus } from '@/src/types';
import { Briefcase, FileText, RefreshCw, FolderOpen, AlertCircle, Plus, Check, Trash2 } from 'lucide-react';
import * as GeminiService from '@/src/domains/intelligence/actions';
import { supabaseBrowser } from '@/src/services/supabase';

interface InputFormProps {
    // Resume Props
    resumes: SavedResume[];
    activeResumeId: string | null;
    onAddResume: (file: File) => void;
    onSelectResume: (id: string) => void;
    onDeleteResume: (id: string) => void;



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
type NewJobMode = 'url' | 'manual';

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

    const [jobMode, setJobMode] = useState<JobMode>('library');
    const [newJobMode, setNewJobMode] = useState<NewJobMode>('url');

    // New Job State
    const [newJobUrl, setNewJobUrl] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [newJobData, setNewJobData] = useState<JobInfo>({
        title: '',
        company: '',
        description: '',
        companyUrl: '',
        contextName: ''
    });
    const [urlError, setUrlError] = useState<string | null>(null);

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
                setNewJobUrl('');
                setJobMode('library');
            } catch (error) {
                console.error("Failed to save job", error);
            } finally {
                setIsSavingJob(false);
            }
        }
    };

    // ... (rest of the file until button)

    <button
        onClick={handleSaveJob}
        disabled={!newJobData.title || !newJobData.company || !newJobData.description || !newJobData.contextName || isSavingJob}
        className="w-full py-3 bg-accent text-surface-base font-interstate font-bold text-xs uppercase tracking-widest rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {isSavingJob ? 'Saving Application...' : 'Next: Save Context'}
    </button>

    const handleUrlExtraction = async () => {
        if (!newJobUrl) return;

        setIsExtracting(true);
        setUrlError(null);

        try {
            const extracted = await GeminiService.extractJobFromUrl(newJobUrl);

            setNewJobData(prev => ({
                ...prev,
                title: extracted.title || '',
                company: extracted.company || '',
                description: extracted.description || '',
                companyUrl: extracted.companyUrl || '',
                sourceUrl: newJobUrl,
                // Suggest a context name
                contextName: extracted.company && extracted.title ? `${extracted.title} - ${extracted.company}` : prev.contextName
            }));

            if (!extracted.description || extracted.description.length < 50) {
                setUrlError("Could not fully extract details. Please review and fill manually.");
                setNewJobMode('manual');
            } else {
                setNewJobMode('manual');
            }

        } catch (e) {
            setUrlError("Could not access link. Please paste details manually.");
            setNewJobMode('manual');
        } finally {
            setIsExtracting(false);
        }
    };

    const isGenerating = appStatus === AppStatus.GENERATING || appStatus === AppStatus.RESEARCHING || appStatus === AppStatus.ANALYZING || appStatus === AppStatus.PARSING_RESUME;

    return (
        <div className="flex flex-col h-full bg-surface-elevated">



            {/* === APPLICATIONS (JOBS) === */}
            <div className="space-y-6 animate-fade-in-up">
                {jobMode === 'library' ? (
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-tiempos text-lg font-bold text-text-primary mb-1">Applications</h3>
                                <p className="font-interstate text-xs text-text-secondary">Select an application to work on.</p>
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
                                        <div className="absolute top-4 right-4 text-accent text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
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
                                    <p className="text-xs text-text-secondary">No active applications.</p>
                                    <button onClick={() => setJobMode('new')} className="text-xs text-accent hover:underline">Create Application</button>
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
                            <h3 className="font-tiempos text-lg font-bold text-text-primary">Step 2: Define Application</h3>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex bg-surface-base p-1 rounded border border-white/10 mb-6">
                            <button
                                onClick={() => setNewJobMode('url')}
                                className={`flex-1 py-1.5 text-[10px] font-interstate font-bold uppercase tracking-widest rounded transition-all
                                    ${newJobMode === 'url' ? 'bg-white/10 text-white' : 'text-text-secondary hover:text-white'}`}
                            >
                                Auto-Extract Link
                            </button>
                            <button
                                onClick={() => setNewJobMode('manual')}
                                className={`flex-1 py-1.5 text-[10px] font-interstate font-bold uppercase tracking-widest rounded transition-all
                                    ${newJobMode === 'manual' ? 'bg-white/10 text-white' : 'text-text-secondary hover:text-white'}`}
                            >
                                Manual Entry
                            </button>
                        </div>

                        {newJobMode === 'url' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1">Job Posting URL</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={newJobUrl}
                                            onChange={(e) => setNewJobUrl(e.target.value)}
                                            placeholder="https://linkedin.com/jobs/..."
                                            className="flex-1 bg-surface-base border border-white/10 rounded px-3 py-2 text-sm text-text-primary focus:border-accent outline-none"
                                        />
                                        <button
                                            onClick={handleUrlExtraction}
                                            disabled={!newJobUrl || isExtracting}
                                            className={`px-4 border border-white/10 rounded text-text-primary disabled:opacity-50 transition-all flex items-center justify-center min-w-[3rem]
                                                ${isExtracting ? 'bg-accent/10 border-accent/30' : 'bg-white/5 hover:bg-white/10'}`}
                                        >
                                            {isExtracting ? (
                                                <RefreshCw className="w-4 h-4 animate-spin text-accent" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Loading Indicator */}
                                    {isExtracting && (
                                        <div className="mt-3 p-3 bg-surface-base/50 border border-accent/20 rounded flex items-center gap-3 animate-fade-in-up">
                                            <div className="relative">
                                                <div className="w-3 h-3 bg-accent/50 rounded-full animate-ping absolute inset-0"></div>
                                                <div className="w-3 h-3 bg-accent rounded-full relative shadow-[0_0_10px_rgba(0,255,127,0.5)]"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-interstate font-bold text-accent uppercase tracking-widest">
                                                    Intelligence Active
                                                </span>
                                                <span className="text-[10px] text-text-secondary">
                                                    Analyzing page structure...
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {urlError && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-alert-gap bg-alert-gap/10 p-2 rounded">
                                            <AlertCircle className="w-3 h-3" />
                                            {urlError}
                                        </div>
                                    )}
                                    <div className="mt-4 p-4 bg-surface-base border border-white/5 rounded">
                                        <p className="text-[10px] text-text-secondary leading-relaxed">
                                            <FileText className="w-3 h-3 inline mr-1" />
                                            AI will attempt to read the job title, company, and description directly from the page.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Context Name Input (Required per PRD) */}
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1 font-interstate">Application Name *</label>
                                    <input
                                        type="text"
                                        value={newJobData.contextName || ''}
                                        onChange={(e) => setNewJobData({ ...newJobData, contextName: e.target.value })}
                                        placeholder="e.g. Senior PM - Google"
                                        className="w-full bg-surface-base border border-white/10 rounded px-3 py-2 text-sm text-text-primary focus:border-accent outline-none placeholder:text-white/20"
                                    />
                                    <p className="text-[9px] text-text-secondary mt-1">This creates the file name for your saved application.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-1">Job Title *</label>
                                        <input
                                            type="text"
                                            value={newJobData.title}
                                            onChange={(e) => setNewJobData({ ...newJobData, title: e.target.value })}
                                            className="w-full bg-surface-base border border-white/10 rounded px-3 py-2 text-sm text-text-primary focus:border-accent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-1">Company *</label>
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
                                        className="w-full bg-surface-base border border-white/10 rounded px-3 py-2 text-sm text-text-primary focus:border-accent outline-none"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-medium text-text-secondary">Job Description *</label>
                                        <button
                                            onClick={() => {/* Mock load saved JD functionality */ alert("Load Saved JD clicked - Implementation would open a modal to select from past JDs") }}
                                            className="text-[10px] text-accent hover:underline flex items-center gap-1"
                                        >
                                            <FolderOpen className="w-3 h-3" /> Load Saved JD
                                        </button>
                                    </div>
                                    <textarea
                                        value={newJobData.description}
                                        onChange={(e) => setNewJobData({ ...newJobData, description: e.target.value })}
                                        className="w-full bg-surface-base border border-white/10 rounded px-3 py-2 text-sm text-text-primary focus:border-accent outline-none min-h-[150px] resize-none custom-scrollbar"
                                    />
                                </div>

                                <button
                                    onClick={handleSaveJob}
                                    disabled={!newJobData.title || !newJobData.company || !newJobData.description || !newJobData.contextName || isSavingJob}
                                    className="w-full py-3 bg-accent text-surface-base font-interstate font-bold text-xs uppercase tracking-widest rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingJob ? 'Saving Application...' : 'Next: Save Context'}
                                </button>
                            </div>
                        )}
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
                    {isGenerating ? 'Processing Intelligence...' : 'Run Intelligence'}
                </button>
                {(!currentResume || !activeJobId) && !isGenerating && (
                    <p className="text-center mt-2 text-[10px] text-alert-gap font-interstate uppercase tracking-widest">
                        {!currentResume ? 'Resume Required (Check Dashboard)' : 'Select an Application'}
                    </p>
                )}
            </div>

        </div >
    );
};

export default InputForm;
