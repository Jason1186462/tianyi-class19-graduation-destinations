const tonePairs = [
  ["#c8d4c4", "#263a34"],
  ["#ead4c3", "#713b2f"],
  ["#cfdbe6", "#2e4b65"],
  ["#dfd2c4", "#4a3a32"],
  ["#d7dec8", "#3e513d"],
  ["#ead3ca", "#5d3532"],
];

function hashName(name) {
  return [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
}

export default function Avatar({ name, size = 48, className = "" }) {
  const hash = hashName(name);
  const [background, ink] = tonePairs[hash % tonePairs.length];
  const hairVariant = hash % 4;
  const isLongHair = hash % 3 === 0;

  return (
    <span
      className={`avatar ${className}`}
      style={{
        "--avatar-size": `${size}px`,
        "--avatar-bg": background,
        "--avatar-ink": ink,
      }}
      title={`${name}的班级成员标识`}
      aria-label={`${name}的班级成员标识`}
    >
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M15 62c1.2-12.7 7.1-19.4 17-19.4S47.8 49.3 49 62"
          fill="var(--avatar-bg)"
          stroke="var(--avatar-ink)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M27 40h10v8.8H27z" fill="#f7ede0" stroke="var(--avatar-ink)" strokeWidth="1.8" />
        <ellipse
          cx="32"
          cy="29"
          rx="11.1"
          ry="13.2"
          fill="#f7ede0"
          stroke="var(--avatar-ink)"
          strokeWidth="1.8"
        />
        {isLongHair && (
          <path
            d="M20.8 27.4c-.2 9.4.9 13.8 4.3 16.1l2.5-8.1m15.6-8c.2 9.4-.9 13.8-4.3 16.1l-2.5-8.1"
            fill="var(--avatar-ink)"
            stroke="var(--avatar-ink)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        )}
        {hairVariant === 0 && (
          <path
            d="M21.4 27.7c-.5-8.2 3.4-12.2 10.6-12.2 7.3 0 11.3 4.2 10.7 12.7-2.7-.8-4.9-2.8-6.3-6.1-3.8 3-7.7 3.9-15 3.9v1.7Z"
            fill="var(--avatar-ink)"
          />
        )}
        {hairVariant === 1 && (
          <path
            d="M21.3 26.9c-1.2-8.8 2.5-12.4 11.3-12.4 7.8 0 11.3 4.2 10.1 13.1-3.3-1.4-5.7-4.3-7-8.3-2.9 3.4-7.5 4.8-14.4 4.6v3Z"
            fill="var(--avatar-ink)"
          />
        )}
        {hairVariant === 2 && (
          <path
            d="M20.8 27.7c-.8-9.3 3.4-13 10.8-13 8.6 0 12.2 4.5 11.1 13.8-2.3-2.5-4.4-5.7-5.4-9.4-4 3.3-8.6 4.2-16.5 4.3v4.3Z"
            fill="var(--avatar-ink)"
          />
        )}
        {hairVariant === 3 && (
          <path
            d="M21.4 28.5c-1-9.5 3-13.8 10.7-13.8 8 0 11.6 4.4 10.6 13.9-2.9-1.2-4.8-4.5-5.7-9.8-4 2.7-8.7 3.7-15.6 3.7v6Z"
            fill="var(--avatar-ink)"
          />
        )}
        <circle cx="27.5" cy="29.1" r=".8" fill="var(--avatar-ink)" />
        <circle cx="36.5" cy="29.1" r=".8" fill="var(--avatar-ink)" />
        <path
          d="M29.3 34.4c1.8 1.1 3.6 1.1 5.4 0"
          stroke="var(--avatar-ink)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
