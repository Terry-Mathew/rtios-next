import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-surface-elevated border-t border-white/5 py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Brand */}
                    <div>
                        <h3 className="font-tiempos text-xl font-bold mb-4">Rtios AI</h3>
                        <p className="font-interstate text-xs text-text-secondary leading-relaxed">
                            Executive Intelligence for Career Strategy. Powered by advanced AI. Built for high performers.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-interstate text-xs font-bold uppercase tracking-widest text-text-secondary mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/pricing" className="font-interstate text-sm text-text-secondary hover:text-text-primary transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="font-interstate text-sm text-text-secondary hover:text-text-primary transition-colors">
                                    About
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-interstate text-xs font-bold uppercase tracking-widest text-text-secondary mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/terms" className="font-interstate text-sm text-text-secondary hover:text-text-primary transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="font-interstate text-sm text-text-secondary hover:text-text-primary transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookie" className="font-interstate text-sm text-text-secondary hover:text-text-primary transition-colors">
                                    Cookie Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 text-center">
                    <p className="font-interstate text-xs text-text-secondary">
                        © 2025 Rtios AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

