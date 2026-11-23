export default function Footer() {
  return (
    <footer
      className="w-full border-t border-border-subtle bg-bg-canvas mt-auto py-6"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
          <span className="font-medium text-text-secondary">InstaShift</span>
          <span>·</span>
          <span>Ingénierie Open-Source (Licence MIT) par</span>
          <a
            href="https://dev.croney-tech.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary hover:text-brand-indigo underline underline-offset-4 transition-colors duration-150 font-medium"
          >
            Dev.Croney-Tech
          </a>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px] tabular-nums">
          <span className="text-text-muted">JSZip · IndexedDB · CSP Sandbox</span>
          <span>·</span>
          <a
            href="https://dev.croney-tech.fr/mentions-legales"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Mentions légales
          </a>
        </div>
      </div>
    </footer>
  );
}
