export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6l9 4 9-4" />
          <path d="M3 6v12l9 4 9-4V6" />
          <path d="M12 10v12" />
        </svg>
      </div>
      <div className="leading-tight">
        <span className="block text-lg font-bold tracking-tight text-white">Mantelek</span>
        {subtitle && (
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-brand-500">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}
