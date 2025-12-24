
import React from 'react';
import { AnalysisResult } from '@/src/types';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, TrendingUp, Search, Target } from 'lucide-react';

interface ResumeAnalysisDisplayProps {
    analysis: AnalysisResult | null;
}

const ResumeAnalysisDisplay: React.FC<ResumeAnalysisDisplayProps> = ({ analysis }) => {
    if (!analysis) return (
        <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-30">
            <Target className="w-12 h-12 mb-4 text-text-secondary" />
            <p className="font-interstate text-sm text-text-secondary">Awaiting Intelligence Report...</p>
        </div>
    );

    const scoreData = [{ name: 'Score', value: analysis.score, fill: analysis.score >= 80 ? '#059669' : analysis.score >= 60 ? '#FACC15' : '#FF6B6B' }];

    // Simple parser to create bullet points from the compatibility text if it contains sentences
    const bullets = analysis.atsCompatibility.split('.').map(s => s.trim()).filter(s => s.length > 0);

    return (
        <div className="h-full bg-surface-elevated overflow-y-auto p-6 space-y-10 custom-scrollbar">

            {/* Header */}
            <div className="border-b border-white/5 pb-2">
                <h2 className="font-tiempos text-3xl font-bold text-text-primary">Fit Diagnostic</h2>
                <p className="text-text-secondary text-sm mt-2 font-normal">Precise assessment of your asset alignment.</p>
            </div>

            {/* Scoreboard Section */}
            <div className="flex flex-col items-center justify-center relative py-6 border-b border-white/5">
                <h3 className="font-interstate text-xs font-bold text-text-secondary uppercase tracking-[0.2em] mb-6">Alignment Index</h3>
                <div className="h-56 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="85%"
                            outerRadius="100%"
                            barSize={12}
                            data={scoreData}
                            startAngle={180}
                            endAngle={0}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={30}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
                        <span className={`font-tiempos text-7xl font-bold ${analysis.score >= 80 ? 'text-accent' : analysis.score >= 60 ? 'text-yellow-400' : 'text-alert-gap'}`}>
                            {analysis.score}
                        </span>
                    </div>
                </div>

                {/* Score Description - Bullets */}
                <div className="mt-4 w-full px-4">
                    <ul className="flex flex-col items-center gap-2 text-center">
                        {bullets.length > 0 ? bullets.map((bullet, idx) => (
                            <li key={idx} className="font-interstate text-xs font-bold text-text-primary uppercase tracking-wide flex items-center gap-2">
                                {analysis.score >= 70 ? <CheckCircle2 className="w-3 h-3 text-accent shrink-0" /> : <AlertTriangle className="w-3 h-3 text-alert-gap shrink-0" />}
                                {bullet}
                            </li>
                        )) : (
                            <li className="font-interstate text-xs font-bold text-text-primary uppercase tracking-wide flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-accent" /> Analysis Complete
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Missing Keywords - High Contrast Pills */}
            <div>
                <h4 className="flex items-center gap-2 font-interstate text-xs font-bold text-text-primary uppercase tracking-widest mb-4">
                    <Search className="w-4 h-4 text-text-secondary" />
                    Keyword Gaps
                </h4>
                {analysis.missingKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {analysis.missingKeywords.map((keyword, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-alert-gap text-text-primary rounded-md font-interstate text-xs font-bold shadow-sm tracking-wide">
                                {keyword}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="text-accent flex items-center gap-2 text-sm font-medium p-3 bg-accent/5 rounded border border-accent/20">
                        <CheckCircle2 className="w-4 h-4" /> Optimization Complete.
                    </div>
                )}
            </div>

            {/* Recommendations - Editorial List Style */}
            <div>
                <h4 className="flex items-center gap-2 font-interstate text-xs font-bold text-text-primary uppercase tracking-widest mb-4">
                    <TrendingUp className="w-4 h-4 text-text-secondary" />
                    Optimization Strategy
                </h4>
                <ul className="space-y-4">
                    {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-5 items-start p-5 bg-surface-base rounded-lg border border-white/5 hover:border-white/10 transition-colors group">
                            <span className="font-tiempos text-4xl font-bold text-accent italic leading-none opacity-80 group-hover:opacity-100 transition-opacity">
                                0{idx + 1}
                            </span>
                            <span className="text-text-primary text-sm leading-relaxed font-sans pt-1.5 opacity-90">{rec}</span>
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    );
};

// Memoize to prevent unnecessary re-renders
const ResumeAnalysisDisplayMemo = React.memo(ResumeAnalysisDisplay, (prevProps, nextProps) => {
    // Re-render only if analysis actually changed
    return prevProps.analysis?.score === nextProps.analysis?.score &&
        prevProps.analysis?.atsCompatibility === nextProps.analysis?.atsCompatibility &&
        prevProps.analysis?.missingKeywords?.length === nextProps.analysis?.missingKeywords?.length &&
        prevProps.analysis?.recommendations?.length === nextProps.analysis?.recommendations?.length;
});
ResumeAnalysisDisplayMemo.displayName = 'ResumeAnalysisDisplay';
export default ResumeAnalysisDisplayMemo;
