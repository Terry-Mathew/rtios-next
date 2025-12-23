
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { auth } from '@/src/services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialMode = 'signup' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await auth.signUp(email, password);
        if (err) throw err;
        if (data?.session) {
          onSuccess();
        } else {
          setMessage('Check your email to confirm your account.');
        }
      } else {
        const { error: err } = await auth.signInWithPassword(email, password);
        if (err) throw err;
        onSuccess();
      }
    } catch (e: any) {
      setError(e?.message ?? 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-surface-base/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-surface-elevated border border-text-secondary/20 shadow-2xl rounded-lg overflow-hidden animate-fade-in-up">
        
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close modal"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10">
            {/* Header */}
            <h2 className="font-tiempos text-2xl md:text-3xl font-bold text-text-primary text-center mb-8">
                {mode === 'signup' ? 'Welcome to Rtios AI' : 'Welcome Back'}
            </h2>

            {/* Google Button */}
            <button 
                onClick={async () => {
                  setError(null);
                  setMessage(null);
                  setLoading(true);
                  try {
                    const { error: err } = await auth.signInWithOAuth('google');
                    if (err) throw err;
                  } catch (e: any) {
                    setError(e?.message ?? 'OAuth failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-surface-elevated border border-white/20 hover:border-white/30 hover:bg-surface-elevated/80 text-text-primary rounded transition-all mb-2 group"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        className="text-[#4285F4] group-hover:text-[#3367D6]"
                    />
                    <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        className="text-[#34A853] group-hover:text-[#2d9147]"
                    />
                    <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        className="text-[#FBBC05] group-hover:text-[#d9a304]"
                    />
                    <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        className="text-[#EA4335] group-hover:text-[#c5382c]"
                    />
                </svg>
                <span className="font-interstate text-sm font-medium">Continue with Google</span>
            </button>
            <p className="text-center font-interstate text-xs text-text-secondary mb-6">
                {mode === 'signup' ? "You'll analyze your first resume in under 60 seconds." : "Welcome back to your career command center."}
            </p>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="font-interstate text-xs text-text-secondary">OR</span>
                <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-interstate text-xs text-text-secondary mb-1.5">Email Address</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-surface-base border border-white/10 rounded px-4 py-2.5 text-text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-interstate"
                        placeholder="name@example.com"
                        required
                    />
                </div>
                <div>
                    <label className="block font-interstate text-xs text-text-secondary mb-1.5">Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-surface-base border border-white/10 rounded px-4 py-2.5 text-text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-interstate"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && (
                  <div className="text-red-500 text-xs font-interstate">{error}</div>
                )}
                {message && (
                  <div className="text-text-secondary text-xs font-interstate">{message}</div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-2 bg-accent hover:bg-accent-hover disabled:bg-accent/60 disabled:cursor-not-allowed text-white font-interstate font-bold text-sm tracking-widest uppercase rounded transition-all"
                >
                    {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                </button>
            </form>

            {/* Footer Switch */}
            <div className="mt-6 text-center">
                <p className="font-interstate text-xs text-text-secondary">
                    {mode === 'signup' ? "Already have an account?" : "Don't have an account?"}
                    <button 
                        onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                        className="ml-2 text-text-primary hover:text-accent font-medium underline underline-offset-4 decoration-white/20 hover:decoration-accent transition-all"
                    >
                        {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
