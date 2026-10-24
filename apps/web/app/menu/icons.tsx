type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function LogoIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 11.5h16a8 8 0 0 1-16 0Z" fill="currentColor" stroke="none" />
      <path d="M8.5 8.5c0-1.3 1-1.9 1-3.2M12 8.5c0-1.3 1-1.9 1-3.2M15.5 8.5c0-1.3 1-1.9 1-3.2" />
    </svg>
  );
}

export function ChairIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <rect x="5" y="10" width="14" height="6" rx="2" />
      <path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M7 16v3M17 16v3" />
    </svg>
  );
}

export function InfoIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function PlusIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function TrashIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v5M14 11v5" />
    </svg>
  );
}

export function ClockIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function ReceiptIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

export function BagIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M5.5 8h13l1 13h-15l1-13Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2M9 12h.01M15 12h.01" />
    </svg>
  );
}

export function ClocheIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 11V8.5" />
      <circle cx="12" cy="7" r="1.3" />
    </svg>
  );
}

export function BellIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 20h4" />
    </svg>
  );
}

export function CheckIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function PhoneIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M7 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5L16 12.5 20 14v3a2 2 0 0 1-2 2A14 14 0 0 1 5 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function RefreshIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6.1 9a7 7 0 0 1 11.3-2L20 9M4 15l2.6 2A7 7 0 0 0 18 15" />
    </svg>
  );
}

export function LeafIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M19 4C10 4 5 8 5 15c0 3 2 5 5 5 7 0 9-6 9-16Z" />
      <path d="M4 21c2.5-5 6-8 11-10" />
    </svg>
  );
}

export function SparkIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M12 3c.6 4.8 2.2 6.4 7 7-4.8.6-6.4 2.2-7 7-.6-4.8-2.2-6.4-7-7 4.8-.6 6.4-2.2 7-7Z" />
      <path d="M19 17c.2 1.8.9 2.5 2.7 2.7-1.8.2-2.5.9-2.7 2.7-.2-1.8-.9-2.5-2.7-2.7 1.8-.2 2.5-.9 2.7-2.7Z" />
    </svg>
  );
}

export function CloseIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function BowlIcon({ size = 20, className, strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} strokeWidth={strokeWidth}>
      <path d="M3.5 11h17a8.5 8.5 0 0 1-17 0Z" />
      <path d="M8 21h8M9 8c0-1.4 1-2 1-3.4M13.5 8c0-1.4 1-2 1-3.4" />
    </svg>
  );
}
