'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { View } from '@/src/types';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/src/components/layout/Footer';

interface LegalPageProps {
    view: View;
}

const LegalPages: React.FC<LegalPageProps> = ({ view }) => {
    const router = useRouter();

    const getTitle = () => {
        switch (view) {
            case 'terms': return 'Terms of Service';
            case 'privacy': return 'Privacy Policy';
            case 'cookie': return 'Cookie Policy';
            case 'about': return 'About Rtios AI';
            default: return 'Legal';
        }
    };

    const getContent = () => {
        switch (view) {
            case 'terms':
                return (
                    <div className="space-y-6 text-sm text-text-secondary font-sans leading-relaxed">
                        <p><strong>Last Updated: October 2025</strong></p>
                        <p>Welcome to Rtios AI. By accessing or using our website and services, you agree to be bound by these Terms of Service.</p>

                        <h3 className="font-tiempos text-xl text-text-primary pt-4">1. Services Provided</h3>
                        <p>{`Rtios AI provides AI-powered career document analysis and generation services. We offer different tiers of service, including "Pulse," "Context," and "Executive," each with specific usage limits defined in our Pricing policy.`}</p>

                        <h3 className="font-tiempos text-xl text-text-primary pt-4">2. Usage Limits</h3>
                        <p>{`Users are subject to the specific "Analysis Uses" limit of their subscribed tier. An "Analysis Use" is defined as a single submission of a resume and job description pair for processing.`}</p>

                        <h3 className="font-tiempos text-xl text-text-primary pt-4">3. Content Ownership</h3>
                        <p>You retain all rights to the resumes and personal data you upload. Rtios AI claims no ownership over your generated content (cover letters, messages). You are granted a worldwide, royalty-free license to use the generated content for your personal career advancement.</p>

                        <h3 className="font-tiempos text-xl text-text-primary pt-4">4. Limitation of Liability</h3>
                        <p>Rtios AI is an AI tool designed to assist, not replace, professional judgment. We do not guarantee job interviews or offers. The generated content should be reviewed and verified by you before use.</p>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="space-y-6 text-sm text-text-secondary font-sans leading-relaxed">
                        <p><strong>Last Updated: October 2025</strong></p>
                        <p>Your privacy is paramount. This policy outlines how Rtios AI collects, uses, and protects your data.</p>

                        <h3 className="font-tiempos text-xl text-text-primary pt-4">1. Data Collection</h3>
                        <p>We collect personal information you provide, including your name, email, resume contents, and job application details. We process this data solely to provide the document generation service.</p>

                        <h3 className="font-tiempos text-xl text-text-primary pt-4">2. AI Processing</h3>
                        <p>Your data is processed by our AI providers to generate content. We do not use your personal resume data to train our core public models. Data is transiently processed for the duration of your session context.</p>

                        <h3 className="font-tiempos text-xl text-text-primary pt-4">3. Data Security</h3>
                        <p>We implement industry-standard encryption and security measures to protect your documents. However, no internet transmission is 100% secure.</p>
                    </div>
                );
            case 'cookie':
                return (
                    <div className="space-y-6 text-sm text-text-secondary font-sans leading-relaxed">
                        <p><strong>Last Updated: October 2025</strong></p>
                        <p>Rtios AI uses cookies to enhance your experience.</p>

                        <h3 className="font-tiempos text-xl text-text-primary pt-4">1. What are cookies?</h3>
                        <p>Cookies are small text files stored on your device. We use them to remember your session status and preferences.</p>

                        <h3 className="font-tiempos text-xl text-text-primary pt-4">2. Types of Cookies</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Essential:</strong> Required for login and site functionality.</li>
                            <li><strong>Analytics:</strong> Help us understand how the site is used (anonymous).</li>
                        </ul>

                        <h3 className="font-tiempos text-xl text-text-primary pt-4">3. Management</h3>
                        <p>You can control cookies through your browser settings. Disabling essential cookies may limit your ability to use the platform.</p>
                    </div>
                );
            case 'about':
                return (
                    <div className="space-y-6 text-sm text-text-secondary font-sans leading-relaxed">
                        <p className="font-tiempos text-2xl text-text-primary italic">{`"Strategy over automation."`}</p>
                        <p>Rtios AI was born from a frustration with generic, robotic career tools. We believe the job application process is a strategic campaign, not a numbers game.</p>
                        <p>{`Our mission is to arm candidates with deep, contextual intelligence that highlights their true value. We don't just write words; we align narratives.`}</p>
                        <p>Founded in 2025, Rtios AI operates at the intersection of advanced LLM technology and human-centric career strategy.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-surface-base text-text-primary font-sans flex flex-col">
            <header className="px-6 py-6 border-b border-white/5 sticky top-0 bg-surface-base/90 backdrop-blur z-20">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors font-interstate text-xs font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </button>
                    <div className="font-tiempos text-xl font-bold">Rtios AI</div>
                    <div className="w-16"></div>
                </div>
            </header>

            <main className="flex-1 py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="font-tiempos text-4xl font-bold mb-8">{getTitle()}</h1>
                    <div className="prose prose-invert max-w-none">
                        {getContent()}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default LegalPages;
