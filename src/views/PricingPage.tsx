'use client';

import { useRouter } from 'next/navigation';
import { Check, ArrowLeft } from 'lucide-react';
import Footer from '@/src/components/layout/Footer';

interface Plan {
  id: string;
  name: string;
  description: string;
  priceINR: number;
  usageLimit: string;
  features: string[];
  recommended: boolean;
  ctaText: string;
  ctaSubtext?: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'FREE',
    description: 'Always available for new sign-ups',
    priceINR: 0,
    usageLimit: '2 Job Application Slots',
    features: [
      '1x Strategic AI Resume Analysis & Scoring',
      '1x Tailored Cover Letter Generation',
      '1x Company Intelligence Brief',
      '1x LinkedIn Outreach (New Connection or Re-engage)',
      '1x Interview Prep (10 custom Q&As + Cheat Codes)',
    ],
    recommended: false,
    ctaText: 'Start Your First 2 Jobs Free',
    ctaSubtext: 'First time here? Your first two applications are on us so you can see the magic for yourself.',
  },
  {
    id: 'essentials',
    name: 'ESSENTIALS',
    description: 'Ideal for focused seekers applying to specific, high-priority roles.',
    priceINR: 399,
    usageLimit: '5 Total Job Application Slots',
    features: [
      '1x Strategic AI Resume Analysis & Scoring',
      '1x Tailored Cover Letter Generation',
      '1x Company Intelligence Brief',
      '1x LinkedIn Outreach (New Connection or Re-engage)',
      '1x Interview Prep (10 custom Q&As + Cheat Codes)',
    ],
    recommended: false,
    ctaText: 'Start Applying Smarter',
  },
  {
    id: 'professional',
    name: 'PROFESSIONAL',
    description: 'The strategic standard for active job seekers targeting multiple industries.',
    priceINR: 599,
    usageLimit: '20 Total Job Application Slots',
    features: [
      '1x Strategic AI Resume Analysis & Scoring',
      '1x Tailored Cover Letter Generation',
      '1x Company Intelligence Brief',
      '1x LinkedIn Outreach (New Connection or Re-engage)',
      '1x Interview Prep (10 custom Q&As + Cheat Codes)',
    ],
    recommended: true,
    ctaText: 'Secure Your Next Role',
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    description: 'For power users and career coaches requiring maximum volume and speed.',
    priceINR: 1499,
    usageLimit: '50 Total Job Application Slots',
    features: [
      '1x Strategic AI Resume Analysis & Scoring',
      '1x Tailored Cover Letter Generation',
      '1x Company Intelligence Brief',
      '1x LinkedIn Outreach (New Connection or Re-engage)',
      '1x Interview Prep (10 custom Q&As + Cheat Codes)',
    ],
    recommended: false,
    ctaText: 'Master Your Career Search',
  },
];

const PricingPage: React.FC = () => {
    const router = useRouter();

    const handleSelectPlan = (planId: string) => {
        // Navigate to app with selected plan
        router.push(`/app?plan=${planId}`);
    };

    // Format INR price
    const formatPrice = (price: number): string => {
        if (price === 0) return '0';
        return price.toLocaleString('en-IN');
    };

    return (
        <div className="min-h-screen bg-surface-base text-text-primary font-sans flex flex-col">

            {/* Header */}
            <header className="px-6 py-6 border-b border-white/5 sticky top-0 bg-surface-base/90 backdrop-blur z-20">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors font-interstate text-xs font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="font-tiempos text-xl font-bold">Rtios AI Pricing</div>
                    <div className="w-20"></div> {/* Spacer for alignment */}
                </div>
            </header>

            <main className="flex-1 py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h1 className="font-tiempos text-4xl md:text-5xl font-bold text-text-primary">
                            Invest in Your Career Narrative.
                        </h1>
                        <p className="font-interstate text-text-secondary max-w-xl mx-auto">
                            Simple, transparent, and built for results. Choose the level of strategic depth you need.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
                        {plans.map((plan) => {
                            return (
                                <div
                                    key={plan.id}
                                    className={`relative h-full flex flex-col p-8 rounded-lg border transition-all duration-300
                                        ${
                                            plan.recommended
                                                ? 'bg-surface-elevated border-accent shadow-[0_0_30px_rgba(0,255,127,0.05)] scale-105 z-10'
                                                : 'bg-surface-base border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {/* Recommended Badge */}
                                    {plan.recommended && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-surface-base border border-accent text-accent px-3 py-1 rounded-full text-[10px] font-interstate font-bold uppercase tracking-widest">
                                            Most Popular
                                        </div>
                                    )}

                                    {/* Plan Name & Description */}
                                    <div className="mb-8 pt-6">
                                        <h3 className="font-tiempos text-2xl font-bold mb-2">{plan.name}</h3>
                                        <p className="font-interstate text-xs text-text-secondary min-h-[40px]">
                                            {plan.description}
                                        </p>
                                    </div>

                                    {/* Pricing */}
                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-interstate text-sm text-text-secondary">₹</span>
                                            <span className="font-tiempos text-4xl font-bold">
                                                {formatPrice(plan.priceINR)}
                                            </span>
                                            {plan.priceINR > 0 && (
                                                <span className="font-interstate text-sm text-text-secondary">/mo</span>
                                            )}
                                        </div>

                                        {/* Usage Limit */}
                                        <div className="mt-3 font-interstate text-xs font-bold text-accent uppercase tracking-wide">
                                            {plan.usageLimit}
                                        </div>
                                    </div>

                                    {/* Features List */}
                                    <div className="flex-1 mb-8">
                                        <ul className="space-y-4">
                                            {plan.features.map((feature) => (
                                                <li key={feature} className="flex items-start gap-3">
                                                    <div
                                                        className={`mt-0.5 p-0.5 rounded-full flex-shrink-0 ${
                                                            plan.recommended
                                                                ? 'bg-accent text-surface-base'
                                                                : 'bg-white/10 text-text-secondary'
                                                        }`}
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                    <span
                                                        className={`text-sm ${
                                                            plan.recommended ? 'text-text-primary' : 'text-text-secondary'
                                                        }`}
                                                    >
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => handleSelectPlan(plan.id)}
                                        className={`w-full py-4 rounded font-interstate font-bold text-xs uppercase tracking-widest transition-all
                                            ${
                                                plan.recommended
                                                    ? 'bg-accent text-surface-base hover:bg-white'
                                                    : 'bg-white/5 text-text-primary hover:bg-white/10 border border-white/10'
                                            }`}
                                    >
                                        {plan.ctaText}
                                    </button>

                                    {/* CTA Subtext (for free tier) */}
                                    {plan.ctaSubtext && (
                                        <p className="mt-3 text-center font-interstate text-[10px] text-text-secondary leading-relaxed">
                                            {plan.ctaSubtext}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PricingPage;
