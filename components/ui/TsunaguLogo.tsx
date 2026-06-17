interface TsunaguLogoProps {
  className?: string;
  strokeWidth?: number;
}

export default function TsunaguLogo({ className, strokeWidth = 2.2 }: TsunaguLogoProps) {
  return (
    <svg
      viewBox="0 0 36 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Left circle */}
      <circle cx="12" cy="12" r="10" />
      {/* Right circle */}
      <circle cx="24" cy="12" r="10" />
      {/* Inner ring centered in the overlap */}
      <circle cx="18" cy="12" r="3.5" />
    </svg>
  );
}
