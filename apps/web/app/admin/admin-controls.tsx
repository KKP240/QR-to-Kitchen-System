import styles from "./admin.module.css";

export function Icon({ name, size = 19 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    leaf: (
      <path d="M12 21V10M12 16C4 16 3 10 4 8c5-1 8 2 8 6M12 12c0-6 4-9 8-9 1 5-2 9-8 9" />
    ),
    menu: (
      <path d="M5 3v7m3-7v7M2 3v7c0 3 6 3 6 0M5 13v8M17 3c-4 5-4 10 0 10h2M19 3v18" />
    ),
    table: (
      <>
        <rect x="4" y="7" width="16" height="10" rx="3" />
        <path d="M7 7V4h10v3M5 17v3m14-3v3" />
      </>
    ),
    qr: (
      <path d="M3 9V3h6v6H3Zm12 0V3h6v6h-6ZM3 21v-6h6v6H3Zm12-6h3v3h3v3h-6v-6ZM12 3v3m0 6v3m6-3h3M3 12h3" />
    ),
    kitchen: (
      <path d="M3 11h18M5 11v9h14v-9M8 7a4 4 0 0 1 8 0M12 3V1M2 20h20" />
    ),
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    edit: <path d="m14 5 5 5M4 20l5-1L21 7l-5-5L4 14v6Z" />,
    heart: <path d="M12 21 3 12C-3 4 7-1 12 6c5-7 15-2 9 6l-9 9Z" />,
    print: <path d="M6 8V2h12v6M6 17H3V8h18v9h-3M6 14h12v8H6v-8Z" />,
    download: <path d="M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v1" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.info}
    </svg>
  );
}
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`${styles.toggle} ${checked ? styles.on : ""}`}
    >
      <span />
    </button>
  );
}
