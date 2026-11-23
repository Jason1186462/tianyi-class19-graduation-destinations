const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
};

export function SearchIcon({ size = 18, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <circle cx="10.8" cy="10.8" r="6.7" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4.1 4.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function DownloadIcon({ size = 17, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="M12 3.5v11.2m0 0 4.1-4.1M12 14.7l-4.1-4.1M5 18.5c1.8 1.8 11.2 1.8 13 0M5.1 20.1h13.8"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon({ size = 16, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="m6.8 9 5.2 5.2L17.2 9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 18, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="m14.7 5.8-6 6.2 6 6.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon({ size = 18, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="m9.3 5.8 6 6.2-6 6.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon({ size = 20, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MapPinIcon({ size = 17, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="M19 10.1c0 5-7 10.1-7 10.1S5 15.1 5 10.1a7 7 0 1 1 14 0Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.35" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function PencilIcon({ size = 17, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="m4.8 19.2 3.8-.8L18.8 8.2a2.3 2.3 0 0 0-3.2-3.2L5.4 15.2l-.6 4Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m13.9 6.5 3.6 3.6"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SparkIcon({ size = 18, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="M12 3.2c.4 4.7 2.8 7.2 7.4 7.6-4.6.4-7 2.9-7.4 7.5-.4-4.6-2.8-7.1-7.4-7.5 4.6-.4 7-2.9 7.4-7.6Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SortIcon({ size = 15, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="M8 5v14m0 0-3-3m3 3 3-3M16 19V5m0 0-3 3m3-3 3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FilterIcon({ size = 17, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="M4 6.5h16M7 12h10m-7 5.5h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ArrowUpRightIcon({ size = 16, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="M7 17 17 7m-8 0h8v8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon({ size = 18, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MinusIcon({ size = 18, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function LocateIcon({ size = 18, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="5.1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path
        d="M12 3.4v3m0 11.2v3M3.4 12h3m11.2 0h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ResetIcon({ size = 17, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="M5.3 8.2A7.4 7.4 0 1 1 4.8 15m.5-6.8V4.6m0 3.6h3.8"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BotanicalMark({ className = "" }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="42"
      height="42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="23" fill="currentColor" opacity=".08" />
      <path d="M24 39V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M23.7 24.8c-7.4-.2-10.3-3.4-10.4-9.8 6.7-.2 10.2 3.2 10.4 9.8Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path
        d="M24.2 20.3c.2-6.7 3.2-10 9.8-10.3.2 6.6-3.1 10-9.8 10.3Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path
        d="M24 33c5.8.1 8.7-2.4 9.3-7.8-5.7-.2-8.9 2.4-9.3 7.8Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path
        d="M23.8 29.1c-5.6.2-8.5-2.2-9.2-7.4 5.6-.2 8.8 2.3 9.2 7.4Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MapIcon({ size = 20, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="m4.2 6.7 5-2.1 5.5 2.1 5.1-2.1v12.7l-5.1 2.1-5.5-2.1-5 2.1V6.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.2 4.6v12.7m5.5-10.6v12.7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PeopleIcon({ size = 20, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.8 19c.4-3.5 2.2-5.4 5.2-5.4s4.8 1.9 5.2 5.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15.3 5.4a3 3 0 0 1 0 5.7m1 2.7c2.4.3 3.8 2 4.1 5.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChartIcon({ size = 20, className = "" }) {
  return (
    <svg {...iconProps} width={size} height={size} className={className}>
      <path
        d="M4 19.5h16M6.5 17V11m5.5 6V5.5m5.5 11.5v-8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
