/**
 * Iconografía e ilustración exclusivas del login. Los trazos heredan
 * `currentColor` y los rellenos usan los tokens institucionales.
 */

function Icon({ children, size = 18, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function MailIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  );
}

export function LockIcon(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="10" width="16" height="10" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </Icon>
  );
}

export function EyeIcon(props) {
  return (
    <Icon {...props}>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Icon>
  );
}

export function EyeOffIcon(props) {
  return (
    <Icon {...props}>
      <path d="m3 3 18 18" />
      <path d="M10.6 6.3A10.9 10.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.7" />
      <path d="M6.6 6.6C3.9 8.4 2.5 12 2.5 12s3.5 6 9.5 6a10.6 10.6 0 0 0 4.3-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </Icon>
  );
}

export function ArrowRightIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

export function ArrowUpRightIcon(props) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </Icon>
  );
}

export function ShieldIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3 5 6v5c0 4.6 3 7.7 7 10 4-2.3 7-5.4 7-10V6l-7-3Z" />
      <path d="m9.2 12.2 2 2 3.8-4" />
    </Icon>
  );
}

export function AlertIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <path d="M12 16.3h.01" />
    </Icon>
  );
}

function FeatureIcon({ children }) {
  return (
    <span className="login-feature__icon" aria-hidden="true">
      <Icon size={17}>{children}</Icon>
    </span>
  );
}

export function TicketIcon() {
  return (
    <FeatureIcon>
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V7Z" />
      <path d="M10 5v2M10 11v2M10 17v2" strokeDasharray="2 2" />
    </FeatureIcon>
  );
}

export function CalendarIcon() {
  return (
    <FeatureIcon>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="M8.5 14h2M13.5 14h2M8.5 17h2" />
    </FeatureIcon>
  );
}

export function UserIcon() {
  return (
    <FeatureIcon>
      <circle cx="12" cy="8.5" r="3.2" />
      <path d="M5.5 20c.6-3.2 3-5 6.5-5s5.9 1.8 6.5 5" />
    </FeatureIcon>
  );
}

/**
 * Composición decorativa: una mesa de ayuda dentro del campus. No representa
 * datos reales; solo comunica solicitudes, reservas y acompanamiento.
 */
export function LoginIllustration() {
  return (
    <svg
      className="login-art"
      viewBox="0 0 560 330"
      role="img"
      aria-label="Ilustración de una mesa de ayuda universitaria con solicitudes, reservas y acompañamiento"
    >
      <defs>
        <pattern id="login-art-dots" width="15" height="15" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="1.1" fill="var(--color-border)" />
        </pattern>
      </defs>

      <circle cx="476" cy="58" r="46" fill="var(--color-primary)" opacity="0.2" />
      <circle cx="68" cy="282" r="18" fill="var(--color-primary)" opacity="0.38" />
      <rect x="26" y="142" width="42" height="108" fill="url(#login-art-dots)" opacity="0.9" />
      <path
        d="M40 102c60-46 126-58 196-36"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 10"
        opacity="0.8"
      />

      <g className="login-art__cap">
        <path d="M455 22 502 40l-47 18-47-18 47-18Z" fill="var(--color-primary)" />
        <path d="M428 49v18c0 8 54 8 54 0V49" fill="none" stroke="var(--color-ink)" strokeWidth="3" />
        <path d="M502 40v25" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="502" cy="68" r="4.5" fill="var(--color-primary)" stroke="var(--color-ink)" strokeWidth="2.5" />
      </g>

      <g className="login-art__panel">
        <rect x="88" y="72" width="384" height="216" rx="16" fill="var(--color-surface)" stroke="var(--color-border)" />
        <path d="M88 106h384" stroke="var(--color-border)" />
        <circle cx="108" cy="89" r="4" fill="var(--color-border)" />
        <circle cx="122" cy="89" r="4" fill="var(--color-border)" />
        <circle cx="136" cy="89" r="4" fill="var(--color-border)" />
        <rect x="360" y="83" width="92" height="12" rx="6" fill="var(--color-primary)" opacity="0.45" />

        <rect x="108" y="124" width="196" height="142" rx="12" fill="var(--color-surface-variant)" stroke="var(--color-border)" />
        <rect x="122" y="138" width="34" height="34" rx="9" fill="var(--color-primary)" />
        <path d="M131 155h16M131 161h10" stroke="var(--color-ink)" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="166" y="143" width="106" height="8" rx="4" fill="var(--color-ink)" opacity="0.75" />
        <rect x="166" y="157" width="72" height="7" rx="3.5" fill="var(--color-border)" />
        <rect x="122" y="190" width="76" height="20" rx="10" fill="var(--color-primary)" opacity="0.35" />
        <rect x="206" y="190" width="54" height="20" rx="10" fill="var(--color-border)" />
        <rect x="122" y="226" width="164" height="7" rx="3.5" fill="var(--color-border)" />
        <rect x="122" y="240" width="126" height="7" rx="3.5" fill="var(--color-border)" />

        <g className="login-art__float">
          <rect x="322" y="124" width="132" height="78" rx="12" fill="var(--color-surface)" stroke="var(--color-border)" />
          <rect x="338" y="139" width="28" height="28" rx="8" fill="var(--color-primary)" opacity="0.3" />
          <path d="M346 153h12M346 159h8" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
          <rect x="376" y="143" width="58" height="7" rx="3.5" fill="var(--color-ink)" opacity="0.7" />
          <rect x="376" y="156" width="40" height="6" rx="3" fill="var(--color-border)" />
          <rect x="338" y="178" width="96" height="8" rx="4" fill="var(--color-border)" />
        </g>

        <g className="login-art__float login-art__float--slow">
          <rect x="322" y="218" width="132" height="48" rx="14" fill="var(--color-surface-variant)" stroke="var(--color-border)" />
          <path d="M340 242h.01M352 242h.01M364 242h.01" stroke="var(--color-ink-muted)" strokeWidth="4" strokeLinecap="round" />
          <path d="M438 266l8 10 6-12" fill="var(--color-surface-variant)" />
        </g>

        <g className="login-art__float">
          <circle cx="468" cy="272" r="24" fill="var(--color-primary)" />
          <path d="m458 272 7 7 13-14" fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
