
import React from 'react';
import { ResearchResult } from '@/src/types';
import { Building2, ExternalLink, Globe } from 'lucide-react';
import ReactMarkdown, { Components } from 'react-markdown';

// Whitelist of allowed markdown elements for security
const ALLOWED_ELEMENTS = [
  'p', 'br', 'strong', 'em', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'a'
];

// Safe link renderer - only allows http/https protocols
const SafeLink: Components['a'] = ({ href, children }) => {
  let url: URL;
  try {
    url = new URL(href || '', window.location.origin);
  } catch {
    return <span>{children}</span>;
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return <span>{children}</span>;
  }
  return (
    <a
      href={url.toString()}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-accent hover:underline"
    >
      {children}
    </a>
  );
};

interface CompanyResearchDisplayProps {
  research: ResearchResult | null;
}

const CompanyResearchDisplay: React.FC<CompanyResearchDisplayProps> = React.memo(function CompanyResearchDisplay({ research }) {
  if (!research) return (
    <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-30">
      <Globe className="w-12 h-12 mb-4 text-text-secondary" />
      <p className="font-interstate text-sm text-text-secondary">Awaiting Intelligence Report...</p>
    </div>
  );

  return (
    <div className="h-full bg-surface-elevated overflow-y-auto p-6 custom-scrollbar">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
        <div className="p-2 bg-white/5 rounded border border-white/10">
          <Building2 className="w-5 h-5 text-text-primary" />
        </div>
        <div>
          <h3 className="font-tiempos text-lg font-bold text-text-primary">Reconnaissance Dossier</h3>
          <p className="font-interstate text-[10px] text-text-secondary uppercase tracking-widest">
            Deep-Dive Target Intelligence
          </p>
        </div>
      </div>

      {/* Content - Hardened ReactMarkdown */}
      <div className="mb-8">
        <article className="prose prose-invert prose-p:font-sans prose-p:text-text-secondary prose-p:text-sm prose-p:leading-relaxed prose-headings:font-tiempos prose-headings:text-text-primary prose-strong:text-white prose-li:text-text-secondary prose-li:text-sm prose-a:text-accent prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown
            allowedElements={ALLOWED_ELEMENTS}
            unwrapDisallowed
            components={{ a: SafeLink }}
          >
            {research.summary}
          </ReactMarkdown>
        </article>
      </div>

      {/* Sources */}
      {research.sources.length > 0 && (
        <div className="bg-surface-base rounded-lg p-4 border border-white/5">
          <h4 className="font-interstate text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
            <ExternalLink className="w-3 h-3" />
            Verified Sources
          </h4>
          <ul className="space-y-2">
            {research.sources.map((source, idx) => (
              <li key={idx} className="overflow-hidden">
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-xs text-text-secondary hover:text-accent transition-colors group font-interstate"
                >
                  <span className="text-white/20">[{idx + 1}]</span>
                  <span className="truncate opacity-70 group-hover:opacity-100 border-b border-transparent group-hover:border-accent/50 pb-0.5">{source.title || source.uri}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

export default CompanyResearchDisplay;
