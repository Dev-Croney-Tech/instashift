"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Zap, Sun, Moon } from "lucide-react";

// Custom inline SVG for Github to bypass compilation issues in some lucide versions
function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Detect theme on mount
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  return (
    <header className="w-full border-b border-border-glass bg-bg-deep/50 backdrop-blur-md sticky top-0 z-50 transition-all duration-300" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand/Logo */}
        <button
          onClick={onReset}
          className="flex items-center space-x-3 text-left focus:outline-none hover:opacity-85 transition-opacity duration-200 cursor-pointer"
          title="Retourner à l'accueil"
          type="button"
        >
          <div className="relative flex items-center justify-center w-10 h-10 overflow-hidden rounded-xl shadow-glow-cyan bg-bg-card border border-border-glass">
            <img src="/logo_instashift.png" alt="InstaShift Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-text-primary via-brand-indigo to-brand-purple bg-clip-text text-transparent Outfit">
              Insta<span className="text-brand-cyan">Shift</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium tracking-wide uppercase rounded-md bg-brand-purple/20 border border-brand-purple/30 text-brand-purple text-glow">
              OpenSource
            </span>
          </div>
        </button>

        {/* Security / Info badges & Actions */}
        <div className="flex items-center space-x-4">
          <div 
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-medium animate-fade-in"
            title="Toutes les données sont analysées dans votre navigateur. Aucun serveur impliqué."
            role="status"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline">100% Local & Sécurisé</span>
            <span className="inline md:hidden">Hors-ligne</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-lg bg-bg-item border border-border-glass text-text-secondary hover:text-brand-purple hover:bg-bg-item-hover hover:border-border-glass-hover transition-all duration-200 cursor-pointer"
            aria-label="Changer de thème"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Github Button */}
          <a
            href="https://github.com/Dev-Croney-Tech/instashift"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2 rounded-lg bg-bg-item border border-border-glass text-text-secondary hover:text-brand-purple hover:bg-bg-item-hover hover:border-border-glass-hover transition-all duration-200"
            aria-label="Code Source sur GitHub"
          >
            <GithubIcon className="w-5 h-5" />
          </a>
        </div>

      </div>
    </header>
  );
}
