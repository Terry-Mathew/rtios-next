import React, { useState } from 'react';
import { LinkedInState, LinkedInMessageInput, JobInfo, CONNECTION_CONTEXTS, MESSAGE_INTENTS } from '@/src/types';
import { Send, Copy, RefreshCw, Check, MessageSquare, ChevronDown } from 'lucide-react';

interface LinkedInMessageGeneratorProps {
  jobInfo: JobInfo;
  linkedInState: LinkedInState;
  setLinkedInState: React.Dispatch<React.SetStateAction<LinkedInState>>;
  onGenerate: () => void;
  canGenerate: boolean;
}

const LinkedInMessageGenerator: React.FC<LinkedInMessageGeneratorProps> = ({
  linkedInState,
  setLinkedInState,
  onGenerate,
  canGenerate
}) => {
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { input, generatedMessage, isGenerating } = linkedInState;

  const handleInputChange = (field: keyof LinkedInMessageInput, value: string) => {
    setLinkedInState(prev => ({
      ...prev,
      input: { ...prev.input, [field]: value }
    }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard access denied:', err);
      // Fallback: user can still copy manually
    }
  };

  const wordCount = generatedMessage.trim().split(/\s+/).length;
  const isOptimalLength = wordCount >= 150 && wordCount <= 200;

  return (
    <div className="h-full flex flex-col md:flex-row bg-surface-base font-sans">

      {/* Input Panel */}
      <div className="w-full md:w-[400px] bg-surface-elevated border-r border-white/5 p-8 flex flex-col overflow-y-auto custom-scrollbar shrink-0">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded">
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <span className="font-interstate text-[10px] font-bold text-accent uppercase tracking-widest">
              Signal Protocol
            </span>
          </div>
          <h2 className="font-tiempos text-3xl font-bold text-text-primary">Network Signal</h2>
          <p className="text-text-secondary text-sm mt-3 font-normal">Deploy precision outreach to high-value targets.</p>
        </div>

        {/* 1. Target Audience - Radio Style */}
        <div className="mb-6">
          <label className="block text-[10px] font-interstate font-bold text-text-secondary uppercase tracking-widest mb-3">Target Sector</label>
          <div className="flex gap-2">
            {['NEW CONNECTION', 'RE-ENGAGE'].map((audience) => (
              <button
                key={audience}
                onClick={() => handleInputChange('connectionStatus', audience === 'NEW CONNECTION' ? 'new' : 'existing')}
                className={`
                  flex-1 py-2 px-4 rounded-md text-[10px] font-interstate font-bold uppercase tracking-wide transition-all duration-200 ease-in-out
                  ${(audience === 'NEW CONNECTION' && input.connectionStatus === 'new') || (audience === 'RE-ENGAGE' && input.connectionStatus === 'existing')
                    ? 'bg-accent/70 text-white shadow-lg scale-105 border-2 border-accent/60'
                    : 'bg-surface-elevated border-2 border-border-base text-text-secondary hover:border-accent/50 hover:text-text-primary'
                  }
                `}
              >
                {audience}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Recipient Details - Minimalist Inputs */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="group">
            <label className="block text-[10px] font-interstate font-bold text-text-secondary uppercase tracking-widest mb-2">
              Recipient
            </label>
            <input
              type="text"
              className="w-full bg-transparent border-b border-white/20 py-2 text-sm font-interstate text-text-primary focus:outline-none focus:border-accent transition-colors placeholder-text-secondary/60 uppercase"
              placeholder="NAME"
              value={input.recruiterName}
              onChange={(e) => handleInputChange('recruiterName', e.target.value)}
            />
          </div>
          <div className="group">
            <label className="block text-[10px] font-interstate font-bold text-text-secondary uppercase tracking-widest mb-2">
              Title
            </label>
            <input
              type="text"
              className="w-full bg-transparent border-b border-white/20 py-2 text-sm font-interstate text-text-primary focus:outline-none focus:border-accent transition-colors placeholder-text-secondary/60 uppercase"
              placeholder="ROLE"
              value={input.recruiterTitle}
              onChange={(e) => handleInputChange('recruiterTitle', e.target.value)}
            />
          </div>
        </div>

        <div className="h-px w-full bg-white/5 mb-8"></div>

        {/* 3. Strategy Configuration - Custom Dropdowns */}
        <div className="space-y-6 mb-8">
          <div className="relative">
            <label className="block text-[10px] font-interstate font-bold text-text-secondary uppercase tracking-widest mb-2">Connection Context</label>
            <div className="relative group">
              <select
                className="w-full appearance-none bg-surface-base border border-white/10 rounded-lg px-4 py-3 pr-10 text-xs font-interstate font-medium text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all cursor-pointer hover:border-white/20"
                value={input.connectionContext}
                onChange={(e) => handleInputChange('connectionContext', e.target.value)}
              >
                <option value="" disabled>Select Context</option>
                {CONNECTION_CONTEXTS.map(ctx => (
                  <option key={ctx} value={ctx}>{ctx}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none group-hover:text-text-primary transition-colors" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-[10px] font-interstate font-bold text-text-secondary uppercase tracking-widest mb-2">Message Intent</label>
            <div className="relative group">
              <select
                className="w-full appearance-none bg-surface-base border border-white/10 rounded-lg px-4 py-3 pr-10 text-xs font-interstate font-medium text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all cursor-pointer hover:border-white/20"
                value={input.messageIntent}
                onChange={(e) => handleInputChange('messageIntent', e.target.value)}
              >
                <option value="" disabled>Select Goal</option>
                {MESSAGE_INTENTS.map(intent => (
                  <option key={intent} value={intent}>{intent}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none group-hover:text-text-primary transition-colors" />
            </div>
          </div>
        </div>

        {/* Advanced Options - Collapsible Section */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-3 text-[10px] font-interstate font-bold text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors"
          >
            <span>Advanced Protocols</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="space-y-6 pt-4 animate-fade-in-up">
              {/* Tone Calibration */}
              <div>
                <label className="block text-[10px] font-interstate font-bold text-text-secondary uppercase tracking-widest mb-3">
                  Tone Calibration
                </label>
                <div className="flex flex-wrap gap-2">
                  {['WARM PROFESSIONAL', 'PROFESSIONAL', 'CASUAL CONFIDENT', 'INDUSTRY-SPECIFIC'].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => handleInputChange('tone', tone)}
                      className={`
                        py-2 px-4 rounded-md text-[10px] font-interstate font-bold uppercase tracking-wide transition-all duration-200 ease-in-out
                        ${input.tone === tone
                          ? 'bg-accent/70 text-white shadow-lg scale-105 border-2 border-accent/60'
                          : 'bg-surface-elevated border-2 border-border-base text-text-secondary hover:border-accent/50 hover:text-text-primary hover:scale-102'
                        }
                      `}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Missing Context */}
              <div>
                <label className="block text-[10px] font-interstate font-bold text-text-secondary uppercase tracking-widest mb-2">
                  Additional Context
                </label>
                <textarea
                  value={input.missingContext || ''}
                  onChange={(e) => handleInputChange('missingContext', e.target.value)}
                  placeholder="Add any additional context or details not covered above..."
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-elevated border-2 border-border-base rounded-md
                     text-sm text-text-primary placeholder-text-secondary/50
                     focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20
                     transition-all duration-200 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className={`w-full py-4 px-4 rounded-sm font-interstate font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg
              ${(!canGenerate || isGenerating)
              ? 'bg-white/5 text-text-secondary cursor-not-allowed border border-white/5'
              : 'bg-accent text-surface-base hover:bg-white hover:text-surface-base transform active:scale-[0.98]'
            } `}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              Transmitting Signal...
            </>
          ) : !canGenerate ? (
            "Complete Configuration"
          ) : (
            <>
              <Send className="w-3 h-3" />
              TRANSMIT SIGNAL
            </>
          )}
        </button>
      </div>

      {/* Output Panel */}
      <div className="flex-1 flex flex-col relative bg-surface-base">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-base">
          <div className="flex items-center gap-2 text-xs font-interstate text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            SIGNAL COMPOSITION
          </div>
          {generatedMessage && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 text-[10px] font-interstate font-bold uppercase tracking-widest text-text-secondary hover:text-accent transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'COPIED' : 'COPY TEXT'}
            </button>
          )}
        </div>

        <div className="flex-1 relative">
          {generatedMessage ? (
            <textarea
              className="w-full h-full p-8 md:p-12 resize-none focus:outline-none text-text-primary leading-[1.6] font-tiempos text-lg md:text-xl bg-surface-base placeholder:text-white/10 custom-scrollbar selection:bg-accent/30"
              value={generatedMessage}
              onChange={(e) => setLinkedInState(prev => ({ ...prev, generatedMessage: e.target.value }))}
              spellCheck={false}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary p-8 text-center opacity-30 pointer-events-none">
              <Send className="w-12 h-12 mb-4" />
              <p className="font-interstate text-sm">Configure outreach parameters to generate.</p>
            </div>
          )}
        </div>

        {generatedMessage && (
          <div className="absolute bottom-6 right-8 font-interstate text-[10px] text-text-secondary tracking-widest bg-surface-elevated/90 backdrop-blur px-3 py-1.5 rounded border border-white/10 shadow-xl flex items-center gap-3">
            <span className={isOptimalLength ? 'text-accent' : 'text-text-secondary'}>{wordCount} WORDS</span>
            <span className="w-px h-3 bg-white/10"></span>
            <span className={isOptimalLength ? 'text-accent font-bold' : 'text-text-secondary'}>{isOptimalLength ? 'OPTIMAL LENGTH' : 'ADJUST LENGTH'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(LinkedInMessageGenerator);

