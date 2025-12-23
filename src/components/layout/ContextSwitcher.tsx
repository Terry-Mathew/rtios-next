import React, { useState, useRef, useEffect } from 'react';
import { JobInfo, SavedResume } from '@/src/types';
import { ChevronDown, Check } from 'lucide-react';

interface ContextSwitcherProps {
    jobs: JobInfo[];
    activeJobId: string | null;
    resumes: SavedResume[];
    activeResumeId: string | null;
    onSelectStrategy: (jobId: string) => void;
}

const ContextSwitcher: React.FC<ContextSwitcherProps> = ({
    jobs,
    activeJobId,
    resumes,
    onSelectStrategy,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeJob = jobs.find(j => j.id === activeJobId);
    const activeResume = resumes.length > 0 ? resumes[0] : null;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="w-full bg-surface-base border-b border-white/5 px-6 py-4 flex items-center justify-between z-30" ref={dropdownRef}>
            <div className="flex items-center gap-4">
                <span className="font-interstate text-xs text-text-secondary uppercase tracking-widest hidden md:inline-block">
                    Active Application:
                </span>

                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-3 group focus:outline-none"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(0,255,127,0.4)]"></div>
                            <span className="font-tiempos text-lg font-bold text-text-primary group-hover:text-white transition-colors">
                                {activeJob ? (activeJob.contextName || activeJob.title) : 'Select Application'}
                            </span>
                            <span className="font-interstate text-xs text-text-secondary hidden md:inline-block">
                                {activeResume ? `(${activeResume.fileName})` : ''}
                            </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div className="absolute top-full left-0 mt-3 w-[300px] md:w-[400px] bg-surface-elevated border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-fade-in-up z-40">
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {jobs.map((job) => (
                                    <button
                                        key={job.id}
                                        onClick={() => {
                                            onSelectStrategy(job.id!);
                                            setIsOpen(false);
                                        }}
                                        className="w-full text-left p-4 hover:bg-white/5 transition-colors border-b border-white/5 flex items-start justify-between group"
                                    >
                                        <div>
                                            <div className={`font-tiempos text-sm font-bold mb-1 ${activeJobId === job.id ? 'text-accent' : 'text-text-primary'}`}>
                                                {job.contextName || job.title}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="font-interstate text-[10px] text-text-secondary">
                                                    {job.company} • {job.title}
                                                </div>
                                            </div>
                                        </div>
                                        {activeJobId === job.id && (
                                            <Check className="w-4 h-4 text-accent" />
                                        )}
                                    </button>
                                ))}
                                {jobs.length === 0 && (
                                    <div className="p-4 text-center font-interstate text-xs">
                                        <p className="text-text-secondary mb-2">No applications yet.</p>
                                        <p className="text-accent">Open Workspace → to add one</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right side status or actions can go here */}
            <div className="flex items-center gap-2">
                {activeJob && (
                    <span className="font-interstate text-[10px] text-text-secondary border border-white/10 rounded px-2 py-1">
                        {activeJob.company}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ContextSwitcher;
