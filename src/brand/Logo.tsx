/** Placeholder broken-circle mark (original artwork). Swap for the official logo SVG. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="Brand mark" fill="none">
      <path d="M26 9.5A11.5 11.5 0 1 0 26 22.5" stroke="var(--brand-primary)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3.2" fill="var(--brand-accent)" />
    </svg>
  )
}
