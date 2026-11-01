export default function TrustArcLogo({ className = "" }) {
  return <svg viewBox="0 0 100 118" className={className} aria-label="TrustArc logo" role="img" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="v2-ta-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#A855F7"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient>
      <linearGradient id="v2-ta-bottom" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6366F1"/><stop offset="100%" stopColor="#3B82F6"/></linearGradient>
    </defs>
    <path d="M50 4 L13 16 C11 17 9 19 9 22 L9 62 C9 85 28 103 50 114 C72 103 91 85 91 62 L91 22 C91 19 89 17 87 16 Z" fill="url(#v2-ta-top)"/>
    <path d="M9 60 Q30 72 50 69 Q70 66 91 60 L91 62 C91 85 72 103 50 114 C28 103 9 85 9 62 Z" fill="url(#v2-ta-bottom)"/>
    <path d="M9 60 Q30 74 50 71 Q70 68 91 60" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/>
    <text x="50" y="57" textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="900" fontSize="50" fontFamily="Arial,sans-serif">T</text>
  </svg>;
}
