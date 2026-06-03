interface IconProps {
  size?: number | undefined;
  className?: string | undefined;
}

function S({ size = 20, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function FlagIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M6 21V4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M6 4.5h10.5l-2.2 3.2 2.2 3.3H6z" fill="currentColor" stroke="none" />
      <path d="M3.5 21.5h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function MineIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
        <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" />
      </g>
      <circle cx="12" cy="12" r="5.2" fill="currentColor" />
      <circle cx="10.2" cy="10.2" r="1.3" fill="#fff" opacity="0.85" />
    </svg>
  );
}

export function ResetIcon({ size = 22, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v4.5h-4.5" />
    </S>
  );
}

export function PlayIcon({ size = 20, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <path d="M7 5l11 7-11 7z" fill="currentColor" stroke="none" />
    </S>
  );
}

export function InfinityIcon({ size = 20, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <path d="M6 9a3 3 0 1 0 0 6c2 0 3-2 6-3 3-1 4-3 6-3a3 3 0 1 1 0 6c-2 0-3-2-6-3-3-1-4-3-6-3z" />
    </S>
  );
}

export function GridIcon({ size = 20, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </S>
  );
}

export function FlameIcon({ size = 18, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <path
        d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .3-2 1-3 .2 1 .8 1.5 1.5 1.5C10 7 11 5 12 3z"
        fill="currentColor"
        stroke="none"
      />
    </S>
  );
}

export function ShareIcon({ size = 20, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="17" cy="6" r="2.4" />
      <circle cx="17" cy="18" r="2.4" />
      <path d="M8.1 11l6.8-3.7M8.1 13l6.8 3.7" />
    </S>
  );
}

export function GalleryIcon({ size = 20, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M5 17l4.5-4 3 2.5L16 12l3 3.5" />
    </S>
  );
}

export function HomeIcon({ size = 20, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9h12v-9" />
    </S>
  );
}

export function SettingsIcon({ size = 20, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M4.2 7l2.1 1.2M17.7 15.8L19.8 17M4.2 17l2.1-1.2M17.7 8.2L19.8 7" />
    </S>
  );
}

export function EyeIcon({ size = 20, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </S>
  );
}

export function LockIcon({ size = 18, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </S>
  );
}

export function BackIcon({ size = 22, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <path d="M15 5l-7 7 7 7" />
    </S>
  );
}

export function HeartShieldIcon({ size = 20, className }: IconProps) {
  return (
    <S size={size} className={className}>
      <path d="M12 3l7 2.5v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9v-5z" />
      <path
        d="M9.3 11.4c0-1 .8-1.6 1.5-1.6.5 0 .9.2 1.2.6.3-.4.7-.6 1.2-.6.7 0 1.5.6 1.5 1.6 0 1.4-1.8 2.6-2.7 3.2-.9-.6-2.7-1.8-2.7-3.2z"
        fill="currentColor"
        stroke="none"
      />
    </S>
  );
}
