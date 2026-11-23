"use client";

import Image from "next/image";
import { ShieldCheck, Terminal } from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="1.75"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

interface HeaderProps {
  onReset?: () => void;
}

export default function Header({ onReset }: HeaderProps) {
  const handleResetClick = () => {
    if (onReset) {
      onReset();
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("instashift:reset"));
    }
  };

  return (
    <header
      className="w-full h-14 border-b border-border-subtle bg-bg-canvas/85 backdrop-blur-md sticky top-0 z-50"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Brand / Workbench Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetClick}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-indigo rounded-md py-1 px-1.5 -ml-1.5 hover:bg-surface-hover transition-colors duration-150 cursor-pointer group"
            title="Réinitialiser l'espace de travail et revenir à l'import"
            type="button"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-surface-2 border border-border-subtle group-hover:border-border-hover transition-colors">
              <Image
                src="/logo_instashift.png"
                alt="Logo InstaShift"
                width={20}
                height={20}
                unoptimized
                className="w-5 h-5 object-contain"
              />
            </div>
            <span className="font-semibold text-sm tracking-tight text-text-primary">
              InstaShift
            </span>
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono tabular-nums text-text-secondary bg-surface-2 border border-border-subtle rounded">
            <Terminal className="w-3 h-3 text-brand-indigo" />
            <span>v2.0.1 · MIT</span>
          </span>
        </div>

        {/* Hardware Security Badge & External Links */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-diff-add/10 border border-diff-add/25 text-diff-add text-[11px] font-mono tabular-nums tracking-tight"
            title="Exécution 100% locale dans le navigateur via JSZip et IndexedDB. Politique CSP verrouillée."
            role="status"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-diff-add animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 hidden xs:inline" />
            <span className="hidden md:inline">LOCAL SANDBOX · 0 NETWORK REQUESTS</span>
            <span className="inline md:hidden">0 NETWORK REQ</span>
          </div>

          <a
            href="https://github.com/Dev-Croney-Tech/instashift"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-border-subtle hover:border-border-hover hover:bg-surface-hover text-xs font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
            aria-label="Inspecter le code source sur GitHub"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
