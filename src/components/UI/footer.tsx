"use client";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border-glass bg-bg-deep/80 mt-auto py-8" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center text-xs text-text-muted space-y-3">
        
        {/* Line 1: Copyright & Propelled statement */}
        <p className="Outfit">
          © 2026 <span className="font-semibold text-text-secondary">InstaShift</span>. Outil Open-Source propulsé par{" "}
          <a 
            href="https://dev.croney-tech.fr" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-brand-purple hover:text-brand-cyan hover:underline font-semibold transition-all duration-200"
          >
            Dev.Croney-Tech
          </a>
        </p>
        
        {/* Line 2: Privacy Statement */}
        <p className="text-xs leading-relaxed max-w-md">
          Conçu pour le respect absolu de la vie privée. Aucune donnée ne quitte jamais votre appareil.
        </p>
        
        {/* Line 3: Legal Notice */}
        <a
          href="https://dev.croney-tech.fr/mentions-legales"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-muted hover:text-brand-purple hover:underline transition-all duration-200"
        >
          Mentions légales
        </a>

      </div>
    </footer>
  );
}
