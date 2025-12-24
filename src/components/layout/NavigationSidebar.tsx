import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hexagon, LayoutGrid, FileText, MessageSquare, Brain, Shield } from 'lucide-react';
import { useAppStore } from '@/src/stores/appStore';

interface NavigationSidebarProps {
    onLogoClick: () => void;
    onSnapshotBeforeDashboard?: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
    onLogoClick,
    onSnapshotBeforeDashboard
}) => {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);

    // Check if user is admin (client-side check for UI only, server validates)
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const res = await fetch('/api/admin/check-access');
                const data = await res.json();
                setIsAdmin(data.isAdmin || false);
            } catch {
                setIsAdmin(false);
            }
        };
        checkAdmin();
    }, []);

    // Get navigation state from store
    const currentView = useAppStore((s) => s.currentView);
    const activeModule = useAppStore((s) => s.activeModule);
    const setActiveModule = useAppStore((s) => s.setActiveModule);

    // Handler for dashboard navigation
    const handleDashboardClick = () => {
        if (onSnapshotBeforeDashboard) {
            onSnapshotBeforeDashboard();
        }
        router.push('/dashboard');
    };

    // Handler for module navigation
    const handleModuleClick = (module: 'coverLetter' | 'linkedin' | 'interview') => {
        setActiveModule(module);
        router.push('/app');
    };

    // Handler for admin navigation
    const handleAdminClick = () => {
        router.push('/admin');
    };

    return (
        <nav className={`
            fixed lg:relative
            bottom-0 lg:bottom-auto left-0 right-0 lg:right-auto lg:top-0
            h-16 lg:h-auto lg:w-20
            bg-surface-base border-t lg:border-t-0 lg:border-r border-white/5
            flex lg:flex-col items-center justify-around lg:justify-start
            px-2 lg:px-0 py-2 lg:py-6
            shrink-0 z-50
        `}>
            {/* Logo - Hidden on mobile */}
            <div className="hidden lg:block mb-8 cursor-pointer" onClick={onLogoClick}>
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,255,127,0.2)]">
                    <Hexagon className="w-6 h-6 text-surface-base fill-surface-base" />
                </div>
            </div>

            {/* Navigation Items - Horizontal on mobile, Vertical on desktop */}
            <div className="flex lg:flex-col items-center gap-1 lg:gap-6 lg:flex-1 lg:w-full lg:px-2">
                {/* Dashboard Button */}
                <button
                    onClick={handleDashboardClick}
                    className={`group flex flex-col items-center gap-0.5 lg:gap-1.5 p-2 lg:p-2 rounded-lg transition-all min-w-[52px] ${currentView === 'dashboard'
                        ? 'bg-white/5 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                        }`}
                >
                    <LayoutGrid className={`w-5 h-5 ${currentView === 'dashboard'
                        ? 'text-accent'
                        : 'text-text-secondary group-hover:text-text-primary'
                        }`} />
                    <span className="text-[8px] lg:text-[9px] font-interstate uppercase font-bold text-center">Command</span>
                </button>

                {/* Divider - Only on desktop */}
                <div className="hidden lg:block h-px w-full bg-white/10 my-2"></div>

                {/* Cover Letter Button */}
                <button
                    onClick={() => handleModuleClick('coverLetter')}
                    className={`group flex flex-col items-center gap-0.5 lg:gap-1.5 p-2 lg:p-2 rounded-lg transition-all min-w-[52px] ${activeModule === 'coverLetter' && currentView === 'app'
                        ? 'bg-white/5 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                        }`}
                >
                    <FileText className={`w-5 h-5 ${activeModule === 'coverLetter' && currentView === 'app'
                        ? 'text-accent'
                        : 'text-text-secondary group-hover:text-text-primary'
                        }`} />
                    <span className="text-[8px] lg:text-[9px] font-interstate uppercase font-bold">Pitch</span>
                </button>

                {/* LinkedIn Button */}
                <button
                    onClick={() => handleModuleClick('linkedin')}
                    className={`group flex flex-col items-center gap-0.5 lg:gap-1.5 p-2 lg:p-2 rounded-lg transition-all min-w-[52px] ${activeModule === 'linkedin' && currentView === 'app'
                        ? 'bg-white/5 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                        }`}
                >
                    <MessageSquare className={`w-5 h-5 ${activeModule === 'linkedin' && currentView === 'app'
                        ? 'text-accent'
                        : 'text-text-secondary group-hover:text-text-primary'
                        }`} />
                    <span className="text-[8px] lg:text-[9px] font-interstate uppercase font-bold">Signal</span>
                </button>

                {/* Interview Prep Button */}
                <button
                    onClick={() => handleModuleClick('interview')}
                    className={`group flex flex-col items-center gap-0.5 lg:gap-1.5 p-2 lg:p-2 rounded-lg transition-all min-w-[52px] ${activeModule === 'interview' && currentView === 'app'
                        ? 'bg-white/5 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                        }`}
                >
                    <Brain className={`w-5 h-5 ${activeModule === 'interview' && currentView === 'app'
                        ? 'text-accent'
                        : 'text-text-secondary group-hover:text-text-primary'
                        }`} />
                    <span className="text-[8px] lg:text-[9px] font-interstate uppercase font-bold text-center">War Room</span>
                </button>

                {/* Admin Button - Only visible to admins */}
                {isAdmin && (
                    <>
                        <div className="hidden lg:block h-px w-full bg-white/10 my-2"></div>
                        <button
                            onClick={handleAdminClick}
                            className={`group flex flex-col items-center gap-0.5 lg:gap-1.5 p-2 lg:p-2 rounded-lg transition-all min-w-[52px] ${currentView === 'admin'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10'
                                }`}
                        >
                            <Shield className={`w-5 h-5 ${currentView === 'admin'
                                ? 'text-red-400'
                                : 'text-red-400/60 group-hover:text-red-400'
                                }`} />
                            <span className="text-[8px] lg:text-[9px] font-interstate uppercase font-bold">Admin</span>
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};
